from fastapi import APIRouter
from ..core.metrics import metrics_collector

router = APIRouter(tags=["metrics"])


@router.get("/metrics")
async def prometheus_metrics():
    return await metrics_collector.generate_prometheus_metrics(), 200, {
        "Content-Type": "text/plain; charset=utf-8",
    }
