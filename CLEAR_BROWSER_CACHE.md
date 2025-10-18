# How to Clear Browser Cache and Service Worker

The 404 errors you're seeing are caused by browser caching and service worker issues. Follow these steps to fix them:

## Option 1: Hard Refresh (Quickest)
1. Open your browser at `http://localhost:3000`
2. Press **Cmd + Shift + R** (Mac) or **Ctrl + Shift + R** (Windows/Linux)
3. This will force a hard refresh and bypass the cache

## Option 2: Clear Service Worker (Recommended)
1. Open Chrome DevTools (F12 or Cmd+Option+I)
2. Go to the **Application** tab
3. Click on **Service Workers** in the left sidebar
4. Click **Unregister** next to the yoga-tracker service worker
5. Click **Clear storage** in the left sidebar
6. Check "Unregister service workers" and "Cache storage"
7. Click **Clear site data**
8. Refresh the page (Cmd+R or Ctrl+R)

## Option 3: Incognito/Private Mode (Testing)
1. Open a new Incognito/Private window
2. Navigate to `http://localhost:3000`
3. This will load the site without any cached data

## Option 4: Complete Cache Clear
1. Open Chrome Settings
2. Go to Privacy and Security → Clear browsing data
3. Select "Cached images and files"
4. Time range: "All time"
5. Click "Clear data"
6. Restart your browser

## What Was Fixed
- Updated service worker to skip Next.js static files in development
- Cleaned and rebuilt the Next.js application
- Created missing screenshot files for PWA manifest
- Simplified Next.js configuration

## After Clearing Cache
The errors should be gone and you should see:
- ✅ No 404 errors in console
- ✅ All JavaScript chunks loading correctly
- ✅ All CSS files loading correctly
- ✅ PWA manifest and icons loading correctly

If you still see errors after following these steps, please let me know!

