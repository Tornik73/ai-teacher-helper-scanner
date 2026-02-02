# Troubleshooting Guide

## Common Issues & Solutions

### Issue 1: Extension Not Showing Cards

**Symptoms**: Click extension on Quizlet page, popup shows "No cards found"

**Possible Causes & Solutions**:

1. **You're not on a Quizlet set page**
   - ✅ Correct: https://quizlet.com/123456/my-set/
   - ✅ Correct: https://quizlet.com/ua/123456/...
   - ❌ Wrong: https://quizlet.com/me/sets/
   - ❌ Wrong: https://quizlet.com/classes/
   - **Solution**: Navigate to an actual flashcard set page

2. **Quizlet page is still loading**
   - Wait 2-3 seconds for page to fully load
   - Cards are extracted at `document_end` event
   - Try clicking extension again after page loads

3. **Quizlet changed their DOM structure**
   - Selectors in `src/services/quizletService.ts` may be outdated
   - **Debug**: Open DevTools on Quizlet page:
     ```javascript
     // Test selector in browser console
     document.querySelectorAll('[class*="FlashcardTerm"]').length;
     // Should return number > 0
     ```
   - If returns 0, DOM structure has changed
   - Need to update selectors in QuizletService

4. **Extension not injected on Quizlet page**
   - Check `chrome://extensions/` - extension is enabled?
   - Check `src/manifest.json` - host_permissions includes `https://quizlet.com/*`?
   - Reload extension: Toggle off/on in `chrome://extensions/`

**How to Debug**:

```javascript
// In DevTools on Quizlet page
// Test content script is loaded
console.log("Content script loaded");

// Test service detection
const service = new QuizletService();
console.log(service.isApplicable()); // Should be true

// Try manual extraction
service.extractCards().then((result) => {
  console.log("Extracted:", result.cards.length, "cards");
});
```

---

### Issue 2: Extension Button Not Responding

**Symptoms**: Click extension icon, nothing happens or popup crashes

**Solutions**:

1. **Pop up doesn't open**
   - Check `popup.html` exists in `dist/` folder
   - Verify manifest has `"default_popup": "popup.html"`
   - Reload extension in `chrome://extensions/`

2. **Popup shows error message**
   - Right-click popup → Inspect
   - Check console for error messages
   - Common errors:
     - "No tab context" - extension not on Quizlet page
     - "Failed to extract cards" - content script issue

3. **React not rendering**
   - Check `dist/popup.js` includes React library
   - Verify `popup.html` has `<div id="root"></div>`
   - Check popup console for React errors

**Debug Steps**:

```javascript
// In popup DevTools
// Check if React mounted
document.getElementById("root").innerHTML; // Should have React elements
```

---

### Issue 3: Cards Not Exporting to Wordwall

**Symptoms**: Click export, new tab opens but data doesn't populate

**Possible Causes**:

1. **Wordwall page requires cookie acceptance**
   - Wordwall sometimes shows privacy banner
   - Must accept/reject before seeing form
   - **Solution**: Navigate to Wordwall manually, accept cookies, then try export again

2. **Data not injected into Wordwall page**
   - Check storage in `chrome.storage.local`
   - Open DevTools on Wordwall page:
     ```javascript
     // Check if data exists in storage
     chrome.storage.local.get(null, (items) => {
       console.log("Stored items:", items);
     });
     ```

3. **Wordwall page is too old/outdated**
   - Wordwall may have changed their form structure
   - Check form field names in browser DevTools
   - May need to update export logic

4. **sessionKey is wrong format**
   - sessionKey is generated as `wordwall_export_${timestamp}`
   - Verify this key exists in chrome.storage.local

**Debug Steps**:

```javascript
// In Wordwall page DevTools
// Check if sessionKey was passed in URL
const urlParams = new URLSearchParams(window.location.search);
console.log("sessionKey:", urlParams.get("sessionKey"));

// Try to retrieve data
const key = urlParams.get("sessionKey");
chrome.storage.local.get(key, (items) => {
  console.log("Retrieved data:", items);
});
```

---

### Issue 4: "Conversion of type... may be a mistake" TypeScript Error

**Symptoms**: Build fails with type conversion error

**Solution**: Already fixed in the codebase

- Use type casting with `as unknown` first:
  ```typescript
  const cards = message.payload as unknown as FlashcardSet;
  ```

---

### Issue 5: Cards Extract but Look Wrong

**Symptoms**: Extension shows cards but terms/definitions are swapped or incomplete

**Causes**:

1. **Different Quizlet layout**
   - Quizlet has multiple card display modes
   - Current selectors may not work for all layouts
   - **Solution**: Add more selector fallbacks in QuizletService

   **Debug**:

   ```javascript
   // In Quizlet DevTools console
   // Find the correct selector for this page
   document.querySelectorAll('[class*="term"]'); // Try variations
   document.querySelectorAll('[data-test*="term"]');
   document.querySelectorAll(".flashcard");
   document.querySelectorAll('[role="option"]');
   ```

2. **Content inside HTML comments or hidden elements**
   - Check if selectors are finding right elements
   - May need to skip hidden/archived cards

---

### Issue 6: Popup Content Not Scrolling

**Symptoms**: More than 10 cards, can't see all of them

**Solution**: This is by design

- Card list has `max-height: 300px` with `overflow-y: auto`
- Should be scrollable within the popup
- If not scrolling, check CSS is applied:
  ```javascript
  // In popup DevTools
  const cardList = document.querySelector(".card-list");
  console.log(window.getComputedStyle(cardList).maxHeight); // Should be 300px
  ```

---

### Issue 7: Extension Not Loading from dist/

**Symptoms**: "Load unpacked" button doesn't work or shows error

**Solutions**:

1. **Wrong folder selected**
   - Select `dist/` not root folder
   - `dist/manifest.json` must exist

2. **manifest.json missing or invalid**
   - Verify `dist/manifest.json` exists
   - Check it's valid JSON:
     ```bash
     python3 -m json.tool dist/manifest.json
     ```

3. **Build output not in dist/**
   - Run `npm run build` first
   - Check `dist/` folder was created:
     ```bash
     ls -la dist/
     ```

4. **File permissions issue** (macOS/Linux)
   - Try:
     ```bash
     chmod -R 755 dist/
     ```

---

### Issue 8: Development Build Very Large

**Symptoms**: `popup.js` is 156 KB, seems too large

**Analysis**: This is normal

- Includes full React library (~42 KB)
- React-DOM library (~131 KB)
- Webpack overhead (~3 KB)
- Source maps for debugging
- Minified and optimized for production

**Reduce size (if needed)**:

- Remove React, use vanilla JS: ~50 KB
- Use TypeScript build without source maps: ~130 KB
- This is acceptable for extension size

---

### Issue 9: "Cannot find module" During Build

**Symptoms**: Build fails with module not found error

**Solutions**:

1. **Missing dependencies**

   ```bash
   npm install
   npm run build
   ```

2. **Wrong import path**
   - Check relative paths in imports
   - Should use `../` correctly:

     ```typescript
     // ✅ Correct from src/popup/popup.tsx
     import { FlashcardSet } from "../common/types";

     // ❌ Wrong
     import { FlashcardSet } from "./common/types";
     ```

3. **Case sensitivity issue** (Linux)
   - Filenames must match exactly:

     ```typescript
     // ✅ Correct
     import { QuizletService } from "../services/quizletService";

     // ❌ Wrong (capital Q)
     import { QuizletService } from "../services/QuizletService";
     ```

---

### Issue 10: Browser Compatibility

**This extension only works on:**

- ✅ Chrome 88+
- ✅ Edge 88+ (Chromium-based)
- ❌ Firefox (different manifest system)
- ❌ Safari (different extension API)
- ❌ Opera (might work, not tested)

**To support Firefox**:

- Convert from Manifest V3 to V2
- Major rewrite of storage API
- Update message passing
- Estimated effort: 2-4 hours

---

## Debugging Checklist

### When Something Breaks:

1. **Clear and reload**

   ```
   chrome://extensions/ → Turn off → Turn on
   ```

2. **Check all three console areas**
   - Background worker: `chrome://extensions/` → Inspect views > background page
   - Popup: Right-click extension → Inspect popup
   - Content script: Right-click on page → Inspect

3. **Verify DOM hasn't changed**

   ```javascript
   // In Quizlet DevTools
   document.querySelectorAll('[class*="term"]').length; // Should be > 0
   ```

4. **Check manifest permissions**

   ```
   chrome://extensions/ → Details → Permissions
   ```

5. **Review storage**

   ```javascript
   // In any extension context
   chrome.storage.local.get(null, (items) => {
     console.table(items);
   });
   ```

6. **Check tabs context**
   ```javascript
   // Only in background or popup
   chrome.tabs.query({}, (tabs) => {
     console.log("Active tabs:", tabs.length);
   });
   ```

---

## Performance Tips

### If Extension is Slow:

1. **Card extraction taking long?**
   - Reduce number of DOM queries in QuizletService
   - Cache selector results
   - Use `requestAnimationFrame` for parsing

2. **Popup is laggy?**
   - Use `React.memo()` for CardItem component
   - Virtualize long lists with `react-window`
   - Debounce edit events

3. **Large datasets?**
   - Use IndexedDB instead of localStorage
   - Lazy-load card list in popup
   - Implement pagination

---

## Getting Help

### Check These First:

1. Browser console for error messages
2. This troubleshooting guide
3. `DEVELOPMENT.md` for debugging techniques
4. Source code comments in relevant file

### Information to Gather:

- Error message (full text)
- Browser version (`chrome://version/`)
- Extension version (check manifest.json)
- Steps to reproduce
- Screenshots of errors

---

## Report a Bug

Include:

1. **What you were doing** - Step by step
2. **What happened** - Expected vs actual
3. **Error messages** - Full error text
4. **Environment** - Chrome version, OS
5. **Console logs** - Output from DevTools
6. **Screenshot** - If applicable

---

Last updated: February 2, 2026
