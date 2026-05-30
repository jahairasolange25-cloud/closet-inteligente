#!/usr/bin/env bash
# ============================================================
# CLOSET INTELIGENTE — PostgreSQL Backup with Validation
# ============================================================
# Usage:
#   ./infrastructure/scripts/backup.sh [--dry-run]
#
# Requires:
#   - pg_dump (PostgreSQL client)
#   - gzip
#   - sha256sum
#   - AWS CLI / scp (for remote copy, optional)
# ============================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# --- Configuration (override via environment) ---
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-closet}"
DB_USER="${DB_USER:-closet}"
DB_PASSWORD="${DB_PASSWORD:-closet_secret}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/infrastructure/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DRY_RUN="${DRY_RUN:-false}"

# --- Timestamp ---
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"
VALIDATION_LOG="${BACKUP_DIR}/validation_${TIMESTAMP}.log"

# --- Helpers ---
info()  { echo "[INFO]  $*"; }
warn()  { echo "[WARN]  $*" >&2; }
error() { echo "[ERROR] $*" >&2; exit 1; }

# --- Pre-flight checks ---
command -v pg_dump >/dev/null 2>&1 || error "pg_dump is required but not installed"
command -v gzip    >/dev/null 2>&1 || error "gzip is required but not installed"
command -v sha256sum >/dev/null 2>&1 || SHA_CMD="shasum -a 256" || SHA_CMD=""

# --- Dry-run mode ---
if [ "${DRY_RUN}" = "true" ]; then
  info "DRY RUN — no files will be written"
  echo "  DB:       ${DB_NAME}@${DB_HOST}:${DB_PORT}"
  echo "  Backup:   ${BACKUP_FILE}"
  echo "  Retain:   ${RETENTION_DAYS} days"
  exit 0
fi

# --- Create backup directory ---
mkdir -p "${BACKUP_DIR}"

# --- Dump database ---
info "Starting backup of ${DB_NAME}@${DB_HOST}:${DB_PORT}"
export PGPASSWORD="${DB_PASSWORD}"

pg_dump \
  --host="${DB_HOST}" \
  --port="${DB_PORT}" \
  --username="${DB_USER}" \
  --dbname="${DB_NAME}" \
  --format=custom \
  --verbose \
  2>>"${VALIDATION_LOG}" \
| gzip > "${BACKUP_FILE}"

unset PGPASSWORD

# --- Validate backup ---
info "Validating backup file: ${BACKUP_FILE}"

# Check 1: File exists and non-empty
if [ ! -f "${BACKUP_FILE}" ]; then
  error "Backup file was not created"
fi

FILE_SIZE="$(stat -c%s "${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_FILE}" 2>/dev/null)"
if [ "${FILE_SIZE}" -eq 0 ]; then
  error "Backup file is empty"
fi
info "  Size: $(numfmt --to=iec-i "${FILE_SIZE}" 2>/dev/null || echo "${FILE_SIZE} bytes")"

# Check 2: Gzip integrity
if ! gzip -t "${BACKUP_FILE}" 2>/dev/null; then
  error "Backup file failed gzip integrity check"
fi
info "  gzip integrity: PASS"

# Check 3: Checksum
if command -v sha256sum >/dev/null 2>&1; then
  sha256sum "${BACKUP_FILE}" > "${CHECKSUM_FILE}"
  info "  SHA256: $(cut -d' ' -f1 < "${CHECKSUM_FILE}")"
elif command -v shasum >/dev/null 2>&1; then
  shasum -a 256 "${BACKUP_FILE}" > "${CHECKSUM_FILE}"
  info "  SHA256: $(cut -d' ' -f1 < "${CHECKSUM_FILE}")"
else
  warn "  sha256sum not found — checksum skipped"
fi

# Check 4: Table count sanity
export PGPASSWORD="${DB_PASSWORD}"
TABLE_COUNT=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'" 2>/dev/null || echo "0")
unset PGPASSWORD

if [ "${TABLE_COUNT}" -gt 0 ]; then
  info "  Table count: ${TABLE_COUNT} tables in public schema"
else
  warn "  Could not verify table count (database may be unreachable)"
fi

# --- Retention cleanup ---
info "Cleaning up backups older than ${RETENTION_DAYS} days"
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz" -type f -mtime "+${RETENTION_DAYS}" -delete
find "${BACKUP_DIR}" -name "${DB_NAME}_*.sql.gz.sha256" -type f -mtime "+${RETENTION_DAYS}" -delete

# --- Summary ---
echo ""
info "Backup complete!"
echo "  File:     ${BACKUP_FILE}"
echo "  Size:     $(numfmt --to=iec-i "${FILE_SIZE}" 2>/dev/null || echo "${FILE_SIZE} bytes")"
echo "  Log:      ${VALIDATION_LOG}"
echo "  Checksum: ${CHECKSUM_FILE}"
