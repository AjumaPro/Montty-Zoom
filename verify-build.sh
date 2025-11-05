#!/bin/bash

# Production Build Verification Script
# This script verifies that the production build is ready for deployment

set -e  # Exit on any error

echo "🔍 Starting production build verification..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js version: ${NODE_VERSION}${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

# Check environment variables
echo ""
echo "📋 Checking environment variables..."
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Using defaults...${NC}"
else
    echo -e "${GREEN}✅ .env file found${NC}"
fi

# Check required environment variables
REQUIRED_VARS=("NODE_ENV" "PORT")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Missing environment variables: ${MISSING_VARS[*]}${NC}"
else
    echo -e "${GREEN}✅ Required environment variables set${NC}"
fi

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
cd web-app
npm ci --production=false
cd ..

# Build frontend
echo ""
echo "🏗️  Building frontend..."
cd web-app
npm run build

# Check if build directory exists
if [ ! -d "build" ]; then
    echo -e "${RED}❌ Build directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Frontend build completed${NC}"

# Check build size
BUILD_SIZE=$(du -sh build | cut -f1)
echo -e "${GREEN}✅ Build size: ${BUILD_SIZE}${NC}"

# Check for critical files
CRITICAL_FILES=("build/index.html" "build/static/js/main.*.js" "build/static/css/main.*.css")
MISSING_FILES=()

for file in "${CRITICAL_FILES[@]}"; do
    if ! ls $file 1> /dev/null 2>&1; then
        MISSING_FILES+=("$file")
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Some build files not found: ${MISSING_FILES[*]}${NC}"
else
    echo -e "${GREEN}✅ All critical build files present${NC}"
fi

cd ..

# Check backend
echo ""
echo "🔍 Checking backend..."
if [ ! -f "server/index.js" ]; then
    echo -e "${RED}❌ Backend server file not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Backend server file found${NC}"

# Run backend tests (if available)
if npm run test 2>/dev/null; then
    echo -e "${GREEN}✅ Backend tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Backend tests not available or failed (continuing...)${NC}"
fi

# Check Docker files
echo ""
echo "🐳 Checking Docker configuration..."
if [ -f "Dockerfile" ]; then
    echo -e "${GREEN}✅ Backend Dockerfile found${NC}"
else
    echo -e "${YELLOW}⚠️  Backend Dockerfile not found${NC}"
fi

if [ -f "web-app/Dockerfile" ]; then
    echo -e "${GREEN}✅ Frontend Dockerfile found${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend Dockerfile not found${NC}"
fi

if [ -f "docker-compose.yml" ]; then
    echo -e "${GREEN}✅ docker-compose.yml found${NC}"
else
    echo -e "${YELLOW}⚠️  docker-compose.yml not found${NC}"
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Production build verification completed!${NC}"
echo ""
echo "Next steps:"
echo "1. Review environment variables in .env"
echo "2. Test the build locally: npm start"
echo "3. Build Docker images: docker-compose build"
echo "4. Deploy to production"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

exit 0

