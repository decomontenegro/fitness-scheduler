#!/bin/bash

# JWT Authentication Debug Script using curl
# Tests API endpoint access with JWT tokens

BASE_URL="http://localhost:3002"
EMAIL="test-client@fitness.com"
PASSWORD="password123"
COOKIE_FILE="debug-cookies.txt"

echo "🚀 JWT Authentication Debug using curl"
echo "======================================"
echo "Base URL: $BASE_URL"
echo "Test Email: $EMAIL"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Step 1: Login and save cookies
print_status $BLUE "Step 1: Logging in and saving cookies..."
echo "Request: POST /api/auth/login"

LOGIN_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}\nCONTENT_TYPE:%{content_type}\nREDIRECT_URL:%{redirect_url}\n" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "User-Agent: curl-debug-tool/1.0" \
  -c "$COOKIE_FILE" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}" \
  "$BASE_URL/api/auth/login")

echo "$LOGIN_RESPONSE"
echo ""

# Extract HTTP code from response
HTTP_CODE=$(echo "$LOGIN_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
CONTENT_TYPE=$(echo "$LOGIN_RESPONSE" | grep "CONTENT_TYPE:" | cut -d: -f2)

if [ "$HTTP_CODE" = "200" ]; then
    print_status $GREEN "✅ Login successful (HTTP $HTTP_CODE)"
    
    # Extract access token from JSON response
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
    
    if [ -n "$ACCESS_TOKEN" ]; then
        print_status $GREEN "✅ Access token received: ${ACCESS_TOKEN:0:20}..."
        
        echo ""
        print_status $BLUE "Cookies saved to $COOKIE_FILE:"
        cat "$COOKIE_FILE"
        echo ""
    else
        print_status $RED "❌ No access token in response"
    fi
else
    print_status $RED "❌ Login failed (HTTP $HTTP_CODE)"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "========================================"
echo ""

# Step 2: Test API endpoint with different authentication methods
print_status $BLUE "Step 2: Testing /api/dashboard/client with different auth methods..."
echo ""

# Test 1: Using Authorization header
print_status $YELLOW "Test 1: Using Authorization header"
echo "curl -H \"Authorization: Bearer \$ACCESS_TOKEN\" /api/dashboard/client"

API_RESPONSE_1=$(curl -s -w "\nHTTP_CODE:%{http_code}\nCONTENT_TYPE:%{content_type}\nREDIRECT_URL:%{redirect_url}\n" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "User-Agent: curl-debug-tool/1.0" \
  "$BASE_URL/api/dashboard/client")

echo "Response:"
echo "$API_RESPONSE_1"
echo ""

# Extract response details
HTTP_CODE_1=$(echo "$API_RESPONSE_1" | grep "HTTP_CODE:" | cut -d: -f2)
CONTENT_TYPE_1=$(echo "$API_RESPONSE_1" | grep "CONTENT_TYPE:" | cut -d: -f2)
REDIRECT_URL_1=$(echo "$API_RESPONSE_1" | grep "REDIRECT_URL:" | cut -d: -f2-)

print_status $BLUE "Status: HTTP $HTTP_CODE_1"
print_status $BLUE "Content-Type: $CONTENT_TYPE_1"

if [ -n "$REDIRECT_URL_1" ] && [ "$REDIRECT_URL_1" != ":" ]; then
    print_status $YELLOW "⚠️  Redirect detected: $REDIRECT_URL_1"
fi

if [[ "$CONTENT_TYPE_1" == *"application/json"* ]]; then
    print_status $GREEN "✅ Received JSON response"
elif [[ "$CONTENT_TYPE_1" == *"text/html"* ]]; then
    print_status $RED "❌ Received HTML instead of JSON!"
    if [[ "$API_RESPONSE_1" == *"login"* ]] || [[ "$API_RESPONSE_1" == *"Login"* ]]; then
        print_status $RED "🚨 Appears to be redirected to login page"
    fi
fi

echo ""
echo "----------------------------------------"
echo ""

# Test 2: Using cookies
print_status $YELLOW "Test 2: Using saved cookies"
echo "curl -b cookies.txt /api/dashboard/client"

API_RESPONSE_2=$(curl -s -w "\nHTTP_CODE:%{http_code}\nCONTENT_TYPE:%{content_type}\nREDIRECT_URL:%{redirect_url}\n" \
  -b "$COOKIE_FILE" \
  -H "Content-Type: application/json" \
  -H "User-Agent: curl-debug-tool/1.0" \
  "$BASE_URL/api/dashboard/client")

echo "Response:"
echo "$API_RESPONSE_2"
echo ""

HTTP_CODE_2=$(echo "$API_RESPONSE_2" | grep "HTTP_CODE:" | cut -d: -f2)
CONTENT_TYPE_2=$(echo "$API_RESPONSE_2" | grep "CONTENT_TYPE:" | cut -d: -f2)

print_status $BLUE "Status: HTTP $HTTP_CODE_2"
print_status $BLUE "Content-Type: $CONTENT_TYPE_2"

if [[ "$CONTENT_TYPE_2" == *"application/json"* ]]; then
    print_status $GREEN "✅ Received JSON response"
elif [[ "$CONTENT_TYPE_2" == *"text/html"* ]]; then
    print_status $RED "❌ Received HTML instead of JSON!"
fi

echo ""
echo "========================================"
echo ""

# Step 3: Test without authentication (should be blocked)
print_status $BLUE "Step 3: Testing without authentication (should be blocked)..."

UNAUTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}\nCONTENT_TYPE:%{content_type}\nREDIRECT_URL:%{redirect_url}\n" \
  -H "Content-Type: application/json" \
  -H "User-Agent: curl-debug-tool/1.0" \
  "$BASE_URL/api/dashboard/client")

echo "Response:"
echo "$UNAUTH_RESPONSE"
echo ""

HTTP_CODE_3=$(echo "$UNAUTH_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
REDIRECT_URL_3=$(echo "$UNAUTH_RESPONSE" | grep "REDIRECT_URL:" | cut -d: -f2-)

print_status $BLUE "Status: HTTP $HTTP_CODE_3"

if [ "$HTTP_CODE_3" = "401" ]; then
    print_status $GREEN "✅ Middleware correctly blocks unauthenticated requests"
elif [ "$HTTP_CODE_3" = "302" ] || [ "$HTTP_CODE_3" = "307" ]; then
    print_status $YELLOW "⚠️  Middleware redirects unauthenticated requests"
    if [ -n "$REDIRECT_URL_3" ] && [ "$REDIRECT_URL_3" != ":" ]; then
        print_status $YELLOW "Redirect URL: $REDIRECT_URL_3"
    fi
else
    print_status $RED "❌ Unexpected behavior for unauthenticated request"
fi

echo ""
echo "========================================"
echo ""

# Step 4: Decode JWT token (basic info)
print_status $BLUE "Step 4: JWT Token Analysis..."

if [ -n "$ACCESS_TOKEN" ]; then
    # Split token into parts
    IFS='.' read -r HEADER PAYLOAD SIGNATURE <<< "$ACCESS_TOKEN"
    
    # Decode header (add padding if needed)
    HEADER_PADDED="$HEADER$(printf '%*s' $(( (4 - ${#HEADER} % 4) % 4 )) | tr ' ' '=')"
    DECODED_HEADER=$(echo "$HEADER_PADDED" | base64 -d 2>/dev/null)
    
    # Decode payload (add padding if needed)
    PAYLOAD_PADDED="$PAYLOAD$(printf '%*s' $(( (4 - ${#PAYLOAD} % 4) % 4 )) | tr ' ' '=')"
    DECODED_PAYLOAD=$(echo "$PAYLOAD_PADDED" | base64 -d 2>/dev/null)
    
    echo "JWT Header:"
    echo "$DECODED_HEADER" | python3 -m json.tool 2>/dev/null || echo "$DECODED_HEADER"
    echo ""
    
    echo "JWT Payload:"
    echo "$DECODED_PAYLOAD" | python3 -m json.tool 2>/dev/null || echo "$DECODED_PAYLOAD"
    echo ""
    
    # Check expiration
    if command -v jq >/dev/null 2>&1; then
        EXP=$(echo "$DECODED_PAYLOAD" | jq -r '.exp // empty' 2>/dev/null)
        if [ -n "$EXP" ]; then
            CURRENT_TIME=$(date +%s)
            if [ "$EXP" -gt "$CURRENT_TIME" ]; then
                TIME_LEFT=$(( EXP - CURRENT_TIME ))
                print_status $GREEN "✅ Token expires in $(( TIME_LEFT / 60 )) minutes"
            else
                print_status $RED "❌ Token has expired!"
            fi
        fi
    fi
else
    print_status $RED "❌ No access token available for analysis"
fi

echo ""
echo "========================================"
echo ""

# Summary
print_status $BLUE "Summary & Recommendations:"
echo ""

if [ "$HTTP_CODE_1" = "200" ] && [[ "$CONTENT_TYPE_1" == *"application/json"* ]]; then
    print_status $GREEN "✅ Authorization header method works correctly"
elif [[ "$CONTENT_TYPE_1" == *"text/html"* ]]; then
    print_status $RED "❌ Authorization header returns HTML instead of JSON"
    echo "   • Check if middleware is processing Authorization header correctly"
    echo "   • Verify JWT_SECRET environment variable is set"
    echo "   • Check middleware.ts verifyToken() function"
fi

if [ "$HTTP_CODE_2" = "200" ] && [[ "$CONTENT_TYPE_2" == *"application/json"* ]]; then
    print_status $GREEN "✅ Cookie authentication works correctly"
elif [[ "$CONTENT_TYPE_2" == *"text/html"* ]]; then
    print_status $RED "❌ Cookie authentication returns HTML instead of JSON"
    echo "   • Check if cookies are being set correctly"
    echo "   • Verify cookie names (auth-token vs access-token)"
    echo "   • Check cookie domain/path settings"
fi

echo ""
print_status $YELLOW "🔧 Debugging Commands:"
echo "1. Check server logs: tail -f server.log"
echo "2. Verify JWT_SECRET: echo \$JWT_SECRET"
echo "3. Check database user: SELECT * FROM User WHERE email = '$EMAIL';"
echo "4. Test middleware: Add console.log statements in middleware.ts"
echo ""

print_status $YELLOW "📁 Generated files:"
echo "• $COOKIE_FILE (authentication cookies)"
echo "• Use: curl -b $COOKIE_FILE -v $BASE_URL/api/dashboard/client"

# Cleanup option
echo ""
read -p "🗑️  Remove debug files? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f "$COOKIE_FILE"
    print_status $GREEN "✅ Debug files cleaned up"
fi