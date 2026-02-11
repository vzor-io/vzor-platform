#!/bin/sh
echo '[patch] Replacing generativelanguage.googleapis.com -> api-proxy.agvzor.workers.dev'
# Patch OpenClaw dist files
find /app/dist -name '*.js' -exec sed -i 's|generativelanguage.googleapis.com|api-proxy.agvzor.workers.dev|g' {} +
# Patch pi-ai core library
find /app/node_modules -path '*pi-ai/dist*' -name '*.js' -exec sed -i 's|generativelanguage.googleapis.com|api-proxy.agvzor.workers.dev|g' {} +
# Patch any remaining google genai SDK files (web bundle etc)
find /app/node_modules -path '*@google/genai/dist*' -name '*.mjs' -exec sed -i 's|generativelanguage.googleapis.com|api-proxy.agvzor.workers.dev|g' {} +
find /app/node_modules -path '*@google/genai/dist*' -name '*.cjs' -exec sed -i 's|generativelanguage.googleapis.com|api-proxy.agvzor.workers.dev|g' {} +
echo '[patch] Done, starting gateway...'
exec "$@"
