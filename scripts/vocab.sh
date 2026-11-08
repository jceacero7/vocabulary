#!/usr/bin/env bash
# Herramienta para el vocabulario de la BD de la nube (la que usa la app de Vercel).
#
# Lee las credenciales de .env.local (MYSQL_HOST/USER/PASSWORD/DATABASE) y usa el cliente
# mysql de la imagen Docker mysql:8.0, así que solo hace falta Docker Desktop arrancado.
#
# OJO con las tildes: el servidor (MariaDB, tablas latin1) ignora el juego de caracteres que
# pide el cliente. Todo lo que se ejecuta aquí va precedido de SET NAMES utf8mb4; sin eso se
# guardan tildes rotas ("inglÃ©s").
#
# Uso (Git Bash, desde la raíz del repo):
#   bash scripts/vocab.sh check              # categorías, repetidas, sin categoría, tildes rotas
#   bash scripts/vocab.sh words "<Categoría>" # palabras de una categoría (id, english, spanish)
#   bash scripts/vocab.sh sql "<consulta>"   # consulta suelta
#   bash scripts/vocab.sh apply fichero.sql  # ejecuta un fichero en una transacción
#   bash scripts/vocab.sh backup             # volcado completo a ../vocabulary-backups/ (fuera del repo)
#   bash scripts/vocab.sh export             # reescribe categorías y palabras de init-database.sql desde la nube
set -euo pipefail
cd "$(dirname "$0")/.."

[[ -f .env.local ]] || { echo "Falta .env.local con MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD y MYSQL_DATABASE" >&2; exit 1; }
set -a; . ./.env.local; set +a
export MYSQL_PWD="$MYSQL_PASSWORD"
docker info >/dev/null 2>&1 || { echo "Docker no está arrancado: docker desktop start" >&2; exit 1; }

BACKUP_DIR="${BACKUP_DIR:-../../vocabulary-backups}"

mysql_() { docker run --rm -i -e MYSQL_PWD mysql:8.0 mysql -h"$MYSQL_HOST" -u"$MYSQL_USER" "$MYSQL_DATABASE" --default-character-set=utf8mb4 "$@"; }
q() { mysql_ -t -e "SET NAMES utf8mb4; $1"; }

case "${1:-}" in
  check)
    q "SELECT c.name AS categoria, COUNT(w.id) AS palabras,
              COUNT(w.id) - COUNT(DISTINCT LOWER(TRIM(w.english))) AS repetidas,
              (SELECT COUNT(*) FROM game_categories g WHERE g.category_id = c.id) AS partidas
       FROM categories c LEFT JOIN words w ON w.category_id = c.id GROUP BY c.id, c.name ORDER BY c.name;
       SELECT (SELECT COUNT(*) FROM words) AS total,
              (SELECT COUNT(*) FROM words WHERE category_id IS NULL) AS sin_categoria,
              (SELECT COUNT(*) FROM words WHERE HEX(spanish) REGEXP '^(..)*C3[89AB]' OR HEX(english) REGEXP '^(..)*C3[89AB]') AS tildes_rotas;"
    ;;
  words)
    [[ -n "${2:-}" ]] || { echo "Uso: vocab.sh words \"<Categoría>\"" >&2; exit 1; }
    cat_name="${2//\'/\'\'}"
    q "SELECT w.id, w.english, w.spanish FROM words w JOIN categories c ON c.id = w.category_id
       WHERE c.name = '$cat_name' ORDER BY w.english;"
    ;;
  sql)
    q "$2"
    ;;
  apply)
    [[ -f "${2:-}" ]] || { echo "Uso: vocab.sh apply fichero.sql" >&2; exit 1; }
    { echo "SET NAMES utf8mb4;"; echo "START TRANSACTION;"; cat "$2"; echo; echo "COMMIT;"; } | mysql_
    echo "Aplicado."
    ;;
  backup)
    mkdir -p "$BACKUP_DIR"
    f="$BACKUP_DIR/nube-$(date +%Y%m%d-%H%M%S).sql"
    docker run --rm -e MYSQL_PWD mysql:8.0 mysqldump -h"$MYSQL_HOST" -u"$MYSQL_USER" --column-statistics=0 \
      --no-tablespaces --single-transaction --default-character-set=utf8mb4 "$MYSQL_DATABASE" > "$f"
    echo "Copia: $(cd "$(dirname "$f")" && pwd)/$(basename "$f")"
    ;;
  export)
    # Copia de la nube en el repo: sustituye los INSERT de categories y words de init-database.sql
    tmp="$(mktemp)"
    {
      echo "INSERT INTO categories (id, name) VALUES"
      mysql_ -N -B -e "SET NAMES utf8mb4; SELECT CONCAT('(', QUOTE(id), ', ', QUOTE(name), ')') FROM categories ORDER BY name;" | sed '$!s/$/,/; $s/$/;/'
      echo
      echo "-- Palabras exportadas de la nube con: bash scripts/vocab.sh export (agrupadas por categoría)"
      echo "INSERT INTO words (id, english, spanish, category_id) VALUES"
      mysql_ -N -B -e "SET NAMES utf8mb4; SELECT IFNULL(c.name, '(sin categoría)'), CONCAT('(', QUOTE(w.id), ', ', QUOTE(w.english), ', ', QUOTE(w.spanish), ', ', QUOTE(w.category_id), ')')
                       FROM words w LEFT JOIN categories c ON c.id = w.category_id ORDER BY c.name, w.english;" |
        awk -F'\t' '{ if ($1 != prev) { if (NR > 1) print ""; print "-- " $1; prev = $1 } print $2 "," }' | sed '$s/,$/;/'
    } > "$tmp"
    awk -v blk="$tmp" '
      /^INSERT INTO categories / { skipping = 1; while ((getline l < blk) > 0) print l; next }
      skipping && /^-- Tablas para el módulo de multiplicación/ { skipping = 0; print ""; print; next }
      !skipping { print }
    ' init-database.sql > "$tmp.out" && mv "$tmp.out" init-database.sql
    rm -f "$tmp"
    echo "init-database.sql actualizado desde la nube:"
    git --no-pager diff --stat -- init-database.sql || true
    ;;
  *)
    sed -n '2,20p' "$0"; exit 1 ;;
esac
