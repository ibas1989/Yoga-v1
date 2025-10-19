#!/bin/bash

# Clear Next.js cache
echo "Clearing Next.js cache..."
rm -rf .next
rm -rf node_modules/.cache
rm -f tsconfig.tsbuildinfo

# Clear browser cache (for development)
echo "Clearing browser cache..."
# This will help with browser cache issues during development

# Restart development server
echo "Starting development server..."
npm run dev
