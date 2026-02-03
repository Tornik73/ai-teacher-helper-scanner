# Windows Chrome Session Storage Fix

## Problem
On Windows Chrome, Wordwall does not auto-populate with data when opening the create page. Session storage appears empty on Windows but works fine on macOS.

## Root Cause
The issue is a **timing/synchronization problem** between tabs in Chrome on Windows:

1. The popup script stores data in `chrome.storage.local` and opens a new tab
2. The new tab's content script immediately tries to read from `chrome.storage.local`
3. On Windows, there's a race condition where the storage query completes before the data is fully written
4. The content script gets an empty result and falls back to `localStorage`, which is also empty
5. Result: No data is available to populate the Wordwall form

This doesn't occur on macOS likely due to:
- Different Chrome IPC timing
- Different storage backend latency
- Different tab/context switching performance

## Solution
Implemented **exponential backoff retry mechanism** in the `getExportData()` function:

### Changes Made
**File: `src/content/wordwall.ts`**

1. **Enhanced `getExportData()` function** (lines 25-57):
   - Added retry loop with max 5 attempts
   - Exponential backoff: 100ms, 200ms, 400ms, 800ms, 1600ms delays
   - Checks `chrome.storage.local` first, then falls back to `localStorage`
   - Logs each attempt for debugging

2. **Enhanced `run()` function** (lines 378-425):
   - Added debug logging at startup to show URL and storage contents
   - Logs available keys in both `localStorage` and `sessionStorage`
   - Better error diagnostics if data retrieval fails

### How It Works
```
Attempt 1: Check chrome.storage.local → not ready yet
Wait 100ms
Attempt 2: Check chrome.storage.local → not ready yet
Wait 200ms
Attempt 3: Check chrome.storage.local → SUCCESS! Data retrieved
Return data and populate form
```

## Testing
To test the fix on Windows:

1. Build the extension: `npm run build`
2. Load the extension in Chrome (Developer mode)
3. Extract cards from Quizlet
4. Export to Wordwall
5. Check console logs in the Wordwall create page (F12 → Console)
6. Look for log: "Successfully retrieved data on attempt X"

## Debug Output
When storage retrieval succeeds, you'll see:
```
[Wordwall Content] Successfully retrieved data on attempt 1
[Wordwall Content] Export data loaded: {...}
```

If it takes multiple attempts:
```
[Wordwall Content] Attempt 1: chrome.storage error: ...
[Wordwall Content] Retrying storage access (attempt 2/5)...
[Wordwall Content] Successfully retrieved data on attempt 2
```

## Fallback Behavior
If `chrome.storage.local` is unavailable after all retries:
- Falls back to `localStorage`
- If `localStorage` also has no data, returns null
- Form population is skipped (manual entry required)

This maintains backward compatibility while fixing the Windows-specific issue.
