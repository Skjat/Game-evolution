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
#  Нужен только Docker (docker compose не требуется).
# =====================================================================
set -euo pipefail

REPO_TAR="https://github.com/Skjat/Game-evolution/archive/refs/heads/main.tar.gz"
DIR="${LEVELUP_DIR:-/opt/levelup}"
NET="levelup"
APP="levelup-league"
CADDY="levelup-caddy"
say() { printf '\n\033[1;33m▶ %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31m✕ %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "Запусти с sudo: ... | sudo bash"

# 1. Docker
if ! command -v docker >/dev/null 2>&1; then
  say "Docker не найден — устанавливаю (get.docker.com)"
  curl -fsSL https://get.docker.com | sh
fi
if ! docker info >/dev/null 2>&1; then
  say "Запускаю Docker"
  systemctl start docker 2>/dev/null || service docker start 2>/dev/null || true
  sleep 3
  docker info >/dev/null 2>&1 || die "Docker не запускается. Проверь: systemctl status docker"
fi

# 2. Код сервера (SRC_DIR — взять из локальной папки, для проверки)
say "Готовлю сервер лиги в $DIR"
mkdir -p "$DIR/data"
if [ -n "${SRC_DIR:-}" ]; then
  rm -rf "$DIR/app"; cp -r "$SRC_DIR" "$DIR/app"
else
  TMP="$(mktemp -d)"
  curl -fsSL "$REPO_TAR" | tar xz -C "$TMP"
  rm -rf "$DIR/app"
  mv "$TMP"/*/server "$DIR/app"
  rm -rf "$TMP"
fi

# 3. Домен
if [ -z "${DOMAIN:-}" ]; then
  IP="$(curl -fsS4 -m 10 https://api.ipify.org || curl -fsS4 -m 10 https://ifconfig.me || true)"
  [ -n "$IP" ] || die "Не удалось узнать внешний IP. Запусти с DOMAIN=твой-домен"
  DOMAIN="${IP//./-}.sslip.io"
  say "Домена нет — использую бесплатный $DOMAIN (указывает на $IP)"
fi

# 4. Сборка и запуск сервера лиги
say "Собираю образ (1–2 минуты)"
docker build -q -t "$APP" "$DIR/app" >/dev/null
docker network inspect "$NET" >/dev/null 2>&1 || docker network create "$NET" >/dev/null
docker rm -f "$APP" >/dev/null 2>&1 || true
docker run -d --name "$APP" --restart unless-stopped --network "$NET" --network-alias league \
  -v "$DIR/data:/data" -p 127.0.0.1:8787:8787 "$APP" >/dev/null

say "Проверяю сервер лиги"
for i in $(seq 1 30); do curl -fsS -m 3 http://127.0.0.1:8787/api/health >/dev/null 2>&1 && break; sleep 1; done
curl -fsS -m 3 http://127.0.0.1:8787/api/health >/dev/null 2>&1 || die "Сервер не отвечает. Логи: docker logs $APP"

# 5. HTTPS: порты 80/443 свободны (или уже заняты нашим Caddy) — ставим Caddy; заняты другим — подсказываем конфиг
port_busy() { (ss -ltnH 2>/dev/null || netstat -ltn 2>/dev/null) | awk '{print $4}' | grep -Eq "[:.]$1\$"; }
docker rm -f "$CADDY" >/dev/null 2>&1 || true   # освобождаем порты, если это был наш Caddy
if port_busy 80 || port_busy 443; then
  cat <<TXT

✓ Сервер лиги работает на 127.0.0.1:8787.
  Порты 80/443 заняты другим веб-сервером — добавь в него проксирование для домена $DOMAIN.

  nginx (внутри server { ... } с SSL для $DOMAIN):
      location / { proxy_pass http://127.0.0.1:8787; proxy_set_header Host \$host; }

  Caddy:
      $DOMAIN {
          reverse_proxy 127.0.0.1:8787
      }

После этого адрес для приложения: https://$DOMAIN
TXT
  exit 0
fi

say "Запускаю Caddy — HTTPS-сертификат для $DOMAIN получится автоматически"
printf '%s {\n\tencode gzip\n\treverse_proxy league:8787\n}\n' "$DOMAIN" > "$DIR/Caddyfile"
docker run -d --name "$CADDY" --restart unless-stopped --network "$NET" \
  -p 80:80 -p 443:443 \
  -v "$DIR/Caddyfile:/etc/caddy/Caddyfile:ro" -v levelup_caddy_data:/data -v levelup_caddy_config:/config \
  caddy:2 >/dev/null

OK=""
for i in $(seq 1 40); do curl -fsS -m 5 "https://$DOMAIN/api/health" >/dev/null 2>&1 && { OK=1; break; }; sleep 3; done
if [ -n "$OK" ]; then
  printf '\n\033[1;32m✓ Готово! Адрес сервера для приложения:\033[0m\n\n    https://%s\n\n' "$DOMAIN"
else
  printf '\n\033[1;33m! Сервер запущен, но https://%s пока не отвечает.\033[0m\n' "$DOMAIN"
  echo "  Проверь, что у хостера/в файрволе открыты порты 80 и 443 (ufw allow 80,443/tcp), и посмотри логи: docker logs $CADDY"
fi
