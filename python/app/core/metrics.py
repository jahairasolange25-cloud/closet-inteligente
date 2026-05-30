import time
import os
import threading
from typing import Dict


class MetricsCollector:
    def __init__(self):
        self.start_time = time.time()
        self.lock = threading.Lock()
        self._counters: Dict[str, int] = {}
        self._histograms: Dict[str, list] = {}

    @property
    def uptime_seconds(self) -> float:
        return time.time() - self.start_time

    def increment(self, name: str, count: int = 1):
        with self.lock:
            self._counters[name] = self._counters.get(name, 0) + count

    def observe(self, name: str, value: float):
        with self.lock:
            if name not in self._histograms:
                self._histograms[name] = []
            self._histograms[name].append(value)
            if len(self._histograms[name]) > 10000:
                self._histograms[name] = self._histograms[name][-5000:]

    def track_inference(self, model: str, duration_ms: float, success: bool):
        status = "success" if success else "failure"
        self.increment(f"ai_inferences_total{{model=\"{model}\",status=\"{status}\"}}")
        self.observe(f"ai_inference_duration_ms{{model=\"{model}\"}}", duration_ms)

    def track_pipeline_step(self, step: str, duration_ms: float, success: bool):
        status = "success" if success else "failure"
        self.increment(f"pipeline_steps_total{{step=\"{step}\",status=\"{status}\"}}")
        self.observe(f"pipeline_step_duration_ms{{step=\"{step}\"}}", duration_ms)

    def track_upload(self, size_bytes: int):
        self.increment("uploads_total")
        self.observe("upload_size_bytes", size_bytes)

    async def generate_prometheus_metrics(self) -> str:
        lines = []

        lines.append("# HELP ai_service_uptime_seconds AI service uptime")
        lines.append("# TYPE ai_service_uptime_seconds gauge")
        lines.append(f"ai_service_uptime_seconds {self.uptime_seconds}")

        lines.append("# HELP ai_service_start_time_seconds Start time")
        lines.append("# TYPE ai_service_start_time_seconds gauge")
        lines.append(f"ai_service_start_time_seconds {int(self.start_time)}")

        with self.lock:
            for key, value in self._counters.items():
                name = key.split("{")[0]
                labels = key.split("{")[1].rstrip("}") if "{" in key else ""
                line = f"closet_{name}{{{labels}}} {value}" if labels else f"closet_{name} {value}"
                lines.append(line)

            for name, values in self._histograms.items():
                if not values:
                    continue
                total = len(values)
                total_sum = sum(values)
                lines.append(f"# HELP closet_{name} {name}")
                lines.append(f"# TYPE closet_{name} histogram")
                lines.append(f"closet_{name}_count {total}")
                lines.append(f"closet_{name}_sum {total_sum}")

                # Calculate percentile buckets
                sorted_vals = sorted(values)
                for p, label in [(50, "0.5"), (90, "0.9"), (95, "0.95"), (99, "0.99")]:
                    idx = int(total * p / 100)
                    val = sorted_vals[min(idx, total - 1)]
                    lines.append(f"closet_{name}_bucket{{quantile=\"{label}\"}} {val}")

        # Process info
        import psutil
        proc = psutil.Process(os.getpid())
        mem = proc.memory_info()
        lines.append("# HELP closet_process_memory_bytes Process memory")
        lines.append("# TYPE closet_process_memory_bytes gauge")
        lines.append(f"closet_process_memory_bytes{{type=\"rss\"}} {mem.rss}")
        lines.append(f"closet_process_memory_bytes{{type=\"vms\"}} {mem.vms}")

        return "\n".join(lines) + "\n"


metrics_collector = MetricsCollector()
