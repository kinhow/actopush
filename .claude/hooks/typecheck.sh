#!/bin/bash
# PostToolUse hook: Run TypeScript type-check on edited files
set -e

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only check TS/TSX files
if [[ ! "$FILE_PATH" =~ \.(ts|tsx)$ ]]; then
  exit 0
fi

# Skip node_modules and .next
if [[ "$FILE_PATH" =~ node_modules ]] || [[ "$FILE_PATH" =~ \.next ]]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR" 2>/dev/null || exit 0

# Run tsc on the specific file — report errors but don't block (exit 0)
# Using --noEmit so it only checks types without generating output
ERRORS=$(npx tsc --noEmit --pretty 2>&1) || true

if [ -n "$ERRORS" ]; then
  # Filter to only show errors related to the edited file
  FILE_RELATIVE=$(echo "$FILE_PATH" | sed "s|$CLAUDE_PROJECT_DIR/||")
  RELEVANT=$(echo "$ERRORS" | grep -A 2 "$FILE_RELATIVE" 2>/dev/null || true)

  if [ -n "$RELEVANT" ]; then
    echo "TypeScript errors in $FILE_RELATIVE:" >&2
    echo "$RELEVANT" >&2
  fi
fi

exit 0
