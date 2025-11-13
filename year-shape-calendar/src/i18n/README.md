# Internationalization (i18n)

YearWheel is being prepared for multi-language support.

## Supported Languages (Planned)

- 🇺🇸 **English** (en) - ✅ Complete
- 🇮🇱 **Hebrew** (he) - ✅ Complete (RTL support)
- 🇺🇦 **Ukrainian** (uk) - ✅ Complete
- 🌐 **Esperanto** (eo) - ✅ Complete
- 🏳️ **Toki Pona** (tok) - ✅ Complete (minimalist constructed language)
- 🇷🇺 **Russian** (ru) - 🚧 Planned
- 🇪🇸 **Spanish** (es) - 🚧 Planned
- 🇫🇷 **French** (fr) - 🚧 Planned
- 🇩🇪 **German** (de) - 🚧 Planned

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

🚧 **In Progress**: Infrastructure is ready, but not yet integrated into UI components.

### Next Steps:
1. Add language selector to settings panel
2. Replace hardcoded strings in HTML with translation keys
3. Update all components to use `t()` function
4. Add language switcher icon in header
5. Test all languages thoroughly

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

