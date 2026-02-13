# Session: Unify BLD and MSG Panel Design
**Date:** 2026-02-13

## Changes Made

### 1. MSG Panel (VZOR Messenger) - Color Unification
- oc_css.txt: All orange accents removed, replaced with white-subtle (no bright colors)
- oc_html_js.txt: Full panel with model selector, balance display, continuous mic, send button
- Toggle button: MSG, 42px, matches icon-btn style exactly

### 2. BLD Panel (Agent VZOR Builder) - Added Missing Features
- CSS: Teal colors normalized to white-subtle (matching MSG)
- HTML: Added send arrow button after mic
- JS: Added fetchBalances() - fetches /api/oc-balance, updates Direct + OpenRouter tabs
- JS: Replaced single-shot mic with continuous + interimResults
- JS: Added send button click handler
- Toggle button: BLD, 42px, matches icon-btn style

### 3. Design Normalization - No Bright Colors Inside Panels
- All interior cyan accents removed from both panels
- Hover behavior matches .icon-btn:hover: white glow + scale(1.15)
- Typing dots, message borders, model icons - all white/subtle

### 4. AgentVzor.0 - Fixed Two Errors
- 401 API key: Set MCP_SERVER_TOKEN, patched settings.py, added X-API-KEY header
- 500 CallSubordinate: Added **kwargs to usr overrides in /a0/usr/prompts/

### 5. Infrastructure
- oc_balance.py on port 18791, proxied via /api/oc-balance
- Nginx WebSocket proxy /ws/openclaw/ to port 18789
- Patch system: patch_oc.py restores from .bak, injects CSS + HTML/JS

## Files Modified (server)
- config/nginx/default.conf
- config/nginx/www/index.html + index.html.bak
- docker-compose.yml
