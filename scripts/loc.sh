#!/bin/bash

# A simple script to count lines of code accurately excluding common ignored dirs.
# It uses cloc if available, otherwise falls back to a custom find+wc script.

echo "Counting Lines of Code (LoC) in the repository..."

if command -v npx &> /dev/null; then
    # We use npx to run cloc cleanly
    npx cloc . --exclude-dir=node_modules,.git,.next,build,dist,.vercel,.superpowers,coverage
else
    echo "npx not found. Falling back to find+wc..."
    find . -type d \( -name node_modules -o -name .git -o -name .next -o -name build -o -name dist -o -name coverage -o -name .vercel -o -name .superpowers \) -prune -o -type f -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.css" -o -name "*.json" -o -name "*.md" -print | xargs wc -l
fi
