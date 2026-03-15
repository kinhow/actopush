#!/bin/bash
# PostToolUse hook: Auto-run Biome formatter after file edits
set -e

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only format TS/JS/JSON/CSS files
if [[ ! "$FILE_PATH" =~ \.(ts|tsx|js|jsx|json|css)$ ]]; then
  exit 0
fi

# Skip node_modules and .next
if [[ "$FILE_PATH" =~ node_modules ]] || [[ "$FILE_PATH" =~ \.next ]]; then
  exit 0
fi

# Run Biome format (suppress errors — don't block on format failures)
cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || true
npx biome check --write "$FILE_PATH" 2>/dev/null || true

exit 0
