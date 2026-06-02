import os

import uvicorn

MINIMAL = os.environ.get("MINIMAL_APP", "0") == "1"


if MINIMAL:

    async def app(scope, receive, send):
        await send({
            "type": "http.response.start",
            "status": 200,
            "headers": [(b"content-type", b"text/plain")],
        })
        await send({"type": "http.response.body", "body": b"OK"})

else:
    try:
        from app.main import app
        print("main app imported successfully", flush=True)
    except Exception as e:
        import traceback
        print(f"main app import FAILED: {e}", flush=True)
        traceback.print_exc()

        async def app(scope, receive, send):
            await send({
                "type": "http.response.start",
                "status": 500,
                "headers": [(b"content-type", b"text/plain")],
            })
            await send({"type": "http.response.body", "body": f"Import error: {e}".encode()})


port = int(os.environ.get("PORT", os.environ.get("AI_PORT", "5100")))
uvicorn.run(app, host="0.0.0.0", port=port, log_level="info")
