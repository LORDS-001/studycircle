#!/usr/bin/env bash
set -u

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PSQL="/opt/homebrew/opt/postgresql@17/bin/psql"
DB="studycircle_test_$$"
export PGHOST="${PGHOST:-/tmp}"
export PGPORT="${PGPORT:-54329}"
export PGUSER="${PGUSER:-postgres}"
export PGDATABASE="postgres"

if [[ ! -x "$PSQL" ]]; then echo "FAIL: psql not found at $PSQL" >&2; exit 1; fi
cleanup() { "$PSQL" -X -q -d postgres -c "drop database if exists \"$DB\"" >/dev/null 2>&1 || true; }
trap cleanup EXIT
if ! "$PSQL" -X -q -v ON_ERROR_STOP=1 -d postgres -c "create database \"$DB\""; then
  echo "FAIL: could not create test database $DB" >&2
  exit 1
fi
export PGDATABASE="$DB"

run_sql() { "$PSQL" -X -q -v ON_ERROR_STOP=1 -f "$1" >/dev/null; }
failed=0
if ! run_sql "$ROOT/supabase/tests/00_auth_shim.sql"; then echo "FAIL: tests/00_auth_shim.sql"; exit 1; fi
for file in "$ROOT"/supabase/migrations/*.sql; do
  if ! run_sql "$file"; then echo "FAIL: $(basename "$file")"; exit 1; fi
done
if [[ -f "$ROOT/supabase/seed.sql" ]]; then
  if ! run_sql "$ROOT/supabase/seed.sql"; then echo "FAIL: seed.sql"; exit 1; fi
fi
for file in "$ROOT"/supabase/tests/*.test.sql; do
  [[ -e "$file" ]] || continue
  if run_sql "$file"; then
    echo "PASS: $(basename "$file")"
  else
    echo "FAIL: $(basename "$file")"; failed=1
  fi
done
exit "$failed"
