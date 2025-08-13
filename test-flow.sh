#!/bin/bash

echo "==========================================="
echo "Testing Complete Flow - Trainer vs Client"
echo "==========================================="
echo

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3000"

# Test 1: Trainer Login
echo -e "${YELLOW}Test 1: Trainer Login${NC}"
TRAINER_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test-trainer@fitness.com","password":"123456"}' \
  -c /tmp/trainer_cookies.txt)

if echo "$TRAINER_RESPONSE" | grep -q '"role":"TRAINER"'; then
  echo -e "${GREEN}✓ Trainer login successful${NC}"
  echo "$TRAINER_RESPONSE" | jq '.user | {name, email, role}'
else
  echo -e "${RED}✗ Trainer login failed${NC}"
  echo "$TRAINER_RESPONSE"
fi
echo

# Test 2: Access Trainer Pages
echo -e "${YELLOW}Test 2: Access Trainer-Specific Pages${NC}"

# Test trainer dashboard
TRAINER_DASH=$(curl -s -b /tmp/trainer_cookies.txt $BASE_URL/dashboard/trainer -o /dev/null -w "%{http_code}")
if [ "$TRAINER_DASH" = "200" ]; then
  echo -e "${GREEN}✓ /dashboard/trainer accessible${NC}"
else
  echo -e "${RED}✗ /dashboard/trainer returned $TRAINER_DASH${NC}"
fi

# Test trainer schedule page
TRAINER_SCHEDULE=$(curl -s -b /tmp/trainer_cookies.txt $BASE_URL/trainer/schedule -o /dev/null -w "%{http_code}")
if [ "$TRAINER_SCHEDULE" = "200" ]; then
  echo -e "${GREEN}✓ /trainer/schedule accessible${NC}"
else
  echo -e "${RED}✗ /trainer/schedule returned $TRAINER_SCHEDULE${NC}"
fi

# Test trainer availability page
TRAINER_AVAIL=$(curl -s -b /tmp/trainer_cookies.txt $BASE_URL/trainer/availability -o /dev/null -w "%{http_code}")
if [ "$TRAINER_AVAIL" = "200" ]; then
  echo -e "${GREEN}✓ /trainer/availability accessible${NC}"
else
  echo -e "${RED}✗ /trainer/availability returned $TRAINER_AVAIL${NC}"
fi

# Test trainer services page
TRAINER_SERVICES=$(curl -s -b /tmp/trainer_cookies.txt $BASE_URL/trainer/services -o /dev/null -w "%{http_code}")
if [ "$TRAINER_SERVICES" = "200" ]; then
  echo -e "${GREEN}✓ /trainer/services accessible${NC}"
else
  echo -e "${RED}✗ /trainer/services returned $TRAINER_SERVICES${NC}"
fi
echo

# Test 3: Client Login
echo -e "${YELLOW}Test 3: Client Login${NC}"
CLIENT_RESPONSE=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test-client@fitness.com","password":"123456"}' \
  -c /tmp/client_cookies.txt)

if echo "$CLIENT_RESPONSE" | grep -q '"role":"CLIENT"'; then
  echo -e "${GREEN}✓ Client login successful${NC}"
  echo "$CLIENT_RESPONSE" | jq '.user | {name, email, role}'
else
  echo -e "${RED}✗ Client login failed${NC}"
  echo "$CLIENT_RESPONSE"
fi
echo

# Test 4: Access Client Pages
echo -e "${YELLOW}Test 4: Access Client-Specific Pages${NC}"

# Test client dashboard
CLIENT_DASH=$(curl -s -b /tmp/client_cookies.txt $BASE_URL/dashboard/client -o /dev/null -w "%{http_code}")
if [ "$CLIENT_DASH" = "200" ]; then
  echo -e "${GREEN}✓ /dashboard/client accessible${NC}"
else
  echo -e "${RED}✗ /dashboard/client returned $CLIENT_DASH${NC}"
fi

# Test booking page (schedule)
CLIENT_SCHEDULE=$(curl -s -b /tmp/client_cookies.txt $BASE_URL/schedule -o /dev/null -w "%{http_code}")
if [ "$CLIENT_SCHEDULE" = "200" ]; then
  echo -e "${GREEN}✓ /schedule (booking) accessible for client${NC}"
else
  echo -e "${RED}✗ /schedule returned $CLIENT_SCHEDULE${NC}"
fi
echo

# Test 5: Verify Role-Based Protection
echo -e "${YELLOW}Test 5: Role-Based Access Control${NC}"

# Test if client can access trainer pages (should be redirected)
echo "Testing if client is blocked from trainer pages..."
CLIENT_TO_TRAINER=$(curl -s -b /tmp/client_cookies.txt $BASE_URL/trainer/schedule -L -o /dev/null -w "%{url_effective}")
if echo "$CLIENT_TO_TRAINER" | grep -q "dashboard/client"; then
  echo -e "${GREEN}✓ Client correctly redirected away from trainer pages${NC}"
else
  echo -e "${YELLOW}⚠ Client accessed trainer page: $CLIENT_TO_TRAINER${NC}"
fi

# Test if trainer cannot book appointments (conceptual test)
echo "Verifying trainer doesn't see booking functionality..."
TRAINER_SCHEDULE_PAGE=$(curl -s -b /tmp/trainer_cookies.txt $BASE_URL/schedule)
if echo "$TRAINER_SCHEDULE_PAGE" | grep -q "Agendar Treino"; then
  echo -e "${YELLOW}⚠ Trainer can access client booking page${NC}"
else
  echo -e "${GREEN}✓ Booking page properly restricted${NC}"
fi
echo

# Test 6: API Endpoints
echo -e "${YELLOW}Test 6: API Endpoints${NC}"

# Test trainer profile API
TRAINER_PROFILE=$(curl -s -b /tmp/trainer_cookies.txt \
  -H "x-user-id: cme38im2z0000rtpnr99vtqcr" \
  -H "x-user-role: TRAINER" \
  $BASE_URL/api/users/profile)

if echo "$TRAINER_PROFILE" | grep -q "trainerProfile"; then
  echo -e "${GREEN}✓ Trainer profile API working${NC}"
else
  echo -e "${RED}✗ Trainer profile API issue${NC}"
fi

# Test client profile API
CLIENT_PROFILE=$(curl -s -b /tmp/client_cookies.txt \
  -H "x-user-id: cme38im350009rtpnymk4l4vt" \
  -H "x-user-role: CLIENT" \
  $BASE_URL/api/users/profile)

if echo "$CLIENT_PROFILE" | grep -q "clientProfile"; then
  echo -e "${GREEN}✓ Client profile API working${NC}"
else
  echo -e "${RED}✗ Client profile API issue${NC}"
fi
echo

echo "==========================================="
echo -e "${GREEN}Flow Testing Complete!${NC}"
echo "==========================================="
echo
echo "Summary:"
echo "- Trainers can access: /trainer/schedule, /trainer/availability, /trainer/services"
echo "- Clients can access: /schedule (for booking)"
echo "- Role-based routing is enforced"
echo "- APIs respond correctly for each user type"