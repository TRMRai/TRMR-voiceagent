#!/bin/bash

# pr-checkout.sh
# A script to automatically check out GitHub PR branches locally
# Usage: pr-checkout.sh <PR_URL or PR_NUMBER>

set -e

# Function to display usage information
usage() {
  echo "Usage: pr-checkout.sh <PR_URL or PR_NUMBER>"
  echo "Examples:"
  echo "  pr-checkout.sh https://github.com/RooVetGit/Roo-Code/pull/3029"
  echo "  pr-checkout.sh 3029"
  exit 1
}

# Function to extract PR number from input
extract_pr_number() {
  local input="$1"
  local pr_number=""
  
  # Check if input is a URL or just a number
  if [[ "$input" =~ github\.com/([^/]+/[^/]+)/pull/([0-9]+) ]]; then
    # Extract repo and PR number from URL
    REPO_FROM_URL="${BASH_REMATCH[1]}"
    pr_number="${BASH_REMATCH[2]}"
    echo "Detected repo from URL: $REPO_FROM_URL"
  elif [[ "$input" =~ /pull/([0-9]+) ]]; then
    # Extract PR number from URL
    pr_number="${BASH_REMATCH[1]}"
  elif [[ "$input" =~ ^[0-9]+$ ]]; then
    # Input is already a PR number
    pr_number="$input"
  else
    echo "Error: Invalid PR input. Please provide a PR URL or PR number."
    usage
  fi
  
  echo "$pr_number"
}

# Validate input
if [ $# -ne 1 ]; then
  echo "Error: Missing PR URL or number."
  usage
fi

PR_INPUT="$1"
PR_NUMBER=$(extract_pr_number "$PR_INPUT")

if [ -z "$PR_NUMBER" ]; then
  echo "Error: Could not extract PR number."
  exit 1
fi

echo "Fetching information for PR #$PR_NUMBER..."

# Get PR details using GitHub CLI
if ! PR_JSON=$(gh pr view "$PR_NUMBER" --json headRepository,headRepositoryOwner,headRefName,url 2>/dev/null); then
  echo "Error: Failed to fetch PR information. Make sure:"
  echo "  - The PR exists and you have access to it"
  echo "  - GitHub CLI (gh) is installed and authenticated"
  echo "  - You're running this from within a git repository"
  echo ""
  echo "For debugging, try: gh pr view $PR_NUMBER --json headRepository,headRepositoryOwner,headRefName,url"
  exit 1
fi

# Extract information
PR_AUTHOR=$(echo "$PR_JSON" | jq -r '.headRepositoryOwner.login')
PR_BRANCH=$(echo "$PR_JSON" | jq -r '.headRefName')
FORK_REPO=$(echo "$PR_JSON" | jq -r '.headRepository.name')
PR_URL=$(echo "$PR_JSON" | jq -r '.url')

# Use the fork repository directly
BASE_REPO="$FORK_REPO"

if [ -z "$PR_AUTHOR" ] || [ -z "$PR_BRANCH" ] || [ "$PR_AUTHOR" = "null" ] || [ "$PR_BRANCH" = "null" ]; then
  echo "Error: Could not extract required information from PR."
  echo "Debug information:"
  echo "$PR_JSON" | jq '.'
  exit 1
fi

echo "PR Information:"
echo "  Author: $PR_AUTHOR"
echo "  Branch: $PR_BRANCH"
echo "  Base Repository: $BASE_REPO"
echo "  Fork Repository: $FORK_REPO"

# Check if remote already exists
if git remote | grep -q "^$PR_AUTHOR$"; then
  echo "Remote '$PR_AUTHOR' already exists. Updating URL..."
  git remote set-url "$PR_AUTHOR" "git@github.com:$PR_AUTHOR/$BASE_REPO.git"
else
  echo "Adding remote for $PR_AUTHOR..."
  git remote add "$PR_AUTHOR" "git@github.com:$PR_AUTHOR/$BASE_REPO.git"
fi

# Fetch from the remote
echo "Fetching from $PR_AUTHOR..."
git fetch "$PR_AUTHOR"

# Check if local branch with same name exists
if git show-ref --verify --quiet "refs/heads/$PR_BRANCH"; then
  echo "Warning: Local branch '$PR_BRANCH' already exists."
  read -p "Do you want to overwrite it? (y/n): " OVERWRITE
  if [[ "$OVERWRITE" =~ ^[Yy]$ ]]; then
    git checkout -B "$PR_BRANCH" "$PR_AUTHOR/$PR_BRANCH"
  else
    echo "Operation canceled."
    exit 0
  fi
else
  # Checkout new branch tracking the PR branch
  echo "Checking out branch '$PR_BRANCH'..."
  git checkout -b "$PR_BRANCH" "$PR_AUTHOR/$PR_BRANCH"
fi

echo ""
echo "✅ Successfully checked out PR #$PR_NUMBER"
echo "   Branch: $PR_BRANCH"
echo "   Remote: $PR_AUTHOR"