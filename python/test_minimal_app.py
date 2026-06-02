"""
Minimal app wrapper — starts a health-responding server immediately,
then tries to import the real app.main in a background thread.

If the import succeeds, subsequent requests are handled by the real app.
If it fails, the wrapper continues responding with 200/health.
"""
import asyncio
import os
import threading
import time

import structlog
import uvicorn

logger = structlog.get_logger("startup")

real_app = None
import_done = False
import_error = None


def _do_import() -> None:
    global real_app, import_done, import_error
    t0 = time.monotonic()
    try:
        from app.main import app  # noqa: F811
        real_app = app
        logger.info("main_app_imported", duration_ms=round((time.monotonic() - t0) * 1000))
    except Exception as exc:  # noqa: BLE001
        import_error = str(exc)
        import traceback
        traceback.print_exc()
        logger.error("main_app_import_failed", error=str(exc))
    finally:
        import_done = True


class _LifespanHandler:
    """Captures lifespan messages and forwards them if real_app has a lifespan."""

    def __init__(self) -> None:
        self.startup_complete = False
        self.shutdown_requested = False


_lifespan = _LifespanHandler()


async def app(scope: dict, receive: object, send: object) -> None:
    if scope["type"] == "lifespan":
        while True:
            msg = await receive()
            if msg["type"] == "lifespan.startup":
                await send({"type": "lifespan.startup.complete"})
                _lifespan.startup_complete = True
            elif msg["type"] == "lifespan.shutdown":
                _lifespan.shutdown_requested = True
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

    await send({
        "type": "http.response.start",
        "status": status,
        "headers": [(b"content-type", b"text/plain")],
    })
    await send({"type": "http.response.body", "body": body})


# Start background import
t = threading.Thread(target=_do_import, daemon=True)
t.start()

port = int(os.environ.get("PORT", os.environ.get("AI_PORT", "5100")))
uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
