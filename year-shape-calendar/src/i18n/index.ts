/**
 * Internationalization (i18n) support
 * Prepares infrastructure for multi-language support
 */

export type Locale = 'en' | 'he' | 'ru' | 'es' | 'fr' | 'de';

export interface Translations {
  // Header
  appTitle: string;
  settingsButton: string;
  aboutButton: string;
  
  // Settings
  settingsTitle: string;
  displaySection: string;
  showMoonPhase: string;
  showZodiac: string;
  showHebrewMonth: string;
  lightTheme: string;
  
  // Calendar Controls
  calendarSection: string;
  timeFlow: string;
  timeFlowCW: string;
  timeFlowCCW: string;
  shiftSeasons: string;
  refreshEvents: string;
  signInWithGoogle: string;
  
  // About
  aboutTitle: string;
  aboutDescription: string;
  features: string;
  
  // Legend
  hasEvents: string;
  noEvents: string;
  
  // Footer
  privacyPolicy: string;
  termsOfService: string;
  
  // Modal
  week: string;
  openInCalendar: string;
  close: string;
  
  // Tooltips
  hoverForDetails: string;
  
  // Messages
  settingsSaved: string;
  autoSaved: string;
}

const en: Translations = {
  // Header
  appTitle: 'YearWheel',
  settingsButton: 'Settings & Controls',
  aboutButton: 'About',
  
  // Settings
  settingsTitle: 'Settings & Controls',
  displaySection: 'Display',
  showMoonPhase: 'Show moon phase',
  showZodiac: 'Show zodiac signs',
  showHebrewMonth: 'Show Hebrew month',
  lightTheme: 'Light theme',
  
  // Calendar Controls
  calendarSection: 'Calendar',
  timeFlow: 'Time flow',
  timeFlowCW: 'CW',
  timeFlowCCW: 'CCW',
  shiftSeasons: 'Shift Seasons',
  refreshEvents: 'Refresh Events',
  signInWithGoogle: 'Sign in with Google',
  
  // About
  aboutTitle: 'About',
  aboutDescription: 'An interactive calendar that visualizes the entire year as a morphing shape.',
  features: 'Features:',
  
  // Legend
  hasEvents: 'Has events',
  noEvents: 'No events (seasonal tint)',
  
  // Footer
  privacyPolicy: 'Privacy Policy',
  termsOfService: 'Terms of Service',
  
  // Modal
  week: 'Week',
  openInCalendar: 'Open in Calendar',
  close: 'Close',
  
  // Tooltips
  hoverForDetails: 'Hover over weeks to see moon phase and zodiac info',
  
  // Messages
  settingsSaved: 'Settings saved',
  autoSaved: 'Settings are saved automatically',
};

const he: Translations = {
  // Header
  appTitle: 'גלגל השנה',
  settingsButton: 'הגדרות ובקרות',
  aboutButton: 'אודות',
  
  // Settings
  settingsTitle: 'הגדרות ובקרות',
  displaySection: 'תצוגה',
  showMoonPhase: 'הצג מצב ירח',
  showZodiac: 'הצג מזלות',
  showHebrewMonth: 'הצג חודש עברי',
  lightTheme: 'ערכת נושא בהירה',
  
  // Calendar Controls
  calendarSection: 'לוח שנה',
  timeFlow: 'כיוון הזמן',
  timeFlowCW: 'עם כיוון השעון',
  timeFlowCCW: 'נגד כיוון השעון',
  shiftSeasons: 'הזז עונות',
  refreshEvents: 'רענן אירועים',
  signInWithGoogle: 'התחבר עם Google',
  
  // About
  aboutTitle: 'אודות',
  aboutDescription: 'לוח שנה אינטראקטיבי המציג את כל השנה כצורה משתנה.',
  features: 'תכונות:',
  
  // Legend
  hasEvents: 'יש אירועים',
  noEvents: 'אין אירועים (גוון עונתי)',
  
  // Footer
  privacyPolicy: 'מדיניות פרטיות',
  termsOfService: 'תנאי שימוש',
  
  // Modal
  week: 'שבוע',
  openInCalendar: 'פתח בלוח שנה',
  close: 'סגור',
  
  // Tooltips
  hoverForDetails: 'רחף מעל שבועות לראות מצב ירח ומזלות',
  
  // Messages
  settingsSaved: 'ההגדרות נשמרו',
  autoSaved: 'ההגדרות נשמרות אוטומטית',
};

// Placeholder translations (to be completed)
const ru: Translations = { ...en }; // Russian
const es: Translations = { ...en }; // Spanish
const fr: Translations = { ...en }; // French
const de: Translations = { ...en }; // German

const translations: Record<Locale, Translations> = {
  en,
  he,
  ru,
  es,
  fr,
  de,
};

/**
 * Current locale (default: English)
 */
let currentLocale: Locale = 'en';

/**
 * Get current locale
 */
export const getLocale = (): Locale => {
  return currentLocale;
};

/**
 * Set locale
 */
export const setLocale = (locale: Locale): void => {
  if (translations[locale]) {
    currentLocale = locale;
    // Store in localStorage for persistence
    localStorage.setItem('yearwheel_locale', locale);
    
    // Apply RTL for Hebrew
    if (locale === 'he') {
      document.documentElement.setAttribute('dir', 'rtl');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
    }
  }
};

/**
 * Initialize locale from localStorage or browser language
 */
export const initializeLocale = (): void => {
  // Try to load from localStorage
  const stored = localStorage.getItem('yearwheel_locale') as Locale;
  if (stored && translations[stored]) {
    setLocale(stored);
    return;
  }
  
  // Detect from browser
  const browserLang = navigator.language.split('-')[0] as Locale;
  if (translations[browserLang]) {
    setLocale(browserLang);
  }
};

/**
 * Get translation for current locale
 */
export const t = (): Translations => {
  return translations[currentLocale];
};

/**
 * Get specific translation key
 */
export const translate = (key: keyof Translations): string => {
  return translations[currentLocale][key];
};

