#!/bin/sh
# Installs the git hooks. Safe to re-run.
set -e

cp scripts/pre-commit .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
echo "pre-commit hook installed"

if [ -d node_modules/husky ]; then
  echo "husky is installed; .husky/pre-commit calls the same script"
fi

if ! command -v gitleaks >/dev/null 2>&1; then
  echo ""
  echo "note: gitleaks is not installed, so the hook cannot scan for secrets."
  echo "      Install it from https://github.com/gitleaks/gitleaks"
  echo "      CI runs it regardless, but locally is where it saves you."
fi
