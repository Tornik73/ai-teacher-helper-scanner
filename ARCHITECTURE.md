/\*\*

- DESIGN PATTERNS & BEST PRACTICES
-
- This extension is built with extensibility in mind. This guide explains
- the architectural patterns used and how to extend them.
  \*/

/\*\*

- PATTERN 1: Service Provider Pattern
-
- All flashcard sources (Quizlet, Google Classroom, etc.) implement IFlashcardService.
- This allows:
- - Easy detection of which service the page belongs to
- - Consistent extraction interface
- - Pluggable service discovery
-
- EXAMPLE: Adding Google Classroom
-
- 1.  Create a new file: src/services/classroomService.ts
- 2.  Implement IFlashcardService interface
- 3.  Update content script to detect and use the service
- 4.  Register in service factory
-
- // src/services/classroomService.ts
- export class GoogleClassroomService implements IFlashcardService {
- isApplicable(): boolean {
-     return window.location.hostname === 'classroom.google.com';
- }
-
- getServiceId(): string {
-     return 'google-classroom';
- }
-
- async extractCards(): Promise<FlashcardSet> {
-     // Extract from Classroom-specific DOM structures
- }
- }
  \*/

/\*\*

- PATTERN 2: Template Factory Pattern
-
- Wordwall templates are created via a factory. Benefits:
- - Centralized template registry
- - Easy to add new templates
- - Type-safe template access
- - Extensible metadata system
-
- EXAMPLE: Adding a new Wordwall template
-
- // src/services/wordwallTemplates.ts
- export class MyCustomTemplate implements IExportTemplate {
- getMetadata() {
-     return {
-       type: 'my-custom-type',
-       templateId: 999,
-       name: 'My Custom Template',
-       description: 'Description here',
-     };
- }
-
- formatCards(cards: FlashcardPair[], title: string): Record<string, unknown> {
-     // Format cards for Wordwall's API
- }
- }
-
- // Register in factory
- WordwallTemplateFactory.register('my-custom-type', new MyCustomTemplate());
  \*/

/\*\*

- PATTERN 3: Message Passing Architecture
-
- Communication between content script, background worker, and popup:
-
- Content Script → Background Worker → Popup UI
- (on page) (persistent context) (user interface)
-
- - Content script can't access chrome.storage or tabs API
- - Background worker coordinates between multiple contexts
- - Popup asks background worker for stored data
-
- Message types:
- - 'extract-cards': Content script → Extract from page
- - 'update-cards': Popup → Store modified cards
- - 'get-cards': Popup → Retrieve stored cards
- - 'export-wordwall': Popup → Trigger export
    \*/

/\*\*

- PATTERN 4: Progressive Enhancement
-
- DOM extraction uses multiple selectors as fallback:
- 1.  Primary selector (most specific)
- 2.  Secondary selector (alternative structure)
- 3.  Attribute-based extraction (last resort)
-
- This makes the extension resilient to DOM changes.
-
- IMPLEMENTATION TIP:
- - Keep a list of tested selectors in comments
- - Test with different Quizlet page types (sets, classes, etc.)
- - Add versioning to extraction logic as Quizlet updates
    \*/

/\*\*

- PATTERN 5: Data Flow with Error Handling
-
- Each layer has responsibility:
-
- Content Script:
- - Extract from DOM (no storage)
- - Send error details
- - Validate extracted data
-
- Background Worker:
- - Relay messages
- - Store in chrome.storage
- - Clean up expired data
- - Tab lifecycle management
-
- Popup:
- - User interaction
- - Local state management
- - User-facing errors
- - Data validation before export
    \*/

/\*\*

- PATTERN 6: Extensible Export System
-
- Future export targets (not just Wordwall):
-
- interface IExportTarget {
- exportData(
-     cards: FlashcardPair[],
-     template: string,
-     config?: Record<string, unknown>
- ): Promise<void>;
- }
-
- Current: WordwallExporter
- Future: GoogleClassroomExporter, AnkiExporter, QuizletExporter, etc.
  \*/

/\*\*

- DATA PERSISTENCE STRATEGY
-
- Current: chrome.storage.local + localStorage fallback
-
- Benefits:
- - Works in both extension and content script contexts
- - Data survives browser restart
- - No user authentication needed
- - 10MB quota per extension
-
- Alternative for future:
- - IndexedDB for larger datasets
- - Service Worker offline support
- - Cloud sync with user account
    \*/

/\*\*

- SECURITY CONSIDERATIONS
-
- 1.  Content Security Policy (manifest.json)
- - Only allows React library (needed for UI)
- - No inline scripts
- - No external resources
-
- 2.  Data Storage
- - No passwords stored
- - No authentication tokens
- - Data in chrome.storage (user-local)
-
- 3.  Cross-site Communication
- - Only Wordwall tab opened by extension
- - No data sent to external APIs
- - Data injected via storage, not URL
-
- Future considerations:
- - Rate limiting for API calls
- - Encryption for sensitive data
- - User consent for data sharing
    \*/

/\*\*

- PERFORMANCE OPTIMIZATIONS
-
- Current:
- - Lazy extraction (on-demand)
- - React memoization in popup
- - Efficient DOM selectors
- - Cleanup of old data
-
- Potential improvements:
- - Service worker message debouncing
- - Virtual list for large card sets (1000+)
- - IndexedDB for full-text search
- - Background sync for offline exports
    \*/

/\*\*

- TESTING STRATEGY
-
- For new services:
- 1.  Test DOM selectors in browser console
- 2.  Verify extraction with sample pages
- 3.  Check message passing with DevTools
- 4.  Validate formatted output
-
- For new templates:
- 1.  Manually test on Wordwall
- 2.  Verify all fields populate
- 3.  Check template-specific features (randomization, etc.)
      \*/
