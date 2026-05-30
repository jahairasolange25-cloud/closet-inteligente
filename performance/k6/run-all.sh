#!/usr/bin/env bash
# Run all k6 performance scenarios and generate reports
# Usage: ./run-all.sh [BASE_URL]

set -euo pipefail

BASE_URL="${1:-http://localhost:4000/api/v1}"
REPORT_DIR="./reports/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$REPORT_DIR"

echo "========================================"
echo "Closet Inteligente — k6 Performance Run"
echo "BASE_URL: $BASE_URL"
echo "Reports: $REPORT_DIR"
echo "========================================"

run_scenario() {
  local name="$1"
  local script="$2"
  echo ""
  echo "--- Running: $name ---"
  k6 run \
    --env BASE_URL="$BASE_URL" \
    --out json="$REPORT_DIR/${name}.json" \
    "$script" \
    2>&1 | tee "$REPORT_DIR/${name}.log" || true
  echo "--- Finished: $name ---"
}

run_scenario "auth-load"             "./scenarios/auth-load.js"
run_scenario "upload-concurrency"    "./scenarios/upload-concurrency.js"
run_scenario "ai-queue-pressure"     "./scenarios/ai-queue-pressure.js"
run_scenario "db-connection-saturation" "./scenarios/db-connection-saturation.js"
run_scenario "cache-hit-metrics"     "./scenarios/cache-hit-metrics.js"

echo ""
echo "========================================"
echo "All scenarios complete. Reports in: $REPORT_DIR"
echo "To generate HTML report, run:"
echo "  k6 run --out web-dashboard <scenario>"
echo "========================================"
