#!/bin/bash

echo "Verifying build dependencies..."

# Check for required dependencies in package.json
MISSING_DEPS=""

check_dependency() {
  if ! grep -q "\"$1\"" package.json; then
    MISSING_DEPS="$MISSING_DEPS $1"
    echo "❌ Missing: $1"
  else
    echo "✅ Found: $1"
  fi
}

# Check critical dependencies
check_dependency "@dnd-kit/core"
check_dependency "@dnd-kit/sortable"
check_dependency "@vercel/analytics"
check_dependency "@tailwindcss/postcss"
check_dependency "next-themes"
check_dependency "tailwindcss"

if [ -n "$MISSING_DEPS" ]; then
  echo ""
  echo "❌ Missing dependencies:$MISSING_DEPS"
  echo "Run: npm install$MISSING_DEPS"
  exit 1
else
  echo ""
  echo "✅ All critical dependencies found!"
  echo ""
  echo "Running build test..."
  npm run build
fi
