#!/usr/bin/env sh

echo "Compiling And Starting SimpleBot"
npx tsx ./src/index.ts

echo ""
echo "Process exited with code $?"
read -p "Press Enter to close..."
