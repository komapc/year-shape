# Internationalization (i18n)

YearWheel is being prepared for multi-language support.

## Supported Languages

### ✅ Complete Translations (8 languages):

1. 🇺🇸 **English** (en) - Complete (113 strings)
2. 🇮🇱 **Hebrew** (he) - Complete + RTL support (113 strings)
3. 🌐 **Esperanto** (eo) - Complete (113 strings)
4. 🏳️ **Toki Pona** (tok) - Complete (113 strings)
5. 🇵🇱 **Polish** (pl) - Complete (113 strings)
6. 🇺🇦 **Ukrainian** (uk) - Complete (113 strings)
7. 🇧🇾 **Belarusian** (be) - Complete (113 strings)
8. 🌐 **Ido** (io) - Complete (113 strings)

### 🚧 Placeholder Translations (4 languages):

- 🇷🇺 **Russian** (ru) - Using English placeholders
- 🇪🇸 **Spanish** (es) - Using English placeholders
- 🇫🇷 **French** (fr) - Using English placeholders
- 🇩🇪 **German** (de) - Using English placeholders

## Usage

```typescript
import { t, setLocale, getLocale } from './i18n';

// Get all translations for current locale
const translations = t();
console.log(translations.appTitle); // "YearWheel" or "גלגל השנה"

// Change locale
setLocale('he'); // Switch to Hebrew

// Get current locale
const currentLocale = getLocale(); // "he"
```

## Features

### Automatic Detection
- Loads saved locale from localStorage
- Falls back to browser language if available
- Defaults to English

### RTL Support
- Hebrew automatically enables RTL (right-to-left) layout
- Document `dir="rtl"` attribute set automatically

### Persistence
- Selected locale stored in localStorage
- Persists across page reloads

## Adding a New Language

1. Add locale code to `Locale` type in `src/i18n/index.ts`
2. Create complete `Translations` object for the language
3. Add to `translations` record
4. Test RTL support if needed

## Integration Status

🔄 **Partially Integrated**: Core infrastructure is now active!

### ✅ What Works:
1. ✅ Locale initialization on app start
2. ✅ Language selector in settings panel
3. ✅ Locale persistence in localStorage
4. ✅ HTML lang attribute updates
5. ✅ RTL support for Hebrew
6. ✅ Toast notifications use translations

### 🚧 Still TODO:
1. Replace hardcoded strings in HTML with dynamic updates
2. Update all UI text to use `t()` function
3. Implement real-time UI updates (currently requires page reload)
4. Test all languages thoroughly

### Current Behavior:
- Select language → Settings saved toast (in selected language)
- Page reloads → Lang attribute and RTL applied
- Most UI text still in English (hardcoded in HTML)

## Translation Keys

See `Translations` interface in `src/i18n/index.ts` for all available keys:
- Header (appTitle, buttons)
- Settings (all setting labels)
- Calendar Controls (buttons, labels)
- About section
- Legend
- Footer
- Modal
- Tooltips
- Messages
- Event Management (create, edit, delete events)

## Contributing Translations

To add or improve translations:

1. Edit `src/i18n/index.ts`
2. Find the language object (e.g., `const es: Translations`)
3. Replace English placeholders with proper translations
4. Ensure all keys are translated
5. Test RTL layout if applicable

## RTL Languages

Currently supported RTL languages:
- Hebrew (he)

To add more RTL languages:
- Update `setLocale()` function to detect RTL languages
- Set `document.documentElement.setAttribute('dir', 'rtl')`

