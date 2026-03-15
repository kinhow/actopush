#!/bin/bash
# PostToolUse hook: Warn if relative imports (../../) are used instead of @/ alias
set -e

INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

if [ -z "$FILE_PATH" ]; then
  exit 0
fi

# Only check TypeScript/JavaScript files in src/
if [[ ! "$FILE_PATH" =~ \.(ts|tsx|js|jsx)$ ]] || [[ ! "$FILE_PATH" =~ /src/ ]]; then
  exit 0
fi

# Check for relative imports going up 2+ levels
if grep -qE "from ['\"]\.\.\/\.\.\/" "$FILE_PATH" 2>/dev/null; then
  echo "Warning: Found relative imports (../../) in $FILE_PATH. Use @/ path alias instead." >&2
fi

exit 0
