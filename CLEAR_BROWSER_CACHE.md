# How to Clear Browser Cache

Since the app works in incognito mode, you need to clear your browser cache. Here are instructions for different browsers:

## Quick Method (All Browsers)

### Hard Refresh
- **Mac**: `Cmd + Shift + R` or `Cmd + Option + R`
- **Windows/Linux**: `Ctrl + Shift + R` or `Ctrl + F5`

### Clear Cache via DevTools
1. Open DevTools (F12 or Right-click → Inspect)
2. Right-click the refresh/reload button
3. Select **"Empty Cache and Hard Reload"** or **"Clear cache and hard reload"**

## Detailed Instructions by Browser

### Chrome / Edge (Chromium-based)
1. Press `Ctrl + Shift + Delete` (Windows/Linux) or `Cmd + Shift + Delete` (Mac)
2. Select **"Cached images and files"**
3. Time range: **"All time"** or **"Last hour"**
4. Click **"Clear data"**

**Alternative:**
1. Go to `chrome://settings/clearBrowserData` (or `edge://settings/clearBrowserData`)
2. Select **"Cached images and files"**
3. Time range: **"All time"**
4. Click **"Clear data"**

### Firefox
1. Press `Ctrl + Shift + Delete` (Windows/Linux) or `Cmd + Shift + Delete` (Mac)
2. Select **"Cache"**
3. Time range: **"Everything"**
4. Click **"Clear Now"**

**Alternative:**
1. Go to `about:preferences#privacy`
2. Scroll to "Cookies and Site Data"
3. Click **"Clear Data"**
4. Check **"Cached Web Content"**
5. Click **"Clear"**

### Safari (Mac)
1. Press `Cmd + Option + E` to clear cache
2. Or go to **Safari** → **Settings** → **Advanced**
3. Check **"Show Develop menu in menu bar"**
4. Go to **Develop** → **Empty Caches**

**Alternative:**
1. Go to **Safari** → **Settings** → **Privacy**
2. Click **"Manage Website Data"**
3. Click **"Remove All"** or search for your domain and remove it

### Safari (iOS)
1. Go to **Settings** → **Safari**
2. Tap **"Clear History and Website Data"**
3. Confirm

## Clear Cache for Specific Site Only

### Chrome/Edge
1. Open DevTools (F12)
2. Go to **Application** tab (or **Storage** in older versions)
3. Click **"Clear site data"** button
4. Or expand **"Storage"** → Right-click your domain → **"Clear"**

### Firefox
1. Open DevTools (F12)
2. Go to **Storage** tab
3. Right-click your domain → **"Delete All"**

## Programmatic Cache Clear (For Development)

You can also add this to your browser console to clear cache:

```javascript
// Clear all caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});

// Clear localStorage
localStorage.clear();

// Clear sessionStorage
sessionStorage.clear();

// Reload page
location.reload(true);
```

## Prevent Future Cache Issues

The app now includes:
- Proper cache headers for static assets
- Cache-busting query parameters for development
- Service worker cache management

If you continue to have cache issues, try:
1. Disable browser extensions temporarily
2. Use a different browser
3. Clear cookies as well as cache
4. Restart your browser completely

## For Vercel Deployment

After deployment:
1. Wait for deployment to complete
2. Hard refresh the page (`Cmd + Shift + R` or `Ctrl + Shift + R`)
3. Or clear site data for `yoga-v1.vercel.app` specifically
