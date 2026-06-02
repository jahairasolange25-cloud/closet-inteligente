"""
Startup wrapper — starts responding immediately, imports real app in
background. Once real app is ready, it handles all requests.
Health endpoint always returns 200 so Render keeps the container alive.
"""
import logging
import os
import threading
import time

import uvicorn

real_app = None
import_done = False
import_error = None


def _do_import() -> None:
    global real_app, import_done, import_error  # noqa: PLW0628
    t0 = time.monotonic()
    try:
        from app.main import app  # noqa: F811
        real_app = app
        logging.info("main_app_imported duration_ms=%d", round((time.monotonic() - t0) * 1000))
    except Exception as exc:  # noqa: BLE001
        import_error = str(exc)
        logging.error("main_app_import_failed error=%s", exc)
    finally:
        import_done = True


threading.Thread(target=_do_import, daemon=True).start()


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

    if real_app is not None:
        await real_app(scope, receive, send)
        return

    # Always return 200 so Render keeps the container alive
    if import_error:
        body = ("loading (error: %s)" % import_error).encode()
    else:
        body = b"loading"
    await send({
        "type": "http.response.start",
        "status": 200,
        "headers": [(b"content-type", b"text/plain")],
    })
    await send({"type": "http.response.body", "body": body})


port = int(os.environ.get("PORT", os.environ.get("AI_PORT", "5100")))
uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
