#!/bin/bash

FILES_TO_DELETE=(
  "README.md"
  "ENV_SETUP.md"
)

echo "⚠️ WARNING: This will rewrite Git history. Make sure you understand what you're doing."

# Step 1: Remove from index if still there
for FILE in "${FILES_TO_DELETE[@]}"; do
  git rm --cached "$FILE" 2>/dev/null
done

git commit -m "Remove sensitive files from index (README.md, ENV_SETUP.md)"

# Step 2: Rewrite Git history to remove the files
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch README.md ENV_SETUP.md" \
  --prune-empty --tag-name-filter cat -- --all

# Step 3: Cleanup
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo "✅ Local cleanup done. Now force push to remote..."

# Step 4: Force push
git push origin --force --all
git push origin --force --tags

echo "🔥 Done! Files purged from history and remote."
