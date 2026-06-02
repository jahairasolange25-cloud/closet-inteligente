"""
Minimal app wrapper — starts a health-responding server immediately,
then tries to import the real app.main in a background thread.
If the import succeeds, subsequent requests are handled by the real app.
Health endpoint always returns 200 so Render keeps the container alive.
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
    global real_app, import_done, import_error  # noqa: PLW0628
    t0 = time.monotonic()
    try:
        from app.main import app  # noqa: F811
        real_app = app
        elapsed = round((time.monotonic() - t0) * 1000)
        logging.info("main_app_imported duration_ms=%d", elapsed)
    except Exception as exc:  # noqa: BLE001
        import_error = str(exc)
        import traceback
        traceback.print_exc()
        logging.error("main_app_import_failed error=%s", exc)
    finally:
        import_done = True


t = threading.Thread(target=_do_import, daemon=True)
t.start()


def _watchdog() -> None:
    t.join(IMPORT_TIMEOUT_SECONDS)
    global import_done, import_error  # noqa: PLW0628
    if not import_done:
        import_error = "import timed out after %d seconds" % IMPORT_TIMEOUT_SECONDS
        import_done = True
        logging.warning("main_app_import_timed_out timeout=%d", IMPORT_TIMEOUT_SECONDS)


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

    # Delegate to real app if loaded
    if real_app is not None:
        await real_app(scope, receive, send)
        return

    # Always return 200 for health check
    path = scope.get("path", "")
    if path == "/health":
        status = 200
        if import_error:
            body = ("loading (last import error: %s)" % import_error).encode()
        else:
            body = b"loading"
    else:
        status = 500 if import_error else 200
        if import_error:
            body = ("import error: %s" % import_error).encode()
        else:
            body = b"loading"

    await send({
        "type": "http.response.start",
        "status": status,
        "headers": [(b"content-type", b"text/plain")],
    })
    await send({"type": "http.response.body", "body": body})


port = int(os.environ.get("PORT", os.environ.get("AI_PORT", "5100")))
uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
