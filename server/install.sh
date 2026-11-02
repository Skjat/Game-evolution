#!/usr/bin/env bash
# =====================================================================
#  Установка сервера лиги Level Up на свой сервер (Linux + Docker).
#
#  curl -fsSL https://raw.githubusercontent.com/Skjat/Game-evolution/main/server/install.sh | sudo bash
#
#  Со своим доменом (A-запись домена должна указывать на этот сервер):
#  curl -fsSL https://raw.githubusercontent.com/Skjat/Game-evolution/main/server/install.sh | sudo DOMAIN=league.example.ru bash
#
#  Повторный запуск обновляет сервер; данные лиги сохраняются в /opt/levelup/data.
# =====================================================================
set -euo pipefail

REPO_TAR="https://github.com/Skjat/Game-evolution/archive/refs/heads/main.tar.gz"
DIR="/opt/levelup"
say() { printf '\n\033[1;33m▶ %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31m✕ %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Запусти с sudo: ... | sudo bash"

# 1. Docker
if ! command -v docker >/dev/null 2>&1; then
  say "Docker не найден — устанавливаю (get.docker.com)"
  curl -fsSL https://get.docker.com | sh
fi
if docker compose version >/dev/null 2>&1; then COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then COMPOSE="docker-compose"
else die "Нет docker compose. Установи плагин: apt install docker-compose-plugin"; fi

# 2. Код сервера
say "Скачиваю сервер лиги в $DIR"
mkdir -p "$DIR/app" "$DIR/data"
TMP="$(mktemp -d)"
curl -fsSL "$REPO_TAR" | tar xz -C "$TMP"
rm -rf "$DIR/app"
mv "$TMP"/*/server "$DIR/app"
rm -rf "$TMP"

# 3. Домен
if [ -z "${DOMAIN:-}" ]; then
  IP="$(curl -fsS4 -m 10 https://api.ipify.org || curl -fsS4 -m 10 https://ifconfig.me || true)"
  [ -n "$IP" ] || die "Не удалось узнать внешний IP. Запусти с DOMAIN=твой-домен"
  DOMAIN="${IP//./-}.sslip.io"
  say "Домена нет — использую бесплатный $DOMAIN (указывает на $IP)"
fi

# 4. Порты 80/443: свободны — ставим Caddy с HTTPS; заняты — только сервер за твоим веб-сервером
port_busy() { (ss -ltnH 2>/dev/null || netstat -ltn 2>/dev/null) | awk '{print $4}' | grep -Eq "[:.]$1\$"; }
cd "$DIR/app"
cat > .env <<ENV
DOMAIN=$DOMAIN
DATA_DIR=$DIR/data
LEAGUE_PORT=8787
ENV

if port_busy 80 || port_busy 443; then
  MODE="proxy"
  say "Порты 80/443 уже заняты (nginx/caddy?) — запускаю только сервер лиги на 127.0.0.1:8787"
  $COMPOSE up -d --build league
else
  MODE="https"
  say "Запускаю сервер лиги и Caddy (HTTPS-сертификат получится автоматически)"
  $COMPOSE --profile https up -d --build
fi

# 5. Проверка
say "Проверяю"
for i in $(seq 1 30); do curl -fsS -m 3 http://127.0.0.1:8787/api/health >/dev/null 2>&1 && break; sleep 1; done
curl -fsS -m 3 http://127.0.0.1:8787/api/health >/dev/null 2>&1 || die "Сервер не отвечает. Логи: cd $DIR/app && $COMPOSE logs league"

if [ "$MODE" = "https" ]; then
  OK=""
  for i in $(seq 1 40); do curl -fsS -m 5 "https://$DOMAIN/api/health" >/dev/null 2>&1 && { OK=1; break; }; sleep 3; done
  if [ -n "$OK" ]; then
    printf '\n\033[1;32m✓ Готово! Адрес сервера для приложения:\033[0m\n\n    https://%s\n\n' "$DOMAIN"
  else
    printf '\n\033[1;33m! Сервер запущен, но HTTPS по адресу https://%s пока не отвечает.\033[0m\n' "$DOMAIN"
    echo "  Проверь, что в файрволе/у хостера открыты порты 80 и 443, и посмотри логи: cd $DIR/app && $COMPOSE logs caddy"
  fi
else
  cat <<TXT

✓ Сервер лиги работает на 127.0.0.1:8787. Добавь в свой веб-сервер проксирование для домена $DOMAIN.

  nginx (внутри server { ... } с SSL для $DOMAIN):
      location / { proxy_pass http://127.0.0.1:8787; proxy_set_header Host \$host; }

  Caddy:
      $DOMAIN {
          reverse_proxy 127.0.0.1:8787
      }

После этого адрес для приложения: https://$DOMAIN
TXT
fi
