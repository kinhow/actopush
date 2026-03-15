#!/bin/bash
# PreToolUse hook: Block dangerous Bash commands
set -e

INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

# Block destructive commands
DENY_PATTERNS=(
  "rm -rf /"
  "rm -rf ~"
  "git push.*--force.*main"
  "git push.*--force.*master"
  "git reset --hard"
  "git checkout -- ."
  "git clean -fd"
  "drop table"
  "drop database"
  "truncate table"
)

COMMAND_LOWER=$(echo "$COMMAND" | tr '[:upper:]' '[:lower:]')

for pattern in "${DENY_PATTERNS[@]}"; do
  if echo "$COMMAND_LOWER" | grep -qi "$pattern"; then
    echo "Blocked: destructive command detected — '$pattern'" >&2
    exit 2
  fi
done

exit 0
