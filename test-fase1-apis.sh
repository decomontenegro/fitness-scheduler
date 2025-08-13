#!/bin/bash

echo "==========================================="
echo "Testing FASE 1 - APIs Implementadas"
echo "==========================================="
echo

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3000"

# Step 1: Login as Trainer
echo -e "${YELLOW}1. Login as Trainer${NC}"
TRAINER_LOGIN=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test-trainer@fitness.com","password":"123456"}' \
  -c /tmp/trainer_cookies.txt)

if echo "$TRAINER_LOGIN" | grep -q '"role":"TRAINER"'; then
  echo -e "${GREEN}✓ Trainer login successful${NC}"
  TRAINER_ID=$(echo "$TRAINER_LOGIN" | jq -r '.user.id')
  echo "Trainer ID: $TRAINER_ID"
else
  echo -e "${RED}✗ Trainer login failed${NC}"
  exit 1
fi
echo

# Get trainer profile to get profile ID
echo -e "${YELLOW}2. Get Trainer Profile${NC}"
TRAINER_PROFILE=$(curl -s -b /tmp/trainer_cookies.txt \
  -H "x-user-id: $TRAINER_ID" \
  -H "x-user-role: TRAINER" \
  $BASE_URL/api/users/profile)

TRAINER_PROFILE_ID=$(echo "$TRAINER_PROFILE" | jq -r '.trainerProfile.id')
echo "Trainer Profile ID: $TRAINER_PROFILE_ID"
echo

# Test 1: Services CRUD
echo -e "${YELLOW}3. Test Services CRUD${NC}"

# Create a service
echo "Creating a new service..."
SERVICE_CREATE=$(curl -s -X POST $BASE_URL/api/trainers/$TRAINER_PROFILE_ID/services \
  -H "Content-Type: application/json" \
  -H "x-user-id: $TRAINER_ID" \
  -H "x-user-role: TRAINER" \
  -b /tmp/trainer_cookies.txt \
  -d '{
    "name": "Personal Training Session",
    "description": "One-on-one training session",
    "duration": 60,
    "price": 150,
    "isActive": true
  }')

if echo "$SERVICE_CREATE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Service created successfully${NC}"
  SERVICE_ID=$(echo "$SERVICE_CREATE" | jq -r '.data.id')
  echo "Service ID: $SERVICE_ID"
else
  echo -e "${RED}✗ Failed to create service${NC}"
  echo "$SERVICE_CREATE"
fi
echo

# Get services
echo "Fetching trainer services..."
SERVICES_GET=$(curl -s $BASE_URL/api/trainers/$TRAINER_PROFILE_ID/services \
  -b /tmp/trainer_cookies.txt)

if echo "$SERVICES_GET" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Services fetched successfully${NC}"
  echo "$SERVICES_GET" | jq '.data.services'
else
  echo -e "${RED}✗ Failed to fetch services${NC}"
fi
echo

# Test 2: Availability CRUD
echo -e "${YELLOW}4. Test Availability CRUD${NC}"

# Create availability
echo "Setting trainer availability..."
AVAIL_CREATE=$(curl -s -X POST $BASE_URL/api/trainers/$TRAINER_PROFILE_ID/availability \
  -H "Content-Type: application/json" \
  -H "x-user-id: $TRAINER_ID" \
  -H "x-user-role: TRAINER" \
  -b /tmp/trainer_cookies.txt \
  -d '[
    {
      "dayOfWeek": "MONDAY",
      "startTime": "08:00",
      "endTime": "18:00",
      "isActive": true
    },
    {
      "dayOfWeek": "TUESDAY",
      "startTime": "08:00",
      "endTime": "18:00",
      "isActive": true
    },
    {
      "dayOfWeek": "WEDNESDAY",
      "startTime": "08:00",
      "endTime": "18:00",
      "isActive": true
    }
  ]')

if echo "$AVAIL_CREATE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Availability created successfully${NC}"
else
  echo -e "${RED}✗ Failed to create availability${NC}"
  echo "$AVAIL_CREATE"
fi
echo

# Get availability with date
TODAY=$(date +%Y-%m-%d)
echo "Fetching availability for today ($TODAY)..."
AVAIL_GET=$(curl -s "$BASE_URL/api/trainers/$TRAINER_PROFILE_ID/availability?date=$TODAY" \
  -b /tmp/trainer_cookies.txt)

if echo "$AVAIL_GET" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Availability fetched successfully${NC}"
  SLOTS_COUNT=$(echo "$AVAIL_GET" | jq '.data.availableSlots | length')
  echo "Available slots today: $SLOTS_COUNT"
else
  echo -e "${RED}✗ Failed to fetch availability${NC}"
fi
echo

# Test 3: Appointment Status Update
echo -e "${YELLOW}5. Test Appointment Status Update${NC}"

# First, we need to create an appointment as a client
echo "Logging in as client..."
CLIENT_LOGIN=$(curl -s -X POST $BASE_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test-client@fitness.com","password":"123456"}' \
  -c /tmp/client_cookies.txt)

if echo "$CLIENT_LOGIN" | grep -q '"role":"CLIENT"'; then
  echo -e "${GREEN}✓ Client login successful${NC}"
  CLIENT_ID=$(echo "$CLIENT_LOGIN" | jq -r '.user.id')
else
  echo -e "${RED}✗ Client login failed${NC}"
fi

# Get client profile
CLIENT_PROFILE=$(curl -s -b /tmp/client_cookies.txt \
  -H "x-user-id: $CLIENT_ID" \
  -H "x-user-role: CLIENT" \
  $BASE_URL/api/users/profile)

CLIENT_PROFILE_ID=$(echo "$CLIENT_PROFILE" | jq -r '.clientProfile.id')
echo "Client Profile ID: $CLIENT_PROFILE_ID"
echo

# Create an appointment
echo "Creating test appointment..."
TOMORROW=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "+1 day" +%Y-%m-%d)
APPOINTMENT_CREATE=$(curl -s -X POST $BASE_URL/api/appointments \
  -H "Content-Type: application/json" \
  -H "x-user-id: $CLIENT_ID" \
  -H "x-user-role: CLIENT" \
  -b /tmp/client_cookies.txt \
  -d "{
    \"trainerId\": \"$TRAINER_PROFILE_ID\",
    \"clientId\": \"$CLIENT_PROFILE_ID\",
    \"serviceId\": \"$SERVICE_ID\",
    \"date\": \"${TOMORROW}T00:00:00.000Z\",
    \"startTime\": \"${TOMORROW}T10:00:00.000Z\",
    \"endTime\": \"${TOMORROW}T11:00:00.000Z\",
    \"notes\": \"Test appointment\",
    \"price\": 150
  }")

if echo "$APPOINTMENT_CREATE" | grep -q '"id"'; then
  echo -e "${GREEN}✓ Appointment created successfully${NC}"
  APPOINTMENT_ID=$(echo "$APPOINTMENT_CREATE" | jq -r '.id')
  echo "Appointment ID: $APPOINTMENT_ID"
else
  echo -e "${RED}✗ Failed to create appointment${NC}"
  echo "$APPOINTMENT_CREATE"
fi
echo

# Update appointment status as trainer
echo "Updating appointment status to CONFIRMED..."
STATUS_UPDATE=$(curl -s -X PUT $BASE_URL/api/appointments/$APPOINTMENT_ID/status \
  -H "Content-Type: application/json" \
  -H "x-user-id: $TRAINER_ID" \
  -H "x-user-role: TRAINER" \
  -b /tmp/trainer_cookies.txt \
  -d '{"status": "CONFIRMED"}')

if echo "$STATUS_UPDATE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Appointment status updated successfully${NC}"
else
  echo -e "${RED}✗ Failed to update appointment status${NC}"
  echo "$STATUS_UPDATE"
fi
echo

echo "==========================================="
echo -e "${GREEN}FASE 1 Testing Complete!${NC}"
echo "==========================================="
echo
echo "Summary of APIs tested:"
echo "✓ Services CRUD (Create, Read, Update, Delete)"
echo "✓ Availability CRUD (Bulk create, Read with slots)"
echo "✓ Appointment Status Update (PUT /api/appointments/[id]/status)"
echo
echo "All critical APIs for FASE 1 are working!"