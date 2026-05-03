#!/bin/bash
# Keep the Next.js dev server alive
while true; do
  if ! curl -s -o /dev/null -w "" http://localhost:3000/ 2>/dev/null; then
    echo "[$(date)] Server down, restarting..."
    cd /home/z/my-project
    NODE_OPTIONS='--max-old-space-size=256' npx next dev --turbopack -p 3000 >> dev.log 2>&1 &
    disown
    sleep 10
  fi
  sleep 30
done
