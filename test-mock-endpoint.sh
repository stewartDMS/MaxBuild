#!/bin/bash

# Test script for mock upload endpoint
# This script verifies the complete end-to-end mock workflow

set -e  # Exit on error

echo "======================================================"
echo "Mock Upload Endpoint Test Suite"
echo "======================================================"
echo ""

BASE_URL="http://localhost:3000"
ENDPOINT="/api/tenders/upload-mock"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Helper function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASSED${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗ FAILED${NC}: $2"
        ((TESTS_FAILED++))
    fi
    echo ""
}

# Helper function to check if server is running
check_server() {
    echo "Checking if server is running..."
    if curl -s "$BASE_URL/api/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Server is running${NC}"
        return 0
    else
        echo -e "${RED}✗ Server is not running${NC}"
        echo "Please start the server with: npm run dev"
        exit 1
    fi
    echo ""
}

# Test 1: Mock upload without file
test_no_file() {
    echo "======================================================"
    echo "Test 1: Mock upload without file (uses mock data)"
    echo "======================================================"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL$ENDPOINT")
    
    # Check if response contains expected fields
    if echo "$RESPONSE" | jq -e '.success == true' > /dev/null && \
       echo "$RESPONSE" | jq -e '.isDemo == true' > /dev/null && \
       echo "$RESPONSE" | jq -e '.data.tenderId' > /dev/null && \
       echo "$RESPONSE" | jq -e '.data.processingSteps | length == 5' > /dev/null; then
        print_result 0 "Mock upload without file works correctly"
        echo "Tender ID: $(echo "$RESPONSE" | jq -r '.data.tenderId')"
        echo "Item Count: $(echo "$RESPONSE" | jq -r '.data.itemCount')"
        echo "Processing Steps: $(echo "$RESPONSE" | jq -r '.data.processingSteps | length')"
    else
        print_result 1 "Mock upload without file failed"
        echo "Response: $RESPONSE"
    fi
}

# Test 2: Mock upload with file
test_with_file() {
    echo "======================================================"
    echo "Test 2: Mock upload with file"
    echo "======================================================"
    
    # Create a test file
    TEST_FILE="/tmp/test-tender-$(date +%s).pdf"
    echo "This is a test tender document for BOQ extraction" > "$TEST_FILE"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL$ENDPOINT" -F "tender=@$TEST_FILE")
    
    # Check if response contains expected fields and file name
    if echo "$RESPONSE" | jq -e '.success == true' > /dev/null && \
       echo "$RESPONSE" | jq -e '.data.fileName' | grep -q "test-tender"; then
        print_result 0 "Mock upload with file works correctly"
        echo "File Name: $(echo "$RESPONSE" | jq -r '.data.fileName')"
        echo "Item Count: $(echo "$RESPONSE" | jq -r '.data.itemCount')"
    else
        print_result 1 "Mock upload with file failed"
        echo "Response: $RESPONSE"
    fi
    
    # Cleanup
    rm -f "$TEST_FILE"
}

# Test 3: Mock upload with context (no context)
test_no_context() {
    echo "======================================================"
    echo "Test 3: Mock upload without custom context"
    echo "======================================================"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL$ENDPOINT")
    
    ITEM_COUNT=$(echo "$RESPONSE" | jq -r '.data.itemCount')
    NOTES=$(echo "$RESPONSE" | jq -r '.data.boqExtraction.notes')
    
    if [ "$ITEM_COUNT" -eq 9 ] && echo "$NOTES" | grep -q "Standard extraction"; then
        print_result 0 "Mock upload without context returns standard items (9 items)"
        echo "Notes: $NOTES"
    else
        print_result 1 "Mock upload without context failed"
        echo "Item Count: $ITEM_COUNT (expected 9)"
        echo "Notes: $NOTES"
    fi
}

# Test 4: Mock upload with electrical context
test_electrical_context() {
    echo "======================================================"
    echo "Test 4: Mock upload with electrical context"
    echo "======================================================"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL$ENDPOINT" \
        -F "context=Focus on electrical items")
    
    ITEM_COUNT=$(echo "$RESPONSE" | jq -r '.data.itemCount')
    ELECTRICAL_ITEMS=$(echo "$RESPONSE" | jq '[.data.boqExtraction.items[] | select(.category == "Electrical")] | length')
    
    if [ "$ITEM_COUNT" -gt 9 ] && [ "$ELECTRICAL_ITEMS" -gt 1 ]; then
        print_result 0 "Mock upload with electrical context returns more electrical items"
        echo "Total Items: $ITEM_COUNT"
        echo "Electrical Items: $ELECTRICAL_ITEMS"
    else
        print_result 1 "Mock upload with electrical context failed"
        echo "Total Items: $ITEM_COUNT"
        echo "Electrical Items: $ELECTRICAL_ITEMS"
    fi
}

# Test 5: Mock upload with plumbing context
test_plumbing_context() {
    echo "======================================================"
    echo "Test 5: Mock upload with plumbing context"
    echo "======================================================"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL$ENDPOINT" \
        -F "context=Focus on plumbing works")
    
    ITEM_COUNT=$(echo "$RESPONSE" | jq -r '.data.itemCount')
    PLUMBING_ITEMS=$(echo "$RESPONSE" | jq '[.data.boqExtraction.items[] | select(.category == "Plumbing")] | length')
    
    if [ "$ITEM_COUNT" -gt 9 ] && [ "$PLUMBING_ITEMS" -gt 1 ]; then
        print_result 0 "Mock upload with plumbing context returns more plumbing items"
        echo "Total Items: $ITEM_COUNT"
        echo "Plumbing Items: $PLUMBING_ITEMS"
    else
        print_result 1 "Mock upload with plumbing context failed"
        echo "Total Items: $ITEM_COUNT"
        echo "Plumbing Items: $PLUMBING_ITEMS"
    fi
}

# Test 6: Verify all processing steps are present
test_processing_steps() {
    echo "======================================================"
    echo "Test 6: Verify all processing steps are present"
    echo "======================================================"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL$ENDPOINT")
    
    PHASES=$(echo "$RESPONSE" | jq -r '.data.processingSteps[].phase')
    
    if echo "$PHASES" | grep -q "FILE_UPLOAD" && \
       echo "$PHASES" | grep -q "FILE_PARSING" && \
       echo "$PHASES" | grep -q "AI_ANALYSIS" && \
       echo "$PHASES" | grep -q "DOCUMENT_GENERATION" && \
       echo "$PHASES" | grep -q "RESULT_SENDING"; then
        print_result 0 "All 5 processing phases are present"
        echo "Phases: FILE_UPLOAD, FILE_PARSING, AI_ANALYSIS, DOCUMENT_GENERATION, RESULT_SENDING"
    else
        print_result 1 "Missing processing phases"
        echo "Found phases: $PHASES"
    fi
}

# Test 7: Verify response structure
test_response_structure() {
    echo "======================================================"
    echo "Test 7: Verify response structure"
    echo "======================================================"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL$ENDPOINT")
    
    REQUIRED_FIELDS="success message isDemo data.tenderId data.fileName data.status data.boqExtraction data.itemCount data.processingSteps"
    
    ALL_PRESENT=true
    for field in $REQUIRED_FIELDS; do
        if ! echo "$RESPONSE" | jq -e ".$field" > /dev/null 2>&1; then
            ALL_PRESENT=false
            echo "Missing field: $field"
        fi
    done
    
    if [ "$ALL_PRESENT" = true ]; then
        print_result 0 "Response structure is correct (all required fields present)"
    else
        print_result 1 "Response structure is incomplete"
    fi
}

# Test 8: Verify BOQ extraction structure
test_boq_structure() {
    echo "======================================================"
    echo "Test 8: Verify BOQ extraction structure"
    echo "======================================================"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL$ENDPOINT")
    
    BOQ_FIELDS="projectName projectLocation items totalEstimatedCost currency extractionDate notes"
    
    ALL_PRESENT=true
    for field in $BOQ_FIELDS; do
        if ! echo "$RESPONSE" | jq -e ".data.boqExtraction.$field" > /dev/null 2>&1; then
            ALL_PRESENT=false
            echo "Missing BOQ field: $field"
        fi
    done
    
    # Check items structure
    FIRST_ITEM=$(echo "$RESPONSE" | jq '.data.boqExtraction.items[0]')
    ITEM_FIELDS="itemNumber description quantity unit unitRate amount category"
    
    for field in $ITEM_FIELDS; do
        if ! echo "$FIRST_ITEM" | jq -e ".$field" > /dev/null 2>&1; then
            ALL_PRESENT=false
            echo "Missing item field: $field"
        fi
    done
    
    if [ "$ALL_PRESENT" = true ]; then
        print_result 0 "BOQ extraction structure is correct"
    else
        print_result 1 "BOQ extraction structure is incomplete"
    fi
}

# Run all tests
check_server
test_no_file
test_with_file
test_no_context
test_electrical_context
test_plumbing_context
test_processing_steps
test_response_structure
test_boq_structure

# Print summary
echo ""
echo "======================================================"
echo "Test Summary"
echo "======================================================"
echo -e "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}Tests Failed: $TESTS_FAILED${NC}"
    exit 1
else
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
fi
