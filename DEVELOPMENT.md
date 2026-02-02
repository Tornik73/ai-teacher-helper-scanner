## Getting Started

### Installation

1. Clone or navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

### Building

**Development (Watch Mode):**

```bash
npm run dev
```

This watches for changes and rebuilds automatically.

**Production Build:**

```bash
npm run build
```

Output is in the `dist/` folder.

### Loading into Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **Load unpacked**
4. Select the `dist/` folder from this project
5. The extension should now appear in your browser

### Testing

1. Visit a Quizlet flashcard page: https://quizlet.com/[any-set-id]/
2. Click the extension icon in the Chrome toolbar
3. The popup should show extracted cards
4. You can:
   - Edit cards (click the pencil icon)
   - Delete cards (click the trash icon)
   - Add new cards
   - Select a template
   - Click "Export" to transfer to Wordwall

### Project Architecture

```
src/
├── background/
│   └── background.ts          # Service worker for message relay
├── content/
│   └── content.ts             # Quizlet page injection script
├── popup/
│   ├── popup.tsx              # React UI component
│   └── popup.html             # Popup entry point
├── services/
│   ├── quizletService.ts      # Flashcard extraction logic
│   ├── wordwallTemplates.ts   # Template formatters
│   └── wordwallExporter.ts    # Wordwall integration
└── common/
    ├── types.ts               # TypeScript interfaces
    └── interfaces.ts          # Abstract service interfaces
```

### Key Concepts

**Three-way Communication:**

1. Content script (Quizlet page) ←→ Background worker ←→ Popup (UI)
2. Messages are passed via `chrome.runtime.sendMessage()`

**Extensible Design:**

- `IFlashcardService` - Add new flashcard providers by implementing this interface
- `IExportTemplate` - Create new Wordwall template formats easily
- Services are registered in factories for easy discovery

**Data Flow:**

```
Quizlet Page
    ↓ (content script)
Extract cards via DOM parsing
    ↓ (send message)
Background Service Worker stores data
    ↓ (populate UI)
Popup displays cards & editing options
    ↓ (user clicks export)
Format cards for template
    ↓ (open Wordwall tab)
Inject data via sessionStorage
```

### Debugging

**Enable logging:**

- Open DevTools in the extension:
  - Go to `chrome://extensions/`
  - Find the extension, click **Details**
  - Click **Inspect views > background page**
- Open popup DevTools:
  - Right-click extension icon → Inspect popup
- Open content script DevTools:
  - On a Quizlet page, right-click → Inspect
  - Content script logs appear here

**Common Issues:**

1. **"No cards found" error**
   - Quizlet DOM structure may have changed
   - Check selectors in `src/services/quizletService.ts`
   - Run `document.querySelectorAll('[class*="FlashcardTerm"]')` in console

2. **Wordwall page doesn't get data**
   - Verify `chrome.storage.local` is properly set
   - Check browser console for storage errors
   - Data expires after 1 hour in background storage

3. **Build errors with Chrome API types**
   - Run `npm install` to ensure `@types/chrome` is installed
   - Make sure TypeScript version is compatible

### Adding a New Service (e.g., Google Classroom)

1. Create `src/services/classroomService.ts`:

   ```typescript
   export class ClassroomService implements IFlashcardService {
     isApplicable(): boolean {
       return window.location.hostname === "classroom.google.com";
     }

     getServiceId(): string {
       return "google-classroom";
     }

     async extractCards(): Promise<FlashcardSet> {
       // Parse Classroom cards
     }
   }
   ```

2. Update `src/content/content.ts` to use the service
3. Register in service factory if needed

### Adding a New Wordwall Template

1. Create class extending `IExportTemplate` in `src/services/wordwallTemplates.ts`
2. Implement `formatCards()` and `getMetadata()`
3. Register in `WordwallTemplateFactory`
4. The UI will automatically detect it

### Performance Tips

- Quizlet DOM extraction uses multiple selectors as fallback
- Consider memoizing extracted cards in background storage
- Popup re-extraction only happens on user action

### Security

- Extension doesn't store user credentials
- Data is stored locally in `chrome.storage.local`
- No external API calls except to Wordwall
- Content Security Policy allows React and React DOM

### Future Enhancements

- [ ] User authentication with Wordwall API
- [ ] Bulk export history
- [ ] Custom template builder
- [ ] Export to Google Classroom
- [ ] Anki deck support
- [ ] Image support in definitions
- [ ] Keyboard shortcuts
- [ ] Dark mode
- [ ] Internationalization
