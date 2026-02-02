# Quick Links & Navigation

## 🚀 Getting Started (Pick One)

**First time?** → [QUICKSTART.md](QUICKSTART.md) (5 minutes)

**Want overview?** → [README.md](README.md)

**Need to debug?** → [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## 📚 Documentation

### For Users
- [README.md](README.md) - Features and how to use
- [QUICKSTART.md](QUICKSTART.md) - Setup and testing

### For Developers
- [DEVELOPMENT.md](DEVELOPMENT.md) - Development guide
- [ARCHITECTURE.md](ARCHITECTURE.md) - Design patterns
- [MANIFEST_GUIDE.md](MANIFEST_GUIDE.md) - Manifest explained

### For Reference
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Complete overview
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [FILE_REFERENCE.md](FILE_REFERENCE.md) - File organization
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues

---

## 🛠️ Commands

```bash
# Install dependencies
npm install

# Development (watch mode)
npm run dev

# Build for production
npm run build

# Check types
npm run type-check

# Lint code
npm run lint
```

---

## 📂 Key Folders

| Folder | Contains | Purpose |
|--------|----------|---------|
| `src/` | Source TypeScript/React code | **EDIT THIS** |
| `dist/` | Built JavaScript & assets | Load this in Chrome |
| `public/` | Icons and static assets | Extension assets |
| `node_modules/` | npm dependencies | Auto-generated |

---

## 📄 Key Files to Edit

### For UI Changes
→ [src/popup/popup.tsx](src/popup/popup.tsx)

### For Quizlet Extraction
→ [src/services/quizletService.ts](src/services/quizletService.ts)

### For Template Formats
→ [src/services/wordwallTemplates.ts](src/services/wordwallTemplates.ts)

### For Export Logic
→ [src/services/wordwallExporter.ts](src/services/wordwallExporter.ts)

### For Type Definitions
→ [src/common/types.ts](src/common/types.ts)

---

## ⚡ Common Tasks

### Add new Wordwall template
1. Edit [src/services/wordwallTemplates.ts](src/services/wordwallTemplates.ts)
2. Implement `IExportTemplate` interface
3. Register in factory
4. Run `npm run build`
5. Reload extension

### Support new service (e.g., Google Classroom)
1. Create `src/services/classroomService.ts`
2. Implement `IFlashcardService`
3. Update host_permissions in [src/manifest.json](src/manifest.json)
4. Update [src/content/content.ts](src/content/content.ts) to detect service
5. Run `npm run build`

### Fix Quizlet DOM extraction
1. Test selectors in browser console on Quizlet page
2. Update selectors in [src/services/quizletService.ts](src/services/quizletService.ts)
3. Add fallback selectors if needed
4. Run `npm run build`
5. Test with multiple Quizlet sets

### Change popup UI styling
1. Edit CSS in [src/popup/popup.tsx](src/popup/popup.tsx) (in `<style>` tag)
2. Run `npm run build`
3. Reload extension

---

## 🔍 Debugging

### See what's happening:
1. **Background worker**: `chrome://extensions/` → Inspect views > background page
2. **Popup UI**: Right-click extension → Inspect popup
3. **Quizlet page**: Right-click → Inspect (console)

### Common debug commands:
```javascript
// Test DOM extraction (in Quizlet console)
document.querySelectorAll('[class*="term"]').length

// Check extension data (in any DevTools)
chrome.storage.local.get(null, console.log)

// View all stored data
chrome.storage.local.get(null, (items) => console.table(items))
```

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────┐
│       Chrome Extension              │
├─────────────────────────────────────┤
│                                     │
│  User clicks extension icon         │
│           ↓                         │
│  src/popup/popup.tsx renders        │
│           ↓                         │
│  Sends message to background        │
│           ↓                         │
│  src/background/background.ts       │
│           ↓                         │
│  Forwards to content script         │
│           ↓                         │
│  src/content/content.ts runs        │
│           ↓                         │
│  Uses src/services/quizletService   │
│           ↓                         │
│  Extracts cards from page           │
│           ↓                         │
│  Returns to popup                   │
│           ↓                         │
│  User edits and exports             │
│           ↓                         │
│  src/services/wordwallExporter      │
│           ↓                         │
│  Opens Wordwall with data           │
│                                     │
└─────────────────────────────────────┘
```

---

## ✅ Checklist

- [ ] Installed `npm install`
- [ ] Built project `npm run build`
- [ ] Loaded extension from `dist/` folder
- [ ] Tested on Quizlet page
- [ ] Read relevant documentation
- [ ] Understand extension flow
- [ ] Ready to modify code

---

## 🎯 Next Steps

1. **Setup**: Follow [QUICKSTART.md](QUICKSTART.md)
2. **Test**: Try extracting from Quizlet
3. **Explore**: Browse source code in `src/`
4. **Modify**: Make your first change
5. **Build**: `npm run build`
6. **Reload**: Extension in Chrome
7. **Debug**: Check console for issues

---

## 📞 Need Help?

- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- Read [DEVELOPMENT.md](DEVELOPMENT.md) debugging section
- Review code comments in relevant files
- Check browser DevTools console

---

**Version**: 0.1.0  
**Last Updated**: February 2, 2026  
**Status**: ✅ Ready
