#!/bin/bash

echo "🔧 Direct API Test"
echo ""

# First login to get token
echo "1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test-client@fitness.com","password":"password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Got token: ${TOKEN:0:20}..."
echo ""

echo "2. Testing /api/dashboard/client with token..."
echo ""

# Test dashboard API with verbose output
curl -v http://localhost:3000/api/dashboard/client \
  -H "Authorization: Bearer $TOKEN" \
  2>&1 | grep -E "(< HTTP|< Location|< Content-Type)"

echo ""
echo "3. Testing actual response..."
RESPONSE=$(curl -s http://localhost:3000/api/dashboard/client \
  -H "Authorization: Bearer $TOKEN")

# Check if response is JSON or HTML
if [[ $RESPONSE == "<!DOCTYPE"* ]]; then
  echo "❌ Got HTML response instead of JSON"
  echo "First 200 chars: ${RESPONSE:0:200}"
else
  echo "✅ Got JSON response"
  echo "Response: $RESPONSE" | head -c 500
fi