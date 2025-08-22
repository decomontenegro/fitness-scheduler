#!/bin/bash

echo "🔧 Fixing Railway Database Connection"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check current variables
echo -e "${YELLOW}📊 Current Railway Variables:${NC}"
railway variables | grep DATABASE

# Step 2: Set the correct DATABASE_URL
echo -e "\n${YELLOW}🔄 Setting correct DATABASE_URL...${NC}"
railway variables --set DATABASE_URL="postgresql://postgres:MjklMnBuFexBjXHnSmXQOAjSKpGnVjVe@viaduct.proxy.rlwy.net:42063/railway"

# Step 3: Test connection using Railway run
echo -e "\n${YELLOW}🧪 Testing database connection through Railway...${NC}"
railway run npx prisma db push --skip-generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database connection successful!${NC}"
    
    # Step 4: Run migrations
    echo -e "\n${YELLOW}📊 Running migrations...${NC}"
    railway run npx prisma migrate deploy
    
    # Step 5: Seed the database
    echo -e "\n${YELLOW}🌱 Seeding database...${NC}"
    railway run npx tsx prisma/seed-production.ts
    
    # Step 6: Deploy the app
    echo -e "\n${YELLOW}🚀 Deploying to Railway...${NC}"
    railway up
    
    echo -e "\n${GREEN}✅ Database fixed and app deployed!${NC}"
    echo -e "${GREEN}Check your app at: https://fitness-scheduler-production.up.railway.app${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    echo -e "${YELLOW}Trying alternative approach...${NC}"
    
    # Alternative: Try with DATABASE_PRIVATE_URL if available
    echo -e "\n${YELLOW}Checking for DATABASE_PRIVATE_URL...${NC}"
    railway variables --json | grep DATABASE_PRIVATE_URL
    
    if [ $? -eq 0 ]; then
        PRIVATE_URL=$(railway variables --json | grep DATABASE_PRIVATE_URL | cut -d'"' -f4)
        echo -e "${YELLOW}Setting DATABASE_URL to private URL...${NC}"
        railway variables --set DATABASE_URL="$PRIVATE_URL"
        railway up
    else
        echo -e "${RED}❌ No alternative database URL found${NC}"
        echo -e "${YELLOW}Please check Railway dashboard for database credentials${NC}"
    fi
fi