#!/bin/bash
# Notification hook: macOS native notification when Claude needs input
osascript -e 'display notification "Claude Code needs your input" with title "OctoPush" sound name "Glass"' 2>/dev/null || true
exit 0
