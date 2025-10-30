#!/bin/bash

# ShiftSmart Master Test Runner
# Runs all test suites in sequence

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "=========================================="
echo "ShiftSmart Complete Test Suite"
echo "=========================================="
echo "Start Time: $(date)"
echo "=========================================="
echo ""

# Track overall results
TOTAL_SUITES=0
PASSED_SUITES=0
FAILED_SUITES=0

# Test Suite 1: API Endpoints
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}Test Suite 1: API Endpoint Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""
TOTAL_SUITES=$((TOTAL_SUITES + 1))

if [ -f "$SCRIPT_DIR/test-api-endpoints.sh" ]; then
    if bash "$SCRIPT_DIR/test-api-endpoints.sh"; then
        PASSED_SUITES=$((PASSED_SUITES + 1))
    else
        FAILED_SUITES=$((FAILED_SUITES + 1))
    fi
else
    echo -e "${RED}❌ Test script not found: test-api-endpoints.sh${NC}"
    FAILED_SUITES=$((FAILED_SUITES + 1))
fi

echo ""
echo ""

# Test Suite 2: Integration Tests
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo -e "${BLUE}Test Suite 2: Integration Tests${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""
TOTAL_SUITES=$((TOTAL_SUITES + 1))

if [ -f "$SCRIPT_DIR/test-integration.sh" ]; then
    if bash "$SCRIPT_DIR/test-integration.sh"; then
        PASSED_SUITES=$((PASSED_SUITES + 1))
    else
        FAILED_SUITES=$((FAILED_SUITES + 1))
    fi
else
    echo -e "${RED}❌ Test script not found: test-integration.sh${NC}"
    FAILED_SUITES=$((FAILED_SUITES + 1))
fi

echo ""
echo ""

# Final Summary
echo "=========================================="
echo "COMPLETE TEST SUITE SUMMARY"
echo "=========================================="
echo "Total Test Suites: $TOTAL_SUITES"
echo -e "Passed: ${GREEN}$PASSED_SUITES${NC}"
echo -e "Failed: ${RED}$FAILED_SUITES${NC}"
echo ""
echo "End Time: $(date)"
echo "=========================================="

if [ $FAILED_SUITES -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                           ║${NC}"
    echo -e "${GREEN}║   ✅  ALL TESTS PASSED SUCCESSFULLY!  ✅   ║${NC}"
    echo -e "${GREEN}║                                           ║${NC}"
    echo -e "${GREEN}║   Backend and Frontend are connected!     ║${NC}"
    echo -e "${GREEN}║                                           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
    echo ""
    exit 0
else
    echo ""
    echo -e "${RED}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                           ║${NC}"
    echo -e "${RED}║     ❌  SOME TESTS FAILED  ❌              ║${NC}"
    echo -e "${RED}║                                           ║${NC}"
    echo -e "${RED}║   Please review the errors above          ║${NC}"
    echo -e "${RED}║                                           ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════╝${NC}"
    echo ""
    exit 1
fi

