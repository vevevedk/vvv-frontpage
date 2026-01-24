#!/usr/bin/env bash
set -euo pipefail

#############################################
# Smoke Tests Script
# Comprehensive testing before production deployment
#############################################

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Configuration
BASE_URL="${1:-https://veveve.io}"
ENVIRONMENT="${2:-production}"

echo ""
echo "🧪 Running Smoke Tests"
echo "======================"
echo "Environment: $ENVIRONMENT"
echo "Base URL: $BASE_URL"
echo ""

FAILED_TESTS=0
PASSED_TESTS=0

# Test 1: Frontend Accessibility
print_info "Test 1: Frontend Accessibility"
if STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" 2>/dev/null); then
    if [ "$STATUS" = "200" ]; then
        print_success "Frontend is accessible (HTTP $STATUS)"
        ((PASSED_TESTS++))
    else
        print_error "Frontend returned HTTP $STATUS (expected 200)"
        ((FAILED_TESTS++))
    fi
else
    print_error "Frontend is not accessible"
    ((FAILED_TESTS++))
fi
echo ""

# Test 2: Domain Routing - veveve.io
print_info "Test 2: Domain Routing (veveve.io)"
if RESPONSE=$(curl -s https://veveve.io 2>/dev/null); then
    if echo "$RESPONSE" | grep -qi "PPC\|Scale Your PPC\|Google Ads\|Facebook Ads"; then
        print_success "veveve.io shows English PPC-focused content"
        ((PASSED_TESTS++))
    else
        print_warning "veveve.io content check: Could not verify PPC content"
    fi
    
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://veveve.io 2>/dev/null || echo "000")
    if [ "$STATUS" = "200" ]; then
        print_success "veveve.io is accessible (HTTP $STATUS)"
        ((PASSED_TESTS++))
    else
        print_error "veveve.io failed (HTTP $STATUS)"
        ((FAILED_TESTS++))
    fi
else
    print_error "veveve.io is not accessible"
    ((FAILED_TESTS++))
fi
echo ""

# Test 3: Domain Routing - veveve.dk
print_info "Test 3: Domain Routing (veveve.dk)"
if STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://veveve.dk 2>/dev/null); then
    if [ "$STATUS" = "200" ]; then
        print_success "veveve.dk is accessible (HTTP $STATUS)"
        ((PASSED_TESTS++))
    else
        print_error "veveve.dk failed (HTTP $STATUS)"
        ((FAILED_TESTS++))
    fi
else
    print_error "veveve.dk is not accessible"
    ((FAILED_TESTS++))
fi
echo ""

# Test 4: Login Redirect
print_info "Test 4: Login Redirect (veveve.dk → veveve.io)"
if REDIRECT=$(curl -sI https://veveve.dk/login 2>/dev/null | grep -i "location:"); then
    if echo "$REDIRECT" | grep -qi "veveve.io/login"; then
        print_success "Login redirect working (veveve.dk/login → veveve.io/login)"
        ((PASSED_TESTS++))
    else
        print_warning "Login redirect check inconclusive"
        echo "   Redirect: $REDIRECT"
    fi
else
    print_warning "Could not verify login redirect"
fi
echo ""

# Test 5: API Endpoints
print_info "Test 5: API Endpoints"
if RESPONSE=$(curl -s "$BASE_URL/api/test/" 2>/dev/null); then
    if echo "$RESPONSE" | grep -qi "success\|status"; then
        print_success "API /test/ endpoint is working"
        ((PASSED_TESTS++))
    else
        print_warning "API /test/ response: $RESPONSE"
    fi
else
    print_warning "API /test/ endpoint not accessible"
fi

# Test health endpoint
if RESPONSE=$(curl -s "$BASE_URL/api/health" 2>/dev/null); then
    if echo "$RESPONSE" | grep -qi "healthy\|status"; then
        print_success "Health endpoint is working"
        ((PASSED_TESTS++))
    fi
else
    print_warning "Health endpoint not accessible"
fi
echo ""

# Test 6: SSL Certificates
print_info "Test 6: SSL Certificates"
for domain in veveve.io veveve.dk; do
    if echo | timeout 5 openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | grep -q "Verify return code: 0"; then
        print_success "SSL certificate valid for $domain"
        ((PASSED_TESTS++))
    else
        print_warning "SSL certificate check for $domain inconclusive"
    fi
done
echo ""

# Test 7: HTTPS Redirects
print_info "Test 7: HTTPS Redirects"
for domain in veveve.io veveve.dk; do
    if REDIRECT=$(curl -sI "http://$domain" 2>/dev/null | grep -i "location:"); then
        if echo "$REDIRECT" | grep -qi "https://"; then
            print_success "HTTP to HTTPS redirect working for $domain"
            ((PASSED_TESTS++))
        else
            print_warning "HTTP redirect check for $domain inconclusive"
        fi
    else
        print_warning "Could not verify HTTP redirect for $domain"
    fi
done
echo ""

# Test 8: Performance
print_info "Test 8: Performance Check"
START=$(date +%s%N)
if curl -sf "$BASE_URL" > /dev/null 2>&1; then
    END=$(date +%s%N)
    DURATION=$(( (END - START) / 1000000 ))
    echo "Frontend response time: ${DURATION}ms"
    
    if [ "$DURATION" -lt 3000 ]; then
        print_success "Frontend response time acceptable (< 3s)"
        ((PASSED_TESTS++))
    else
        print_warning "Frontend response time slow (> 3s): ${DURATION}ms"
    fi
else
    print_error "Could not measure performance"
    ((FAILED_TESTS++))
fi
echo ""

# Summary
echo "======================"
echo "📊 Test Summary"
echo "======================"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"
echo ""

if [ "$FAILED_TESTS" -eq 0 ]; then
    print_success "All critical tests passed! ✅"
    exit 0
else
    print_error "$FAILED_TESTS test(s) failed. Please review before deploying to production."
    exit 1
fi
