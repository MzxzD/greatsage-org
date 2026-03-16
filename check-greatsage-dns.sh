#!/usr/bin/env bash
# Darkness. greatsage.org DNS + HTTPS check. Run after you've added the 4 A records in Namecheap.
set -e
DOMAIN="greatsage.org"
GITHUB_IPS="185.199.108.153 185.199.109.153 185.199.110.153 185.199.111.153"

echo "=== A records for $DOMAIN ==="
RESOLVED=$(dig +short "$DOMAIN" A 2>/dev/null | sort -u)
if [ -z "$RESOLVED" ]; then
  echo "FAIL: No A records. Add the 4 records in Namecheap."
  exit 1
fi
for ip in $GITHUB_IPS; do
  if echo "$RESOLVED" | grep -q "^${ip}$"; then
    echo "  OK $ip"
  else
    echo "  MISSING $ip"
  fi
done

echo ""
echo "=== HTTPS ==="
if curl -sSfI --connect-timeout 15 "https://$DOMAIN/" >/dev/null 2>&1; then
  echo "  OK https://$DOMAIN/ is reachable"
else
  echo "  FAIL or not ready yet (cert can take up to 24h after DNS)"
  exit 1
fi
echo ""
echo "greatsage.org is live."
