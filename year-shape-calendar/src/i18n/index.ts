/**
 * Internationalization (i18n) support
 * Prepares infrastructure for multi-language support
 */

export type Locale = 'en' | 'he' | 'ru' | 'es' | 'fr' | 'de' | 'eo' | 'uk' | 'tok';

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
  
  // Event Management
  createEvent: string;
  editEvent: string;
  deleteEvent: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventDescription: string;
  saveEvent: string;
  cancelEvent: string;
  confirmDelete: string;
  eventCreated: string;
  eventUpdated: string;
  eventDeleted: string;
  eventError: string;
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
  
  // Event Management
  createEvent: 'Create Event',
  editEvent: 'Edit Event',
  deleteEvent: 'Delete Event',
  eventTitle: 'Event Title',
  eventDate: 'Date',
  eventTime: 'Time',
  eventDescription: 'Description',
  saveEvent: 'Save Event',
  cancelEvent: 'Cancel',
  confirmDelete: 'Are you sure you want to delete this event?',
  eventCreated: 'Event created successfully',
  eventUpdated: 'Event updated successfully',
  eventDeleted: 'Event deleted successfully',
  eventError: 'Failed to save event. Please try again.',
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
  
  // Event Management
  createEvent: 'צור אירוע',
  editEvent: 'ערוך אירוע',
  deleteEvent: 'מחק אירוע',
  eventTitle: 'כותרת האירוע',
  eventDate: 'תאריך',
  eventTime: 'שעה',
  eventDescription: 'תיאור',
  saveEvent: 'שמור אירוע',
  cancelEvent: 'ביטול',
  confirmDelete: 'האם אתה בטוח שברצונך למחוק אירוע זה?',
  eventCreated: 'האירוע נוצר בהצלחה',
  eventUpdated: 'האירוע עודכן בהצלחה',
  eventDeleted: 'האירוע נמחק בהצלחה',
  eventError: 'שמירת האירוע נכשלה. אנא נסה שוב.',
};

// Placeholder translations (to be completed)
const ru: Translations = { ...en }; // Russian
const es: Translations = { ...en }; // Spanish
const fr: Translations = { ...en }; // French
const de: Translations = { ...en }; // German

// Esperanto translations
const eo: Translations = {
  // Header
  appTitle: 'YearWheel',
  settingsButton: 'Agordoj kaj Kontroloj',
  aboutButton: 'Pri',
  
  // Settings
  settingsTitle: 'Agordoj kaj Kontroloj',
  displaySection: 'Montrado',
  showMoonPhase: 'Montri lunfazon',
  showZodiac: 'Montri zodiakajn signojn',
  showHebrewMonth: 'Montri hebrean monaton',
  lightTheme: 'Hela temo',
  
  // Calendar Controls
  calendarSection: 'Kalendaro',
  timeFlow: 'Tempofluo',
  timeFlowCW: 'Dekstrume',
  timeFlowCCW: 'Maldekstrume',
  shiftSeasons: 'Ŝovi Sezonojn',
  refreshEvents: 'Aktualigi Eventojn',
  signInWithGoogle: 'Ensaluti per Google',
  
  // About
  aboutTitle: 'Pri',
  aboutDescription: 'Interaga kalendaro kiu bildigas la tutan jaron kiel ŝanĝiĝantan formon.',
  features: 'Funkcioj:',
  
  // Legend
  hasEvents: 'Havas eventojn',
  noEvents: 'Neniuj eventoj (sezona nuanco)',
  
  // Footer
  privacyPolicy: 'Privatecan Politikon',
  termsOfService: 'Kondiĉoj de Servo',
  
  // Modal
  week: 'Semajno',
  openInCalendar: 'Malfermi en Kalendaro',
  close: 'Fermi',
  
  // Tooltips
  hoverForDetails: 'Ŝvebu super semajnoj por vidi lunfazon kaj zodiakajn informojn',
  
  // Messages
  settingsSaved: 'Agordoj konservitaj',
  autoSaved: 'Agordoj estas aŭtomate konservitaj',
  
  // Event Management
  createEvent: 'Krei Eventon',
  editEvent: 'Redakti Eventon',
  deleteEvent: 'Forigi Eventon',
  eventTitle: 'Titolo de Evento',
  eventDate: 'Dato',
  eventTime: 'Horo',
  eventDescription: 'Priskribo',
  saveEvent: 'Konservi Eventon',
  cancelEvent: 'Nuligi',
  confirmDelete: 'Ĉu vi certas ke vi volas forigi ĉi tiun eventon?',
  eventCreated: 'Evento sukcese kreita',
  eventUpdated: 'Evento sukcese ĝisdatigita',
  eventDeleted: 'Evento sukcese forigita',
  eventError: 'Malsukcesis konservi eventon. Bonvolu provi denove.',
};

// Ukrainian translations
const uk: Translations = {
  // Header
  appTitle: 'Колесо Року',
  settingsButton: 'Налаштування та Керування',
  aboutButton: 'Про додаток',
  
  // Settings
  settingsTitle: 'Налаштування та Керування',
  displaySection: 'Відображення',
  showMoonPhase: 'Показати фазу місяця',
  showZodiac: 'Показати знаки зодіаку',
  showHebrewMonth: 'Показати єврейський місяць',
  lightTheme: 'Світла тема',
  
  // Calendar Controls
  calendarSection: 'Календар',
  timeFlow: 'Напрямок часу',
  timeFlowCW: 'За годинниковою',
  timeFlowCCW: 'Проти годинникової',
  shiftSeasons: 'Змістити Сезони',
  refreshEvents: 'Оновити Події',
  signInWithGoogle: 'Увійти через Google',
  
  // About
  aboutTitle: 'Про додаток',
  aboutDescription: 'Інтерактивний календар, який відображає весь рік у вигляді форми, що змінюється.',
  features: 'Можливості:',
  
  // Legend
  hasEvents: 'Є події',
  noEvents: 'Немає подій (сезонний відтінок)',
  
  // Footer
  privacyPolicy: 'Політика конфіденційності',
  termsOfService: 'Умови користування',
  
  // Modal
  week: 'Тиждень',
  openInCalendar: 'Відкрити в Календарі',
  close: 'Закрити',
  
  // Tooltips
  hoverForDetails: 'Наведіть курсор на тижні, щоб побачити фазу місяця та знак зодіаку',
  
  // Messages
  settingsSaved: 'Налаштування збережено',
  autoSaved: 'Налаштування зберігаються автоматично',
  
  // Event Management
  createEvent: 'Створити подію',
  editEvent: 'Редагувати подію',
  deleteEvent: 'Видалити подію',
  eventTitle: 'Назва події',
  eventDate: 'Дата',
  eventTime: 'Час',
  eventDescription: 'Опис',
  saveEvent: 'Зберегти подію',
  cancelEvent: 'Скасувати',
  confirmDelete: 'Ви впевнені, що хочете видалити цю подію?',
  eventCreated: 'Подію успішно створено',
  eventUpdated: 'Подію успішно оновлено',
  eventDeleted: 'Подію успішно видалено',
  eventError: 'Не вдалося зберегти подію. Спробуйте ще раз.',
};

// Toki Pona translations (minimalist constructed language)
const tok: Translations = {
  // Header
  appTitle: 'sike tenpo sike',
  settingsButton: 'nasin pali',
  aboutButton: 'sona',
  
  // Settings
  settingsTitle: 'nasin pali',
  displaySection: 'lukin',
  showMoonPhase: 'o lukin e mun',
  showZodiac: 'o lukin e sitelen sewi',
  showHebrewMonth: 'o lukin e tenpo Epelanto',
  lightTheme: 'kule walo',
  
  // Calendar Controls
  calendarSection: 'tenpo',
  timeFlow: 'tawa tenpo',
  timeFlowCW: 'tawa poka',
  timeFlowCCW: 'tawa monsi',
  shiftSeasons: 'ante e tenpo seli',
  refreshEvents: 'sin e lipu',
  signInWithGoogle: 'o kama lon kepeken Google',
  
  // About
  aboutTitle: 'sona',
  aboutDescription: 'ilo tenpo ni li pana e sona pi tenpo sike ale kepeken sitelen sike.',
  features: 'ijo pona:',
  
  // Legend
  hasEvents: 'lipu li lon',
  noEvents: 'lipu li lon ala',
  
  // Footer
  privacyPolicy: 'nasin len',
  termsOfService: 'nasin kepeken',
  
  // Modal
  week: 'esun',
  openInCalendar: 'o open lon ilo tenpo',
  close: 'o pini',
  
  // Tooltips
  hoverForDetails: 'o lukin e esun tan sona pi mun en sitelen sewi',
  
  // Messages
  settingsSaved: 'nasin li awen',
  autoSaved: 'nasin li awen lon tenpo ale',
  
  // Event Management
  createEvent: 'o pali e lipu sin',
  editEvent: 'o ante e lipu',
  deleteEvent: 'o weka e lipu',
  eventTitle: 'nimi lipu',
  eventDate: 'tenpo suno',
  eventTime: 'tenpo lili',
  eventDescription: 'toki sona',
  saveEvent: 'o awen e lipu',
  cancelEvent: 'o pini',
  confirmDelete: 'sina wile ala wile weka e lipu ni?',
  eventCreated: 'lipu sin li lon',
  eventUpdated: 'lipu li ante pona',
  eventDeleted: 'lipu li weka pona',
  eventError: 'lipu li ken ala awen. o sin.',
};

const translations: Record<Locale, Translations> = {
  en,
  he,
  ru,
  es,
  fr,
  de,
  eo,
  uk,
  tok,
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
    
    // Update HTML lang attribute
    document.documentElement.setAttribute('lang', locale);
    
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

