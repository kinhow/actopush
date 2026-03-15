#!/bin/bash
# PreToolUse hook: Prevent writing to sensitive files
set -e

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Protected file patterns
PROTECTED_PATTERNS=(
  ".env"
  ".env.local"
  ".env.production"
  ".env.development"
  "credentials"
  "secrets"
)

BASENAME=$(basename "$FILE_PATH")

for pattern in "${PROTECTED_PATTERNS[@]}"; do
  if [[ "$BASENAME" == "$pattern" ]] || [[ "$BASENAME" == *"$pattern"* && "$BASENAME" == *.json ]]; then
    echo "Blocked: '$FILE_PATH' is a protected file. Modify it manually." >&2
    exit 2
  fi
done

exit 0
