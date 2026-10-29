#!/bin/bash
# GitHub OAuth device flow poller - polls for user authorization
CLIENT_ID="178c6fc778ccc68e1d6a"
DEVICE_CODE=$(cat /home/z/my-project/scripts/.gh_device_code)
OUT="/home/z/my-project/scripts/.gh_device_token"
LOG="/home/z/my-project/scripts/gh_device_poll.log"
: > "$LOG"
for i in $(seq 1 115); do
  RESP=$(curl -s -X POST https://github.com/login/oauth/access_token \
    -H "Accept: application/json" \
    -d "client_id=$CLIENT_ID" \
    -d "device_code=$DEVICE_CODE" \
    -d "grant_type=urn:ietf:params:oauth:grant-type:device_code")
  if echo "$RESP" | grep -q '"access_token"'; then
    echo "$RESP" | python3 -c "import json,sys; print(json.load(sys.stdin)['access_token'])" > "$OUT"
    chmod 600 "$OUT"
    echo "SUCCESS $(date)" >> "$LOG"
    exit 0
  fi
  echo "[$i] $RESP" >> "$LOG"
  sleep 7
done
echo "TIMEOUT $(date)" >> "$LOG"
