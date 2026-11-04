#!/usr/bin/env bash
# The real backend on a throwaway database with an example shop, for the landing
# page's screenshots. Fake model, no photos in R2, the sync loops off; heydesk.db
# and the backend's media folder are never touched. Runs on :8000, so stop your
# own backend first. Then, once per language (see shoot.mjs):
#   pnpm run serve
#   node dev/landing-shots/shoot.mjs public/landing en
#   node dev/landing-shots/shoot.mjs public/landing bn
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
DATA="$HERE/.data"
mkdir -p "$DATA"
rm -f "$DATA/demo.db"
cd "$HERE/../../../heydesk"
export APP_ENV=development
export DATABASE_URL="sqlite+aiosqlite:///$DATA/demo.db"
export MEDIA_DIR="$DATA/media" R2_BUCKET=""
export QDRANT_URL="" QDRANT_API_KEY="" QDRANT_LOCAL_PATH="$DATA/qdrant"
export LLM_PROVIDER=fake EMBEDDER=fake DECIDER=""
export GEMINI_API_KEY="" GROQ_API_KEY="" GIGALOGY_API_KEY="" BREVO_API_KEY="" DEEPGRAM_API_KEY=""
export DEV_AGENT_KIND=shop DEV_AGENT_SEED=examples/agents/shop.yaml
export JWT_SECRET=landing-shots-only SECRETS_KEY=landing-shots-only-landing-shots-only
export COURIER_SYNC_MINUTES=100000 SHEET_SYNC_MINUTES=100000 WOO_SYNC_MINUTES=100000
uv run alembic upgrade head
uv run heydesk create-user demo@heydesk.test "demo password"
uv run uvicorn heydesk.main:app --app-dir src --port 8000 &
server=$!
trap 'kill $server' EXIT
until curl -s -o /dev/null localhost:8000/openapi.json; do
  kill -0 $server
  sleep 0.5
done
uv run python "$HERE/seed.py"
wait $server
