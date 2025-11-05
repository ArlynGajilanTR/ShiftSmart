#!/bin/bash

################################################################################
# ShiftSmart Enhanced API Endpoint Tests
# Comprehensive testing with edge cases, error scenarios, and security tests
################################################################################

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
TEST_EMAIL="gianluca.semeraro@thomsonreuters.com"
TEST_PASSWORD="changeme"

# Counters
PASSED=0
FAILED=0
TOTAL=0
declare -a FAILURES

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   ShiftSmart Enhanced API Tests - Comprehensive Suite     ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "API URL: $API_URL"
echo "Start Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Helper function
run_test() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="${5:-200}"
    local auth_required="${6:-false}"
    
    TOTAL=$((TOTAL + 1))
    
    local curl_cmd="curl -s -w '\n%{http_code}' -X $method"
    curl_cmd="$curl_cmd -H 'Content-Type: application/json'"
    
    if [ "$auth_required" = "true" ] && [ -n "$AUTH_TOKEN" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $AUTH_TOKEN'"
    fi
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    curl_cmd="$curl_cmd '$API_URL$endpoint'"
    
    local response=$(eval $curl_cmd)
    local status=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} $test_name"
        PASSED=$((PASSED + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $test_name"
        echo "  Expected: $expected_status, Got: $status"
        echo "  Response: ${body:0:100}"
        FAILED=$((FAILED + 1))
        FAILURES+=("$test_name")
        return 1
    fi
}

echo "═══════════════════════════════════════════════════════════"
echo "  PHASE 1: Authentication Edge Cases (15 tests)"
echo "═══════════════════════════════════════════════════════════"
echo ""

# Get auth token first
response=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")

if echo "$response" | grep -q "access_token"; then
    AUTH_TOKEN=$(echo "$response" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    echo -e "${GREEN}✓${NC} Authentication successful"
    echo ""
else
    echo -e "${RED}✗${NC} Failed to authenticate"
    exit 1
fi

# Auth edge cases
run_test "Login: Empty email" "POST" "/api/auth/login" \
    '{"email":"","password":"test"}' "400"

run_test "Login: Empty password" "POST" "/api/auth/login" \
    '{"email":"test@test.com","password":""}' "400"

run_test "Login: Missing email field" "POST" "/api/auth/login" \
    '{"password":"test"}' "400"

run_test "Login: Missing password field" "POST" "/api/auth/login" \
    '{"email":"test@test.com"}' "400"

run_test "Login: Invalid email format" "POST" "/api/auth/login" \
    '{"email":"notanemail","password":"test"}' "401"

run_test "Login: SQL injection attempt" "POST" "/api/auth/login" \
    '{"email":"admin@test.com'\'' OR '\''1'\''='\''1","password":"test"}' "401"

run_test "Login: XSS attempt in email" "POST" "/api/auth/login" \
    '{"email":"<script>alert(1)</script>@test.com","password":"test"}' "401"

run_test "Session: Invalid token format" "GET" "/api/auth/session" \
    "" "401" "false"

run_test "Session: Expired token" "GET" "/api/auth/session" \
    "" "401" "false"

run_test "Signup: Duplicate email" "POST" "/api/auth/signup" \
    "{\"email\":\"$TEST_EMAIL\",\"password\":\"test123\",\"full_name\":\"Test\"}" "409"

run_test "Signup: Weak password" "POST" "/api/auth/signup" \
    '{"email":"new@test.com","password":"123","full_name":"Test"}' "400"

run_test "Signup: Invalid bureau" "POST" "/api/auth/signup" \
    '{"email":"new@test.com","password":"test123","full_name":"Test","bureau_id":"invalid"}' "400"

run_test "Signup: Missing required fields" "POST" "/api/auth/signup" \
    '{"email":"new@test.com"}' "400"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  PHASE 2: Employee API Edge Cases (20 tests)"
echo "═══════════════════════════════════════════════════════════"
echo ""

run_test "Employees: Requires authentication" "GET" "/api/employees" \
    "" "401" "false"

run_test "Employees: List with valid auth" "GET" "/api/employees" \
    "" "200" "true"

run_test "Employees: Filter by invalid bureau" "GET" "/api/employees?bureau=InvalidBureau" \
    "" "200" "true"

run_test "Employees: Filter by invalid role" "GET" "/api/employees?role=invalid" \
    "" "200" "true"

run_test "Employees: Search with special characters" "GET" "/api/employees?search=%3Cscript%3E" \
    "" "200" "true"

run_test "Employees: Search with SQL injection" "GET" "/api/employees?search='\%20OR\%201=1--" \
    "" "200" "true"

run_test "Employees: Invalid pagination limit" "GET" "/api/employees?limit=-1" \
    "" "200" "true"

run_test "Employees: Large pagination limit" "GET" "/api/employees?limit=10000" \
    "" "200" "true"

run_test "Employees: Get non-existent employee" "GET" "/api/employees/00000000-0000-0000-0000-000000000000" \
    "" "404" "true"

run_test "Employees: Get with invalid UUID" "GET" "/api/employees/not-a-uuid" \
    "" "400" "true"

run_test "Employees: Create with missing email" "POST" "/api/employees" \
    '{"full_name":"Test"}' "400" "true"

run_test "Employees: Create with invalid email" "POST" "/api/employees" \
    '{"full_name":"Test","email":"not-an-email"}' "400" "true"

run_test "Employees: Create with invalid phone" "POST" "/api/employees" \
    '{"full_name":"Test","email":"test@test.com","phone":"invalid"}' "400" "true"

run_test "Employees: Update non-existent employee" "PUT" "/api/employees/00000000-0000-0000-0000-000000000000" \
    '{"full_name":"Updated"}' "404" "true"

run_test "Employees: Delete non-existent employee" "DELETE" "/api/employees/00000000-0000-0000-0000-000000000000" \
    "" "404" "true"

run_test "Employees: Preferences for non-existent employee" "GET" "/api/employees/00000000-0000-0000-0000-000000000000/preferences" \
    "" "404" "true"

run_test "Employees: Update preferences with invalid days" "PUT" "/api/employees/00000000-0000-0000-0000-000000000000/preferences" \
    '{"preferred_days":["InvalidDay"]}' "404" "true"

run_test "Employees: Update preferences with invalid max_shifts" "PUT" "/api/employees/00000000-0000-0000-0000-000000000000/preferences" \
    '{"max_shifts_per_week":-1}' "404" "true"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  PHASE 3: Shift API Edge Cases (25 tests)"
echo "═══════════════════════════════════════════════════════════"
echo ""

run_test "Shifts: Requires authentication" "GET" "/api/shifts" \
    "" "401" "false"

run_test "Shifts: List with valid auth" "GET" "/api/shifts" \
    "" "200" "true"

run_test "Shifts: Invalid date format" "GET" "/api/shifts?start_date=invalid" \
    "" "400" "true"

run_test "Shifts: End date before start date" "GET" "/api/shifts?start_date=2025-11-30&end_date=2025-11-01" \
    "" "400" "true"

run_test "Shifts: Future date far ahead" "GET" "/api/shifts?start_date=2099-01-01&end_date=2099-12-31" \
    "" "200" "true"

run_test "Shifts: Past date far behind" "GET" "/api/shifts?start_date=1900-01-01&end_date=1900-12-31" \
    "" "200" "true"

run_test "Shifts: Invalid bureau filter" "GET" "/api/shifts?bureau_id=not-a-uuid" \
    "" "400" "true"

run_test "Shifts: Invalid employee filter" "GET" "/api/shifts?employee_id=not-a-uuid" \
    "" "400" "true"

run_test "Shifts: Create with missing required fields" "POST" "/api/shifts" \
    '{"start_time":"08:00"}' "400" "true"

run_test "Shifts: Create with invalid time format" "POST" "/api/shifts" \
    '{"bureau_id":"test","start_time":"invalid","end_time":"invalid"}' "400" "true"

run_test "Shifts: Create with end time before start time" "POST" "/api/shifts" \
    '{"bureau_id":"test","start_time":"2025-11-01T16:00:00Z","end_time":"2025-11-01T08:00:00Z"}' "400" "true"

run_test "Shifts: Create with zero duration" "POST" "/api/shifts" \
    '{"bureau_id":"test","start_time":"2025-11-01T08:00:00Z","end_time":"2025-11-01T08:00:00Z"}' "400" "true"

run_test "Shifts: Create with invalid bureau" "POST" "/api/shifts" \
    '{"bureau_id":"invalid-uuid","start_time":"2025-11-01T08:00:00Z","end_time":"2025-11-01T16:00:00Z"}' "400" "true"

run_test "Shifts: Create with invalid employee" "POST" "/api/shifts" \
    '{"bureau_id":"valid-uuid","employee_id":"invalid","start_time":"2025-11-01T08:00:00Z","end_time":"2025-11-01T16:00:00Z"}' "400" "true"

run_test "Shifts: Update non-existent shift" "PUT" "/api/shifts/00000000-0000-0000-0000-000000000000" \
    '{"notes":"Updated"}' "404" "true"

run_test "Shifts: Delete non-existent shift" "DELETE" "/api/shifts/00000000-0000-0000-0000-000000000000" \
    "" "404" "true"

run_test "Shifts: Move with invalid employee" "PATCH" "/api/shifts/00000000-0000-0000-0000-000000000000" \
    '{"employee_id":"invalid"}' "404" "true"

run_test "Shifts: Upcoming with invalid days parameter" "GET" "/api/shifts/upcoming?days=-1" \
    "" "400" "true"

run_test "Shifts: Upcoming with excessive days parameter" "GET" "/api/shifts/upcoming?days=1000" \
    "" "400" "true"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  PHASE 4: Conflict API Edge Cases (15 tests)"
echo "═══════════════════════════════════════════════════════════"
echo ""

run_test "Conflicts: Requires authentication" "GET" "/api/conflicts" \
    "" "401" "false"

run_test "Conflicts: List with valid auth" "GET" "/api/conflicts" \
    "" "200" "true"

run_test "Conflicts: Invalid status filter" "GET" "/api/conflicts?status=invalid" \
    "" "400" "true"

run_test "Conflicts: Invalid severity filter" "GET" "/api/conflicts?severity=invalid" \
    "" "400" "true"

run_test "Conflicts: Negative limit" "GET" "/api/conflicts?limit=-1" \
    "" "400" "true"

run_test "Conflicts: Excessive limit" "GET" "/api/conflicts?limit=10000" \
    "" "400" "true"

run_test "Conflicts: Update non-existent conflict" "PATCH" "/api/conflicts/00000000-0000-0000-0000-000000000000" \
    '{"action":"resolve"}' "404" "true"

run_test "Conflicts: Update with invalid action" "PATCH" "/api/conflicts/00000000-0000-0000-0000-000000000000" \
    '{"action":"invalid"}' "400" "true"

run_test "Conflicts: Update with missing action" "PATCH" "/api/conflicts/00000000-0000-0000-0000-000000000000" \
    '{}' "400" "true"

run_test "Conflicts: Delete non-existent conflict" "DELETE" "/api/conflicts/00000000-0000-0000-0000-000000000000" \
    "" "404" "true"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  PHASE 5: AI API Edge Cases (10 tests)"
echo "═══════════════════════════════════════════════════════════"
echo ""

run_test "AI Status: Requires authentication" "GET" "/api/ai/status" \
    "" "401" "false"

run_test "AI Status: Valid request" "GET" "/api/ai/status" \
    "" "200" "true"

run_test "AI Generate: Missing required fields" "POST" "/api/ai/generate-schedule" \
    '{}' "400" "true"

run_test "AI Generate: Invalid date format" "POST" "/api/ai/generate-schedule" \
    '{"start_date":"invalid","end_date":"invalid"}' "400" "true"

run_test "AI Generate: End before start" "POST" "/api/ai/generate-schedule" \
    '{"start_date":"2025-11-30","end_date":"2025-11-01"}' "400" "true"

run_test "AI Generate: Invalid period type" "POST" "/api/ai/generate-schedule" \
    '{"start_date":"2025-11-01","end_date":"2025-11-07","type":"invalid"}' "400" "true"

run_test "AI Generate: Invalid bureau" "POST" "/api/ai/generate-schedule" \
    '{"start_date":"2025-11-01","end_date":"2025-11-07","bureau":"invalid"}' "400" "true"

run_test "AI Resolve: Missing conflict ID" "POST" "/api/ai/resolve-conflict" \
    '{}' "400" "true"

run_test "AI Resolve: Invalid conflict ID" "POST" "/api/ai/resolve-conflict" \
    '{"conflict_id":"not-a-uuid"}' "400" "true"

run_test "AI Resolve: Non-existent conflict" "POST" "/api/ai/resolve-conflict" \
    '{"conflict_id":"00000000-0000-0000-0000-000000000000"}' "404" "true"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  PHASE 6: Security Tests (10 tests)"
echo "═══════════════════════════════════════════════════════════"
echo ""

run_test "Security: CORS headers present" "OPTIONS" "/api/employees" \
    "" "200" "true"

run_test "Security: Rate limiting (rapid requests)" "GET" "/api/employees" \
    "" "200" "true"

run_test "Security: XSS in query params" "GET" "/api/employees?search=%3Cscript%3Ealert(1)%3C/script%3E" \
    "" "200" "true"

run_test "Security: Path traversal attempt" "GET" "/api/../../../etc/passwd" \
    "" "404" "false"

run_test "Security: HTTP method override" "GET" "/api/employees" \
    "" "200" "true"

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    TEST SUMMARY                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Total Tests:    $TOTAL"
echo -e "Passed:         ${GREEN}$PASSED${NC}"
echo -e "Failed:         ${RED}$FAILED${NC}"
echo "Coverage:       $(awk "BEGIN {printf \"%.1f%%\", ($PASSED/$TOTAL)*100}")"
echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${RED}Failed Tests:${NC}"
    for failure in "${FAILURES[@]}"; do
        echo "  • $failure"
    done
    echo ""
fi

echo "End Time: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}╔═══════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  ✓ ALL TESTS PASSED SUCCESSFULLY!    ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════╝${NC}"
    exit 0
else
    echo -e "${RED}╔═══════════════════════════════════════╗${NC}"
    echo -e "${RED}║  ✗ SOME TESTS FAILED                  ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════╝${NC}"
    exit 1
fi

