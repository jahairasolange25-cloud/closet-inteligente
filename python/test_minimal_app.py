"""
Minimal app wrapper — starts a health-responding server immediately,
then tries to import the real app.main in a background thread.
If the import succeeds, subsequent requests are handled by the real app.
If it fails or times out, the wrapper continues responding with 200/health.
"""
import logging
import os
import threading
import time

import uvicorn

IMPORT_TIMEOUT_SECONDS = 120

real_app = None
import_done = False
import_error = None


def _do_import() -> None:
    global real_app, import_done, import_error
    t0 = time.monotonic()
    try:
        from app.main import app  # noqa: F811
        real_app = app
        elapsed = round((time.monotonic() - t0) * 1000)
        logging.getLogger("startup").info("main_app_imported", extra={"duration_ms": elapsed})
    except Exception as exc:  # noqa: BLE001
        import_error = str(exc)
        import traceback
        traceback.print_exc()
        logging.getLogger("startup").error("main_app_import_failed", extra={"error": str(exc)})
    finally:
        global import_done  # noqa: PLW0628
        import_done = True


t = threading.Thread(target=_do_import, daemon=True)
t.start()

# Timeout watchdog — mark as error if import takes too long
def _watchdog() -> None:
    t.join(IMPORT_TIMEOUT_SECONDS)
    global import_done, import_error  # noqa: PLW0628
    if not import_done:
        import_error = "import timed out after {} seconds".format(IMPORT_TIMEOUT_SECONDS)
        import_done = True

threading.Thread(target=_watchdog, daemon=True).start()


async def app(scope: dict, receive: object, send: object) -> None:
    if scope["type"] == "lifespan":
        while True:
            msg = await receive()
            if msg["type"] == "lifespan.startup":
                await send({"type": "lifespan.startup.complete"})
            elif msg["type"] == "lifespan.shutdown":
                await send({"type": "lifespan.shutdown.complete"})
                return
        return

    # If real app is available, delegate
    if real_app is not None:
        await real_app(scope, receive, send)
        return

    # Minimal response while loading
    body = b"loading"
    status = 200
    if import_error:
        body = f"import error: {import_error}".encode()
        status = 500
    elif import_done and real_app is None:
        body = b"import completed but app is None (unexpected)"
        status = 500

    await send({
        "type": "http.response.start",
        "status": status,
        "headers": [(b"content-type", b"text/plain")],
    })
    await send({"type": "http.response.body", "body": body})


port = int(os.environ.get("PORT", os.environ.get("AI_PORT", "5100")))
uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
