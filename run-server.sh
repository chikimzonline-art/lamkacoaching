#!/bin/bash
trap 'echo "Received signal: $?" >> /home/z/my-project/server-signals.log' SIGHUP SIGINT SIGTERM SIGKILL
NODE_OPTIONS='--max-old-space-size=256' npx next dev --turbopack -p 3000 2>&1 | tee /home/z/my-project/dev.log
echo "Server exited with code: $?" >> /home/z/my-project/server-signals.log
