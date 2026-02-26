#!/bin/bash
set -e

echo "🔐 Setup PAT Token for Sync Workflow"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Repository info
REPO="davipeterlini/qwen-code"

echo -e "${YELLOW}Step 1: Create Personal Access Token${NC}"
echo ""
echo "Opening GitHub token creation page..."
echo "Please configure:"
echo "  - Name: Qwen Code Sync"
echo "  - Expiration: 90 days (or more)"
echo "  - Scopes: Select 'repo' (Full control of private repositories)"
echo ""

# Open browser
if command -v open &> /dev/null; then
    open "https://github.com/settings/tokens/new?scopes=repo&description=Qwen%20Code%20Sync"
elif command -v xdg-open &> /dev/null; then
    xdg-open "https://github.com/settings/tokens/new?scopes=repo&description=Qwen%20Code%20Sync"
else
    echo "Manual: https://github.com/settings/tokens/new?scopes=repo&description=Qwen%20Code%20Sync"
fi

echo ""
echo -e "${YELLOW}Press ENTER after you've created and copied the token...${NC}"
read -r

echo ""
echo -e "${YELLOW}Step 2: Enter your PAT Token${NC}"
echo -e "${RED}⚠️  The token will not be displayed as you type (for security)${NC}"
echo ""
read -s -p "Paste your PAT token: " PAT_TOKEN
echo ""

if [ -z "$PAT_TOKEN" ]; then
    echo -e "${RED}❌ Error: No token provided${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 3: Adding token to GitHub repository${NC}"
echo ""

# Use gh CLI to add the secret
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ Error: GitHub CLI (gh) not found${NC}"
    echo "Install it from: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${RED}❌ Error: Not authenticated with GitHub CLI${NC}"
    echo "Run: gh auth login"
    exit 1
fi

# Add the secret
echo "$PAT_TOKEN" | gh secret set PAT_TOKEN --repo "$REPO"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Success! PAT_TOKEN added to repository secrets${NC}"
    echo ""
    echo -e "${YELLOW}Step 4: Test the workflow${NC}"
    echo ""
    echo "Opening Actions page..."

    if command -v open &> /dev/null; then
        open "https://github.com/$REPO/actions/workflows/sync-upstream.yml"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "https://github.com/$REPO/actions/workflows/sync-upstream.yml"
    else
        echo "Manual: https://github.com/$REPO/actions/workflows/sync-upstream.yml"
    fi

    echo ""
    echo "Click 'Run workflow' to test!"
    echo ""
    echo -e "${GREEN}✨ Setup complete!${NC}"
else
    echo -e "${RED}❌ Error: Failed to add secret${NC}"
    echo ""
    echo "You can add it manually at:"
    echo "https://github.com/$REPO/settings/secrets/actions/new"
    exit 1
fi
