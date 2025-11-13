#!/bin/bash

################################################################################
# ShiftSmart Comprehensive Test Runner
# Runs all test suites in sequence and generates summary report
################################################################################

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Test results
declare -A TEST_RESULTS
TOTAL_SUITES=0
PASSED_SUITES=0
FAILED_SUITES=0

# Test output directory
OUTPUT_DIR="test-results-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUTPUT_DIR"

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║   ShiftSmart Comprehensive Test Suite                         ║"
echo "║   Testing All Features, Functions, and Integrations           ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${CYAN}Start Time: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo -e "${CYAN}Output Directory: $OUTPUT_DIR${NC}"
echo ""

# Helper function to run test suite
run_test_suite() {
    local suite_name="$1"
    local command="$2"
    local description="$3"

    TOTAL_SUITES=$((TOTAL_SUITES + 1))

    echo "═══════════════════════════════════════════════════════════════"
    echo -e "${BLUE}TEST SUITE $TOTAL_SUITES: $suite_name${NC}"
    echo -e "${CYAN}$description${NC}"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""

    local start_time=$(date +%s)
    local output_file="$OUTPUT_DIR/${suite_name// /_}.log"

    if eval "$command" > "$output_file" 2>&1; then
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        echo -e "${GREEN}✓ PASSED${NC} - $suite_name (${duration}s)"
        TEST_RESULTS[$suite_name]="PASSED"
        PASSED_SUITES=$((PASSED_SUITES + 1))
    else
        local end_time=$(date +%s)
        local duration=$((end_time - start_time))
        echo -e "${RED}✗ FAILED${NC} - $suite_name (${duration}s)"
        echo -e "${YELLOW}See log: $output_file${NC}"
        TEST_RESULTS[$suite_name]="FAILED"
        FAILED_SUITES=$((FAILED_SUITES + 1))
    fi

    echo ""
}

# Check if dependencies are installed
echo -e "${YELLOW}Checking dependencies...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Dependencies OK${NC}"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install > /dev/null 2>&1
    echo -e "${GREEN}✓ Dependencies installed${NC}"
    echo ""
fi

# ============================================================================
# TEST SUITE 1: Unit Tests
# ============================================================================
run_test_suite \
    "Unit Tests" \
    "npm run test:unit" \
    "Testing utility functions, auth helpers, and AI components"

# ============================================================================
# TEST SUITE 2: API Endpoint Tests (Standard)
# ============================================================================
run_test_suite \
    "API Endpoint Tests" \
    "npm run test:api" \
    "Testing all 24 API endpoints with standard scenarios"

# ============================================================================
# TEST SUITE 3: API Endpoint Tests (Enhanced)
# ============================================================================
run_test_suite \
    "Enhanced API Tests" \
    "npm run test:api:enhanced" \
    "Testing edge cases, error handling, and security"

# ============================================================================
# TEST SUITE 4: Database Tests
# ============================================================================
run_test_suite \
    "Database Tests" \
    "npm run test:database" \
    "Testing schema, constraints, triggers, and RLS policies"

# ============================================================================
# TEST SUITE 5: E2E UI Tests
# ============================================================================
run_test_suite \
    "E2E UI Tests" \
    "npm test" \
    "Testing complete user workflows with Playwright"

# ============================================================================
# TEST SUITE 6: Accessibility Tests
# ============================================================================
run_test_suite \
    "Accessibility Tests" \
    "npm run test:a11y" \
    "Testing WCAG 2.1 AA compliance"

# ============================================================================
# TEST SUITE 7: Type Checking
# ============================================================================
run_test_suite \
    "TypeScript Type Check" \
    "npx tsc --noEmit" \
    "Checking for type errors"

# ============================================================================
# TEST SUITE 8: Linting
# ============================================================================
run_test_suite \
    "ESLint" \
    "npm run lint" \
    "Checking code quality and style"

# ============================================================================
# Generate Summary Report
# ============================================================================

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    TEST SUMMARY REPORT                         ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Test results table
echo "Test Suite Results:"
echo "───────────────────────────────────────────────────────────────"
for suite in "${!TEST_RESULTS[@]}"; do
    result="${TEST_RESULTS[$suite]}"
    if [ "$result" = "PASSED" ]; then
        echo -e "  ${GREEN}✓${NC} $suite"
    else
        echo -e "  ${RED}✗${NC} $suite"
    fi
done
echo "───────────────────────────────────────────────────────────────"
echo ""

# Statistics
echo "Statistics:"
echo "  Total Test Suites:  $TOTAL_SUITES"
echo -e "  Passed:             ${GREEN}$PASSED_SUITES${NC}"
echo -e "  Failed:             ${RED}$FAILED_SUITES${NC}"
PASS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED_SUITES/$TOTAL_SUITES)*100}")
echo "  Pass Rate:          ${PASS_RATE}%"
echo ""

# Coverage report
echo "Test Coverage:"
if [ -f "coverage/coverage-summary.json" ]; then
    echo "  See: coverage/index.html"
else
    echo "  Run 'npm run test:coverage' for detailed coverage"
fi
echo ""

# Output files
echo "Test Logs:"
echo "  Directory: $OUTPUT_DIR"
echo "  View individual test logs for details"
echo ""

# End time
echo -e "${CYAN}End Time: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

# Final status
if [ $FAILED_SUITES -eq 0 ]; then
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo -e "║  ${GREEN}✓✓✓ ALL TEST SUITES PASSED! ✓✓✓${NC}                           ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    exit 0
else
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo -e "║  ${RED}✗✗✗ SOME TEST SUITES FAILED ✗✗✗${NC}                          ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    exit 1
fi
