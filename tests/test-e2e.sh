#!/bin/bash

# Install and run E2E tests with Playwright

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "ShiftSmart E2E Tests (Playwright)"
echo "=========================================="
echo ""

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm not found. Please install Node.js${NC}"
    exit 1
fi

# Navigate to E2E test directory
cd "$SCRIPT_DIR/e2e"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}📦 Installing Playwright and dependencies...${NC}"
    npm install
    npx playwright install
    echo ""
fi

# Check if frontend is running
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3001}"
if ! curl -s -f "$FRONTEND_URL" > /dev/null 2>&1; then
    echo -e "${RED}⚠️  Frontend not running at $FRONTEND_URL${NC}"
    echo "Please start the frontend first:"
    echo "  cd ~/v0-frontend"
    echo "  npm run dev"
    echo ""
    exit 1
fi

# Check if backend is running
API_URL="${API_URL:-http://localhost:3000}"
if ! curl -s -f "$API_URL" > /dev/null 2>&1; then
    echo -e "${RED}⚠️  Backend API not running at $API_URL${NC}"
    echo "Please start the backend first:"
    echo "  cd ~/shiftsmart-v1"
    echo "  npm run dev"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ Frontend and Backend are running${NC}"
echo ""

# Run tests
echo -e "${BLUE}🧪 Running E2E tests...${NC}"
echo ""

if npm test; then
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                           ║${NC}"
    echo -e "${GREEN}║   ✅  ALL E2E TESTS PASSED!  ✅            ║${NC}"
    echo -e "${GREEN}║                                           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
    echo ""

    # Show report
    echo "📊 View detailed report:"
    echo "   npx playwright show-report"
    echo ""

    exit 0
else
    echo ""
    echo -e "${RED}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                           ║${NC}"
    echo -e "${RED}║     ❌  SOME E2E TESTS FAILED  ❌          ║${NC}"
    echo -e "${RED}║                                           ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════╝${NC}"
    echo ""

    # Show report
    echo "📊 View detailed report with screenshots:"
    echo "   cd $SCRIPT_DIR/e2e"
    echo "   npx playwright show-report"
    echo ""

    exit 1
fi
