#!/bin/bash
# on-stop.sh — auto-commit, push, and show Vercel preview link
# Runs on every Stop event. Skips silently if nothing changed.

REPO="/Users/shaktisoni/Documents/Agora Design & FE/ai-studio-console-redesign"
LIVE_URL="https://ai-studio-console-redesign.vercel.app"
WIRE_URL="https://ai-studio-console-redesign.vercel.app/wireframes/app.html"

cd "$REPO" || exit 0

# Stage everything (excluding gitignored files)
git add -A 2>/dev/null

# Nothing to commit → just show the URL
if git diff --cached --quiet; then
  echo "{\"systemMessage\": \"Nothing new to commit.\n🌐 App: $LIVE_URL\n📐 Wireframe: $WIRE_URL\"}"
  exit 0
fi

# Build a descriptive commit message from changed file names
CHANGED_COUNT=$(git diff --cached --name-only | wc -l | tr -d ' ')
TOP_FILES=$(git diff --cached --name-only | sed 's|.*/||' | head -3 | tr '\n' ', ' | sed 's/, $//')

if [ "$CHANGED_COUNT" -gt 3 ]; then
  EXTRA=$(( CHANGED_COUNT - 3 ))
  MSG="session: ${TOP_FILES} (+${EXTRA} more)"
else
  MSG="session: ${TOP_FILES}"
fi

# Commit
git commit -m "$MSG" \
  -m "Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>" \
  2>&1

# Push to origin (both mirrors via dual push URL)
PUSH_OUT=$(git push origin main 2>&1)
PUSH_EXIT=$?

if [ $PUSH_EXIT -eq 0 ]; then
  HASH=$(git rev-parse --short HEAD)
  echo "{\"systemMessage\": \"✓ Committed & pushed (${HASH}) — ${MSG}\n🌐 App (~60s): ${LIVE_URL}\n📐 Wireframe: ${WIRE_URL}\"}"
else
  # Push failed — still show commit succeeded and the URL
  HASH=$(git rev-parse --short HEAD)
  echo "{\"systemMessage\": \"✓ Committed (${HASH}) locally.\n⚠ Push failed: ${PUSH_OUT}\n🌐 App (may be stale): ${LIVE_URL}\"}"
fi
