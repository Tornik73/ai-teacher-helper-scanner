# Quizlet to Wordwall Extension

Chrome extension for exporting Quizlet flashcards to Wordwall interactive templates.

## Features

- 🎯 **Extract Quizlet Cards** - Automatically parse flashcards from Quizlet pages
- ✏️ **Edit Cards** - Add, remove, or modify cards before export
- 📊 **Multiple Templates** - Support for Quiz, Find the Match, and Match Up
- 🔄 **Two-way Sync** - Edit cards and see them update in real-time
- 🚀 **One-click Export** - Transfer to Wordwall with a single click

## Architecture

The extension is designed with extensibility in mind, allowing future support for other flashcard services (Google Classroom, Anki, etc.).

### Project Structure

```
src/
├── background/          # Service worker (message coordination)
├── content/             # Content scripts (page injection)
├── popup/               # React popup UI
├── services/
│   ├── quizletService.ts        # Quizlet card extraction
│   ├── wordwallTemplates.ts     # Template formatting
│   └── wordwallExporter.ts      # Wordwall integration
└── common/
    ├── types.ts         # TypeScript definitions
    └── interfaces.ts    # Extensibility interfaces
```

### Key Interfaces

- **`IFlashcardService`** - Abstract interface for flashcard providers (Quizlet, Classroom, etc.)
- **`IExportTemplate`** - Template formatter for different Wordwall types
- **`IDataStorage`** - Storage abstraction for future persistence

## Development

### Install Dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

### Development Mode (Watch)

```bash
npm run dev
```

### Type Checking

```bash
npm run type-check
```

## Loading the Extension

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `dist/` folder

## Supported Wordwall Templates

1. **Quiz** (Template ID: 5)
   - Multiple choice questions
   - One correct answer per question
   - Distractors from other cards

2. **Find the Match** (Template ID: 46)
   - Keyword-definition matching
   - Find pairs by clicking

3. **Match Up** (Template ID: 3)
   - Left column: Keywords
   - Right column: Shuffled definitions
   - Click to match pairs

## Future Enhancements

- [ ] Support for Google Classroom
- [ ] Anki deck integration
- [ ] Custom template creation
- [ ] Batch export management
- [ ] User account persistence
- [ ] Export history

## License

MIT
