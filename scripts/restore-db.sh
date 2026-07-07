#!/usr/bin/env sh
set -eu

if [ $# -ne 1 ]; then
  echo "Usage: $0 <backup.sql.gz|backup.sql>" >&2
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is required." >&2
  exit 1
fi

input="$1"

case "$input" in
  *.gz) gzip -dc "$input" | psql "$DATABASE_URL" ;;
  *) psql "$DATABASE_URL" < "$input" ;;
esac

echo "Restore completed from $input"
