/\*\*

- EXTENSION MANIFEST REFERENCE
-
- Chrome Extension Manifest V3 configuration explained.
- Location: src/manifest.json
  \*/

{
// Version 3 is the latest Chrome extension standard (required)
"manifest_version": 3,

// User-facing metadata
"name": "Quizlet to Wordwall Exporter",
"version": "0.1.0",
"description": "Export Quizlet flashcards to Wordwall templates",

// Extension icon shown in toolbar
"icons": {
"16": "images/icon-16.png", // Favicon size
"48": "images/icon-48.png", // Extension list
"128": "images/icon-128.png" // Chrome Web Store
},

// Permissions required to run
"permissions": [
"activeTab", // Access the current active tab
"scripting", // Inject content scripts
"storage" // Use chrome.storage API
],

// Domains we need to access
"host_permissions": [
"https://quizlet.com/*", // Extract from Quizlet pages
"https://wordwall.net/*" // Open/detect Wordwall
],

// Background service worker (persistent context)
"background": {
"service_worker": "background.js",
"type": "module" // Use modern JS modules
},

// Content scripts injected on specific pages
"content_scripts": [
{
"matches": ["https://quizlet.com/*"],
"js": ["content.js"],
"run_at": "document_end" // After DOM is ready
}
],

// Action (extension button in toolbar)
"action": {
"default_popup": "popup.html",
"default_title": "Export to Wordwall"
}
}

/\*\*

- MANIFEST V3 KEY CONCEPTS
  \*/

// 1. PERMISSIONS vs HOST_PERMISSIONS
// - permissions: API access (storage, tabs, etc.)
// - host_permissions: URLs we can inject into

// 2. CONTENT SCRIPTS
// - Injected into matching pages
// - Can access page DOM
// - Limited access to chrome APIs
// - Can message background worker

// 3. BACKGROUND SERVICE WORKER
// - Listens for extension events
// - Relays messages between content script and popup
// - Manages storage and tab lifecycle
// - Can use most chrome APIs

// 4. ACTION / POPUP
// - Shown in extension toolbar
// - popup.html is the UI
// - Contains the React application

/\*\*

- SECURITY MODEL
-
- - No eval() or inline scripts
- - All scripts loaded from dist/
- - CSS and HTML separate files
- - React library whitelisted
    \*/

/\*\*

- CONTENT SECURITY POLICY
-
- The following are allowed:
- - Script sources: self (our scripts)
- - React library injection (needed for popup)
-
- The following are NOT allowed:
- - Inline <script> tags
- - eval() function
- - External CDNs (unless explicitly allowed)
- - Data: URLs
    \*/

/\*\*

- FUTURE MANIFEST UPDATES
-
- To support new services, update:
- 1.  host_permissions - add new domain
- 2.  content_scripts - add new domain to matches
-
- Example for Google Classroom:
- "host_permissions": [
- "https://quizlet.com/*",
- "https://classroom.google.com/*", // NEW
- "https://wordwall.net/*"
- ],
-
- "content_scripts": [
- { "matches": ["https://quizlet.com/*"], ... },
- { // NEW
-     "matches": ["https://classroom.google.com/*"],
-     "js": ["content.js"],
-     "run_at": "document_end"
- }
- ]
  \*/

/\*\*

- WEBPACK BUILD OUTPUT
-
- The webpack build:
- 1.  Compiles TypeScript → JavaScript
- 2.  Bundles React and dependencies
- 3.  Copies manifest.json (as-is)
- 4.  Copies popup.html
- 5.  Creates source maps for debugging
-
- Output in dist/ folder:
- - background.js (+ .map)
- - content.js (+ .map)
- - popup.js (+ .map, includes React)
- - manifest.json
- - popup.html
- - images/ (icons)
- - common/, services/, popup/ (type definitions)
    \*/

/\*\*

- CHROME API AVAILABILITY
-
- Available in:
- - background.js: ✅ Full access
- - popup.js: ✅ Full access (but limited lifetime)
- - content.js: ⚠️ Limited (must use messaging)
-
- Common APIs used:
- - chrome.runtime.sendMessage() - Message passing
- - chrome.runtime.onMessage - Listen for messages
- - chrome.tabs.create() - Open new tab
- - chrome.storage.local - Persist data
- - chrome.tabs.sendMessage() - Talk to content script
    \*/

/\*\*

- DEBUGGING
-
- To inspect each component:
-
- Background Service Worker:
- 1.  chrome://extensions
- 2.  Find this extension
- 3.  Click "Inspect views" > "background page"
-
- Content Script:
- 1.  On Quizlet page
- 2.  Right-click → Inspect
- 3.  Content script logs appear in console
-
- Popup:
- 1.  Click extension icon
- 2.  Right-click popup → Inspect
- 3.  Popup logs and React DevTools available
      \*/
