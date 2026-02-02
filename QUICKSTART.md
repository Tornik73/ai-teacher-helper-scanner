# Quick Start Guide

## 5-Minute Setup

### 1. Install & Build

```bash
cd /Users/yehorkotolevets/Documents/work/teacher-helper
npm install
npm run build
```

### 2. Load Extension

- Open `chrome://extensions/`
- Toggle **Developer mode** (top right)
- Click **Load unpacked**
- Select the `dist/` folder
- ✅ Extension is now active!

### 3. Test It

1. Open any Quizlet flashcard page (e.g., https://quizlet.com/ua/1130232323/work-flash-cards/)
2. Click the extension icon in your toolbar
3. You should see:
   - Number of detected cards
   - List of word/translation pairs
   - Editing options
   - Template selector
   - Export button

## What You Can Do

### Extract Cards

- Extension automatically detects cards on Quizlet pages
- Shows total count ("🎯 Detected Cards: X words")

### Edit Cards

- ✏️ Click pencil icon to edit any card
- 🗑️ Click trash icon to remove
- ➕ Add new cards manually

### Select Template

Choose how to export to Wordwall:

- **Quiz** - Multiple choice with one correct answer
- **Find the Match** - Click to match pairs
- **Match Up** - Left side: keywords, Right side: definitions

### Export to Wordwall

1. Select your template
2. Click **✨ Export X Cards to Wordwall**
3. A new Wordwall tab opens automatically
4. Cards are pre-populated (ready to save)

## Project Structure

```
teacher-helper/
├── src/
│   ├── manifest.json           # Extension config
│   ├── background/background.ts   # Message relay
│   ├── content/content.ts         # Quizlet injector
│   ├── popup/popup.tsx            # UI (React)
│   ├── services/
│   │   ├── quizletService.ts      # Extraction
│   │   ├── wordwallTemplates.ts   # Formats
│   │   └── wordwallExporter.ts    # Export
│   └── common/
│       ├── types.ts               # Interfaces
│       └── interfaces.ts          # Abstractions
├── dist/                          # Build output
├── package.json
├── tsconfig.json
├── webpack.config.js
├── README.md                      # User guide
├── DEVELOPMENT.md                 # Dev guide
└── ARCHITECTURE.md                # Design patterns
```

## Common Commands

```bash
# Build for production
npm run build

# Watch mode (rebuild on changes)
npm run dev

# Type check only (no build)
npm run type-check

# Run ESLint
npm run lint
```

## Troubleshooting

### Extension not showing cards

- Verify you're on a Quizlet set page (not a class)
- Check popup DevTools: Right-click extension icon → Inspect popup
- Open DevTools on Quizlet page to see content script logs

### Cards not exporting to Wordwall

- Check Wordwall page loads (might require accept/reject cookies first)
- Verify popup console for errors
- Try re-extracting cards with "🔄 Re-extract from Page" button

### Build errors

- Delete `dist/` folder and rebuild
- Run `npm install` to ensure all dependencies are present
- Check Node version (v16+ recommended)

## Next Steps

1. **Test with real Quizlet** - Try with multiple sets
2. **Customize UI** - Edit colors/styling in `src/popup/popup.tsx`
3. **Add new template** - Create new class in `wordwallTemplates.ts`
4. **Support new service** - Implement `IFlashcardService` for Google Classroom, etc.
5. **Deploy** - Package for Chrome Web Store (see Chrome extension docs)

## File Reference

| File                                | Purpose                                               |
| ----------------------------------- | ----------------------------------------------------- |
| `src/manifest.json`                 | Extension configuration (permissions, scripts, icons) |
| `src/background/background.ts`      | Service worker (message coordinator)                  |
| `src/content/content.ts`            | Injected on Quizlet pages (extracts cards)            |
| `src/popup/popup.tsx`               | User interface (React component)                      |
| `src/services/quizletService.ts`    | DOM parsing for Quizlet cards                         |
| `src/services/wordwallTemplates.ts` | Quiz/Match/MatchUp formatters                         |
| `src/services/wordwallExporter.ts`  | Wordwall tab opener & data injector                   |
| `src/common/types.ts`               | TypeScript type definitions                           |
| `src/common/interfaces.ts`          | Abstract interfaces for extensibility                 |

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────┐
│                    Chrome Browser                        │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Quizlet Page              Popup UI           Wordwall   │
│  ┌──────────────┐      ┌──────────────┐    ┌─────────┐  │
│  │ [Cards...]   │      │ Word Count   │    │ Create  │  │
│  │ [Cards...]   │  ←→  │ Edit Cards   │ →  │ Page    │  │
│  │ [Cards...]   │      │ Template Sel │    │ (data   │  │
│  └──────────────┘      │ Export Btn   │    │  pre-   │  │
│         ↓              └──────────────┘    │  filled)│  │
│   Content Script           Popup            └─────────┘  │
│   (extract cards)          (React UI)                    │
│         ↓                      ↓                          │
│    ┌────────────────────────────────┐                    │
│    │  Background Service Worker     │                    │
│    │  (message relay & storage)     │                    │
│    └────────────────────────────────┘                    │
│              chrome.storage.local                        │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Want to Extend?

### Add Google Classroom Support

1. Create `src/services/classroomService.ts`
2. Implement `IFlashcardService`
3. Update `src/content/content.ts` to detect Classroom pages
4. The rest works automatically!

### Add Anki Export

1. Create `src/services/ankiExporter.ts`
2. Implement `IExportTarget`
3. Update popup to show Anki template option
4. Implement Anki deck format in exporter

See `ARCHITECTURE.md` for detailed design patterns.

---

**Need help?** Check the logs in DevTools Inspector for the extension background page.
