#!/usr/bin/env bash
set -e
CONN="postgresql://postgres:postgres@127.0.0.1:54322/postgres"

echo "==> 1/3 Dumping schema (production)..."
pnpm db:dump:schema
echo ""

echo "==> 2/3 Dumping data (production, can take 5-15+ min, no progress output)..."
echo "    Tip: in another terminal run: watch -n 5 'ls -lh supabase/data.sql'"
pnpm db:dump:data
echo ""

echo "==> 3/3 Restoring to local DB..."
psql "$CONN" -c 'DROP SCHEMA public CASCADE; CREATE SCHEMA public; GRANT ALL ON SCHEMA public TO postgres, anon, authenticated, service_role;'

if command -v pv >/dev/null 2>&1; then
  echo "    Loading schema.sql..."
  pv supabase/schema.sql | psql "$CONN" -f - >/dev/null
  echo "    Loading data.sql..."
  pv supabase/data.sql | psql "$CONN" -f - >/dev/null
else
  echo "    Install pv for progress: brew install pv"
  psql "$CONN" -f supabase/schema.sql
  psql "$CONN" -f supabase/data.sql
fi

echo ""
echo "==> Done."
