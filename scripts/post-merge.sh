#!/bin/bash
set -e

# Only run npm install if package.json changed in the merge
if git diff HEAD~1 --name-only 2>/dev/null | grep -q "package.json"; then
  npm install --prefer-offline
fi

npm run db:push
