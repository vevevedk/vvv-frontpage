#!/usr/bin/env bash
set -euo pipefail

echo "== Checking local upstream ports =="
ss -tulpn 2>/dev/null | egrep -w "(3000|3001|8002)" || true

fail=0

echo "== curl localhost:3000 =="
if ! curl -sS -I http://127.0.0.1:3000 | head -n1; then fail=1; fi

echo "== curl localhost:3001 =="
if ! curl -sS -I http://127.0.0.1:3001 | head -n1; then fail=1; fi

echo "== curl backend health (8002) =="
if ! curl -sS -I http://127.0.0.1:8002/health | head -n1; then fail=1; fi

echo "== curl nginx vhosts =="
if ! curl -sS -I -H "Host: veveve.dk" http://127.0.0.1/ | head -n1; then fail=1; fi
if ! curl -sS -I -H "Host: smagalagellerup.dk" http://127.0.0.1/ | head -n1; then fail=1; fi

echo "== curl HTTPS veveve health =="
if ! curl -sS -I https://veveve.dk/health --resolve veveve.dk:443:127.0.0.1 -k | head -n1; then fail=1; fi

if [ "$fail" -ne 0 ]; then
  echo "Verification FAILED. Review nginx and services."
  exit 1
fi

echo "Verification PASSED."


