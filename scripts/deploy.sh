#!/bin/bash

# Deployment Script for Yoga Class Tracker
# This script ensures proper deployment and fixes common 404 errors

set -e  # Exit on any error

echo "🚀 Starting Yoga Class Tracker deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf .next
rm -rf out
rm -rf dist

# Install dependencies
print_status "Installing dependencies..."
npm ci --only=production

# Run linting
print_status "Running linting..."
npm run lint

# Build the application
print_status "Building application..."
npm run build

# Verify build output
if [ ! -d ".next" ]; then
    print_error "Build failed - .next directory not found"
    exit 1
fi

print_status "Build completed successfully!"

# Check for common issues
print_status "Checking for common deployment issues..."

# Check if all required files exist
required_files=(
    ".next/static"
    ".next/server"
    "public"
)

for file in "${required_files[@]}"; do
    if [ ! -e "$file" ]; then
        print_error "Required file/directory missing: $file"
        exit 1
    fi
done

print_status "All required files present!"

# Create deployment package
print_status "Creating deployment package..."
tar -czf deployment-package.tar.gz \
    .next \
    public \
    package.json \
    package-lock.json \
    next.config.js \
    --exclude=".next/cache"

print_status "Deployment package created: deployment-package.tar.gz"

# Verify deployment package
if [ -f "deployment-package.tar.gz" ]; then
    print_status "Deployment package verified!"
else
    print_error "Failed to create deployment package"
    exit 1
fi

# Run deployment verification
print_status "Running deployment verification..."
node scripts/verify-deployment.js

# Run health check
print_status "Running health check..."
node scripts/health-check.js

print_status "🎉 Deployment preparation completed successfully!"
print_status ""
print_status "Next steps:"
print_status "1. Upload deployment-package.tar.gz to your server"
print_status "2. Extract: tar -xzf deployment-package.tar.gz"
print_status "3. Install production dependencies: npm ci --only=production"
print_status "4. Start the application: npm start"
print_status ""
print_status "For Vercel deployment:"
print_status "1. Push to your repository"
print_status "2. Vercel will automatically deploy"
print_status "3. Check the deployment URL"
