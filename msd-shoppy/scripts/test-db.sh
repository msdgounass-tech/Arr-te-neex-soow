#!/usr/bin/env bash
# Applique les migrations sur une base PostgreSQL vierge (avec le shim Supabase) puis exécute les tests métier.
# Usage : PGPORT=54322 scripts/test-db.sh   (nécessite un serveur PostgreSQL 15+ local)
set -euo pipefail
cd "$(dirname "$0")/../supabase"
PSQL="psql -X -q -v ON_ERROR_STOP=1 -p ${PGPORT:-54322}"
RUN="${PG_AS:-}"
run() { if [ -n "$RUN" ]; then su "$RUN" -c "$1"; else bash -c "$1"; fi; }
run "dropdb -p ${PGPORT:-54322} --if-exists shoppy_test && createdb -p ${PGPORT:-54322} shoppy_test"
for f in tests/supabase_shim.sql migrations/*.sql seed.sql; do run "$PSQL -d shoppy_test -f $f" >/dev/null; done
run "$PSQL -d shoppy_test -f tests/business.test.sql" 2>&1 | sed -n -e 's/^.*NOTICE:  //p' -e '/ERROR/p' -e '/DETAIL/p' -e '/CONTEXT/p'
echo "Tous les tests de la base sont passés."
