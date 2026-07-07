#!/usr/bin/env sh
set -eu

if [ $# -gt 1 ]; then
  echo "Usage: $0 [output-file.sql.gz]" >&2
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required." >&2
  exit 1
fi

timestamp="$(date +%Y%m%d-%H%M%S)"
output="${1:-backups/raseed-${timestamp}.sql.gz}"

mkdir -p "$(dirname "$output")"

pg_dump --dbname="$DATABASE_URL" --format=plain --no-owner --no-privileges \
  | gzip > "$output"

echo "Backup written to $output"
