#!/bin/bash

# Clear Mobile Cache Script
# This script helps clear all caches and restart the development server
# to ensure the safe area changes are properly applied on mobile devices

echo "🧹 Clearing Mobile Cache and Restarting..."
echo ""

# Kill any running Next.js dev servers
echo "1. Stopping any running development servers..."
pkill -f "next dev" || true
sleep 2

# Clear Next.js cache
echo "2. Clearing Next.js cache..."
rm -rf .next
rm -rf node_modules/.cache
echo "   ✓ Next.js cache cleared"

# Clear build artifacts
echo "3. Clearing build artifacts..."
rm -f tsconfig.tsbuildinfo
echo "   ✓ Build artifacts cleared"

# Clear service worker cache (if exists)
echo "4. Service worker cache will be cleared on next load"

echo ""
echo "✅ Cache cleared successfully!"
echo ""
echo "📱 NEXT STEPS FOR MOBILE TESTING:"
echo ""
echo "1. Start the development server:"
echo "   npm run dev"
echo ""
echo "2. On your mobile device:"
echo "   a) Close the browser/app completely"
echo "   b) Clear browser cache:"
echo "      - iOS Safari: Settings → Safari → Clear History and Website Data"
echo "      - Chrome: Settings → Privacy → Clear Browsing Data"
echo "      - Or use browser's private/incognito mode"
echo "   c) If using PWA: Uninstall the PWA and reinstall it"
echo "   d) Open the app again and test"
echo ""
echo "3. To verify the fix is working:"
echo "   - Open browser DevTools (if possible)"
echo "   - Check that viewport-fit=cover is in the meta tag"
echo "   - Top buttons should now be accessible below the notch/status bar"
echo ""

# Ask if user wants to start dev server now
read -p "Do you want to start the development server now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]
then
    echo "Starting development server..."
    npm run dev
fi



