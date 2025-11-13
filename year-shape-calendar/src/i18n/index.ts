/**
 * Internationalization (i18n) support
 * Prepares infrastructure for multi-language support
 */

export type Locale = 'en' | 'he' | 'ru' | 'es' | 'fr' | 'de' | 'eo' | 'uk' | 'tok' | 'pl' | 'be' | 'io';

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
  shapeSection: string;
  cornerRadius: string;
  themeLabel: string;
  themeAuto: string;
  themeLight: string;
  themeDark: string;
  language: string;
  userAgreement: string;
  closeSettings: string;
  
  // Calendar Controls
  calendarSection: string;
  timeFlow: string;
  timeFlowCW: string;
  timeFlowCCW: string;
  shiftSeasons: string;
  refreshEvents: string;
  signInWithGoogle: string;
  signOut: string;
  
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
  
  // Months
  january: string;
  february: string;
  march: string;
  april: string;
  may: string;
  june: string;
  july: string;
  august: string;
  september: string;
  october: string;
  november: string;
  december: string;
  
  // Days of week
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  
  // Seasons
  winter: string;
  spring: string;
  summer: string;
  autumn: string;
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
  shapeSection: 'Shape',
  cornerRadius: 'Corner Radius',
  themeLabel: 'Theme',
  themeAuto: 'Auto',
  themeLight: 'Light',
  themeDark: 'Dark',
  language: 'Language',
  userAgreement: 'User Agreement',
  closeSettings: 'Close settings',
  
  // Calendar Controls
  calendarSection: 'Calendar',
  timeFlow: 'Time flow',
  timeFlowCW: 'CW',
  timeFlowCCW: 'CCW',
  shiftSeasons: 'Shift Seasons',
  refreshEvents: 'Refresh Events',
  signInWithGoogle: 'Sign in with Google',
  signOut: 'Sign out',
  
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
  
  // Months
  january: 'January',
  february: 'February',
  march: 'March',
  april: 'April',
  may: 'May',
  june: 'June',
  july: 'July',
  august: 'August',
  september: 'September',
  october: 'October',
  november: 'November',
  december: 'December',
  
  // Days of week
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
  
  // Seasons
  winter: 'Winter',
  spring: 'Spring',
  summer: 'Summer',
  autumn: 'Autumn',
};

const he: Translations = {
  // Header
  appTitle: 'גלגל השנה',
  settingsButton: 'הגדרות',
  aboutButton: 'אודות',
  
  // Settings
  settingsTitle: 'הגדרות',
  displaySection: 'תצוגה',
  showMoonPhase: 'ירח',
  showZodiac: 'מזלות',
  showHebrewMonth: 'חודש עברי',
  lightTheme: 'בהיר',
  shapeSection: 'צורה',
  cornerRadius: 'עיגול פינות',
  themeLabel: 'נושא',
  themeAuto: 'אוטומטי',
  themeLight: 'בהיר',
  themeDark: 'כהה',
  language: 'שפה',
  userAgreement: 'הסכם',
  closeSettings: 'סגור',
  
  // Calendar Controls
  calendarSection: 'לוח שנה',
  timeFlow: 'כיוון זמן',
  timeFlowCW: 'עם השעון',
  timeFlowCCW: 'נגד השעון',
  shiftSeasons: 'הזז עונות',
  refreshEvents: 'רענן',
  signInWithGoogle: 'התחבר',
  signOut: 'התנתק',
  
  // About
  aboutTitle: 'אודות',
  aboutDescription: 'לוח שנה אינטראקטיבי שמציג את השנה בצורה משתנה',
  features: 'תכונות:',
  
  // Legend
  hasEvents: 'יש אירועים',
  noEvents: 'אין אירועים',
  
  // Footer
  privacyPolicy: 'פרטיות',
  termsOfService: 'תנאי שימוש',
  
  // Modal
  week: 'שבוע',
  openInCalendar: 'פתח ביומן',
  close: 'סגור',
  
  // Tooltips
  hoverForDetails: 'העבר עכבר על שבועות לפרטים',
  
  // Messages
  settingsSaved: 'נשמר',
  autoSaved: 'שמירה אוטומטית',
  
  // Event Management
  createEvent: 'צור אירוע',
  editEvent: 'ערוך',
  deleteEvent: 'מחק',
  eventTitle: 'כותרת',
  eventDate: 'תאריך',
  eventTime: 'שעה',
  eventDescription: 'תיאור',
  saveEvent: 'שמור',
  cancelEvent: 'בטל',
  confirmDelete: 'למחוק את האירוע?',
  eventCreated: 'נוצר בהצלחה',
  eventUpdated: 'עודכן בהצלחה',
  eventDeleted: 'נמחק בהצלחה',
  eventError: 'השמירה נכשלה',
  
  // Months
  january: 'ינואר',
  february: 'פברואר',
  march: 'מרץ',
  april: 'אפריל',
  may: 'מאי',
  june: 'יוני',
  july: 'יולי',
  august: 'אוגוסט',
  september: 'ספטמבר',
  october: 'אוקטובר',
  november: 'נובמבר',
  december: 'דצמבר',
  
  // Days of week
  monday: 'שני',
  tuesday: 'שלישי',
  wednesday: 'רביעי',
  thursday: 'חמישי',
  friday: 'שישי',
  saturday: 'שבת',
  sunday: 'ראשון',
  
  // Seasons
  winter: 'חורף',
  spring: 'אביב',
  summer: 'קיץ',
  autumn: 'סתיו',
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
  shapeSection: 'Formo',
  cornerRadius: 'Angula Radiuso',
  themeLabel: 'Temo',
  themeAuto: 'Aŭtomata',
  themeLight: 'Hela',
  themeDark: 'Malhela',
  language: 'Lingvo',
  userAgreement: 'Uzanto-Interkonsento',
  closeSettings: 'Fermi agordojn',
  
  // Calendar Controls
  calendarSection: 'Kalendaro',
  timeFlow: 'Tempofluo',
  timeFlowCW: 'Dekstrume',
  timeFlowCCW: 'Maldekstrume',
  shiftSeasons: 'Ŝovi Sezonojn',
  refreshEvents: 'Aktualigi Eventojn',
  signInWithGoogle: 'Ensaluti per Google',
  signOut: 'Elsaluti',
  
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
  
  // Months
  january: 'Januaro',
  february: 'Februaro',
  march: 'Marto',
  april: 'Aprilo',
  may: 'Majo',
  june: 'Junio',
  july: 'Julio',
  august: 'Aŭgusto',
  september: 'Septembro',
  october: 'Oktobro',
  november: 'Novembro',
  december: 'Decembro',
  
  // Days of week
  monday: 'Lundo',
  tuesday: 'Mardo',
  wednesday: 'Merkredo',
  thursday: 'Ĵaŭdo',
  friday: 'Vendredo',
  saturday: 'Sabato',
  sunday: 'Dimanĉo',
  
  // Seasons
  winter: 'Vintro',
  spring: 'Printempo',
  summer: 'Somero',
  autumn: 'Aŭtuno',
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
  shapeSection: 'Форма',
  cornerRadius: 'Радіус кутів',
  themeLabel: 'Тема',
  themeAuto: 'Авто',
  themeLight: 'Світла',
  themeDark: 'Темна',
  language: 'Мова',
  userAgreement: 'Угода користувача',
  closeSettings: 'Закрити налаштування',
  
  // Calendar Controls
  calendarSection: 'Календар',
  timeFlow: 'Напрямок часу',
  timeFlowCW: 'За годинниковою',
  timeFlowCCW: 'Проти годинникової',
  shiftSeasons: 'Змістити Сезони',
  refreshEvents: 'Оновити Події',
  signInWithGoogle: 'Увійти через Google',
  signOut: 'Вийти',
  
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
  
  // Months
  january: 'Січень',
  february: 'Лютий',
  march: 'Березень',
  april: 'Квітень',
  may: 'Травень',
  june: 'Червень',
  july: 'Липень',
  august: 'Серпень',
  september: 'Вересень',
  october: 'Жовтень',
  november: 'Листопад',
  december: 'Грудень',
  
  // Days of week
  monday: 'Понеділок',
  tuesday: 'Вівторок',
  wednesday: 'Середа',
  thursday: 'Четвер',
  friday: 'П\'ятниця',
  saturday: 'Субота',
  sunday: 'Неділя',
  
  // Seasons
  winter: 'Зима',
  spring: 'Весна',
  summer: 'Літо',
  autumn: 'Осінь',
};

// Toki Pona translations (minimalist constructed language)
const tok: Translations = {
  // Header
  appTitle: 'sike tenpo sike',
  settingsButton: 'nasin pali',
  aboutButton: 'mi li seme?',
  
  // Settings
  settingsTitle: 'nasin pali',
  displaySection: 'lukin',
  showMoonPhase: 'o lukin e mun',
  showZodiac: 'o lukin e sitelen sewi',
  showHebrewMonth: 'o lukin e tenpo mun Iwisi',
  lightTheme: 'kule walo',
  shapeSection: 'sitelen',
  cornerRadius: 'sike lili',
  themeLabel: 'kule',
  themeAuto: 'awen',
  themeLight: 'walo',
  themeDark: 'pimeja',
  language: 'toki',
  userAgreement: 'nasin mi',
  closeSettings: 'o pini e nasin',
  
  // Calendar Controls
  calendarSection: 'tenpo',
  timeFlow: 'tawa tenpo',
  timeFlowCW: 'tawa poka',
  timeFlowCCW: 'tawa monsi',
  shiftSeasons: 'ante e tenpo seli',
  refreshEvents: 'sin e lipu',
  signInWithGoogle: 'o kepeken Google',
  signOut: 'o weka lon',
  
  // About
  aboutTitle: 'mi li seme?',
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
  
  // Months (using numbers in Toki Pona style with mun for month)
  january: 'tenpo mun nanpa wan',
  february: 'tenpo mun nanpa tu',
  march: 'tenpo mun nanpa tu wan',
  april: 'tenpo mun nanpa tu tu',
  may: 'tenpo mun nanpa luka',
  june: 'tenpo mun nanpa luka wan',
  july: 'tenpo mun nanpa luka tu',
  august: 'tenpo mun nanpa luka tu wan',
  september: 'tenpo mun nanpa luka tu tu',
  october: 'tenpo mun nanpa luka luka',
  november: 'tenpo mun nanpa luka luka wan',
  december: 'tenpo mun nanpa luka luka tu',
  
  // Days of week
  monday: 'suno nanpa wan',
  tuesday: 'suno nanpa tu',
  wednesday: 'suno nanpa tu wan',
  thursday: 'suno nanpa tu tu',
  friday: 'suno nanpa luka',
  saturday: 'suno nanpa luka wan',
  sunday: 'suno nanpa luka tu',
  
  // Seasons
  winter: 'tenpo lete',
  spring: 'tenpo kasi',
  summer: 'tenpo seli',
  autumn: 'tenpo pi kule jelo',
};

// Polish translations
const pl: Translations = {
  // Header
  appTitle: 'KołoRoku',
  settingsButton: 'Ustawienia i sterowanie',
  aboutButton: 'O programie',
  
  // Settings
  settingsTitle: 'Ustawienia i sterowanie',
  displaySection: 'Wyświetlanie',
  showMoonPhase: 'Pokaż fazę księżyca',
  showZodiac: 'Pokaż znaki zodiaku',
  showHebrewMonth: 'Pokaż miesiąc hebrajski',
  lightTheme: 'Jasny motyw',
  shapeSection: 'Kształt',
  cornerRadius: 'Promień narożnika',
  themeLabel: 'Motyw',
  themeAuto: 'Auto',
  themeLight: 'Jasny',
  themeDark: 'Ciemny',
  language: 'Język',
  userAgreement: 'Umowa użytkownika',
  closeSettings: 'Zamknij ustawienia',
  
  // Calendar Controls
  calendarSection: 'Kalendarz',
  timeFlow: 'Przepływ czasu',
  timeFlowCW: 'Zgodnie',
  timeFlowCCW: 'Przeciwnie',
  shiftSeasons: 'Przesuń pory roku',
  refreshEvents: 'Odśwież wydarzenia',
  signInWithGoogle: 'Zaloguj się przez Google',
  signOut: 'Wyloguj się',
  
  // About
  aboutTitle: 'O programie',
  aboutDescription: 'Interaktywny kalendarz wizualizujący cały rok jako zmieniającą się formę.',
  features: 'Funkcje:',
  
  // Legend
  hasEvents: 'Ma wydarzenia',
  noEvents: 'Brak wydarzeń (sezonowy odcień)',
  
  // Footer
  privacyPolicy: 'Polityka prywatności',
  termsOfService: 'Warunki korzystania',
  
  // Modal
  week: 'Tydzień',
  openInCalendar: 'Otwórz w kalendarzu',
  close: 'Zamknij',
  
  // Tooltips
  hoverForDetails: 'Najedź na tygodnie aby zobaczyć fazę księżyca i znaki zodiaku',
  
  // Messages
  settingsSaved: 'Ustawienia zapisane',
  autoSaved: 'Ustawienia są zapisywane automatycznie',
  
  // Event Management
  createEvent: 'Utwórz wydarzenie',
  editEvent: 'Edytuj wydarzenie',
  deleteEvent: 'Usuń wydarzenie',
  eventTitle: 'Tytuł wydarzenia',
  eventDate: 'Data',
  eventTime: 'Czas',
  eventDescription: 'Opis',
  saveEvent: 'Zapisz wydarzenie',
  cancelEvent: 'Anuluj',
  confirmDelete: 'Czy na pewno chcesz usunąć to wydarzenie?',
  eventCreated: 'Wydarzenie utworzone pomyślnie',
  eventUpdated: 'Wydarzenie zaktualizowane pomyślnie',
  eventDeleted: 'Wydarzenie usunięte pomyślnie',
  eventError: 'Nie udało się zapisać wydarzenia. Spróbuj ponownie.',
  
  // Months
  january: 'Styczeń',
  february: 'Luty',
  march: 'Marzec',
  april: 'Kwiecień',
  may: 'Maj',
  june: 'Czerwiec',
  july: 'Lipiec',
  august: 'Sierpień',
  september: 'Wrzesień',
  october: 'Październik',
  november: 'Listopad',
  december: 'Grudzień',
  
  // Days of week
  monday: 'Poniedziałek',
  tuesday: 'Wtorek',
  wednesday: 'Środa',
  thursday: 'Czwartek',
  friday: 'Piątek',
  saturday: 'Sobota',
  sunday: 'Niedziela',
  
  // Seasons
  winter: 'Zima',
  spring: 'Wiosna',
  summer: 'Lato',
  autumn: 'Jesień',
};

// Belarusian translations
const be: Translations = {
  // Header
  appTitle: 'КолаГода',
  settingsButton: 'Налады і кіраванне',
  aboutButton: 'Пра праграму',
  
  // Settings
  settingsTitle: 'Налады і кіраванне',
  displaySection: 'Адлюстраванне',
  showMoonPhase: 'Паказаць фазу месяца',
  showZodiac: 'Паказаць знакі зодыяка',
  showHebrewMonth: 'Паказаць яўрэйскі месяц',
  lightTheme: 'Светлая тэма',
  shapeSection: 'Форма',
  cornerRadius: 'Радыус кутоў',
  themeLabel: 'Тэма',
  themeAuto: 'Аўта',
  themeLight: 'Светлая',
  themeDark: 'Цёмная',
  language: 'Мова',
  userAgreement: 'Карыстальніцкая дамова',
  closeSettings: 'Зачыніць налады',
  
  // Calendar Controls
  calendarSection: 'Каляндар',
  timeFlow: 'Плынь часу',
  timeFlowCW: 'Па гадзіннікавай',
  timeFlowCCW: 'Супраць гадзіннікавай',
  shiftSeasons: 'Зрушыць поры года',
  refreshEvents: 'Абнавіць падзеі',
  signInWithGoogle: 'Увайсці праз Google',
  signOut: 'Выйсці',
  
  // About
  aboutTitle: 'Пра праграму',
  aboutDescription: 'Інтэрактыўны каляндар, які візуалізуе ўвесь год як змяняльную форму.',
  features: 'Функцыі:',
  
  // Legend
  hasEvents: 'Ёсць падзеі',
  noEvents: 'Няма падзей (сезонны адценне)',
  
  // Footer
  privacyPolicy: 'Палітыка прыватнасці',
  termsOfService: 'Умовы карыстання',
  
  // Modal
  week: 'Тыдзень',
  openInCalendar: 'Адкрыць у календары',
  close: 'Зачыніць',
  
  // Tooltips
  hoverForDetails: 'Навядзіце курсор на тыдні, каб убачыць фазу месяца і знакі зодыяка',
  
  // Messages
  settingsSaved: 'Налады захаваны',
  autoSaved: 'Налады захоўваюцца аўтаматычна',
  
  // Event Management
  createEvent: 'Стварыць падзею',
  editEvent: 'Рэдагаваць падзею',
  deleteEvent: 'Выдаліць падзею',
  eventTitle: 'Назва падзеі',
  eventDate: 'Дата',
  eventTime: 'Час',
  eventDescription: 'Апісанне',
  saveEvent: 'Захаваць падзею',
  cancelEvent: 'Адмяніць',
  confirmDelete: 'Вы ўпэўнены, што хочаце выдаліць гэтую падзею?',
  eventCreated: 'Падзея паспяхова створана',
  eventUpdated: 'Падзея паспяхова абноўлена',
  eventDeleted: 'Падзея паспяхова выдалена',
  eventError: 'Не атрымалася захаваць падзею. Паспрабуйце яшчэ раз.',
  
  // Months
  january: 'Студзень',
  february: 'Люты',
  march: 'Сакавік',
  april: 'Красавік',
  may: 'Май',
  june: 'Чэрвень',
  july: 'Ліпень',
  august: 'Жнівень',
  september: 'Верасень',
  october: 'Кастрычнік',
  november: 'Лістапад',
  december: 'Снежань',
  
  // Days of week
  monday: 'Панядзелак',
  tuesday: 'Аўторак',
  wednesday: 'Серада',
  thursday: 'Чацвер',
  friday: 'Пятніца',
  saturday: 'Субота',
  sunday: 'Нядзеля',
  
  // Seasons
  winter: 'Зіма',
  spring: 'Вясна',
  summer: 'Лета',
  autumn: 'Восень',
};

// Ido translations
const io: Translations = {
  // Header
  appTitle: 'YearWheel',
  settingsButton: 'Ajusti e Kontroli',
  aboutButton: 'Pri',
  
  // Settings
  settingsTitle: 'Ajusti e Kontroli',
  displaySection: 'Montrado',
  showMoonPhase: 'Montrar lunofazo',
  showZodiac: 'Montrar zodiakala signi',
  showHebrewMonth: 'Montrar Hebrea monato',
  lightTheme: 'Klara temo',
  shapeSection: 'Formo',
  cornerRadius: 'Angula Radiuso',
  themeLabel: 'Temo',
  themeAuto: 'Automatala',
  themeLight: 'Klara',
  themeDark: 'Obskura',
  language: 'Linguo',
  userAgreement: 'Uzanto-Acordo',
  closeSettings: 'Klozar ajusti',
  
  // Calendar Controls
  calendarSection: 'Kalendario',
  timeFlow: 'Tempofluo',
  timeFlowCW: 'Dextre',
  timeFlowCCW: 'Sinistrere',
  shiftSeasons: 'Chanjar Sezoni',
  refreshEvents: 'Refreskar Eventi',
  signInWithGoogle: 'Enirar per Google',
  signOut: 'Ekirar',
  
  // About
  aboutTitle: 'Pri',
  aboutDescription: 'Interagiva kalendario qui vizualigas la tota yaro kom transformanta formo.',
  features: 'Funcioni:',
  
  // Legend
  hasEvents: 'Havas eventi',
  noEvents: 'Nula eventi (sezonala nuanco)',
  
  // Footer
  privacyPolicy: 'Privateso Politiko',
  termsOfService: 'Kondici di Servo',
  
  // Modal
  week: 'Semano',
  openInCalendar: 'Apertez en Kalendario',
  close: 'Klozez',
  
  // Tooltips
  hoverForDetails: 'Survolar semani por vidar lunofazo e zodiakala info',
  
  // Messages
  settingsSaved: 'Ajusti konservita',
  autoSaved: 'Ajusti esas automatale konservita',
  
  // Event Management
  createEvent: 'Krear Evento',
  editEvent: 'Redaktar Evento',
  deleteEvent: 'Efacar Evento',
  eventTitle: 'Titulo di Evento',
  eventDate: 'Dato',
  eventTime: 'Horo',
  eventDescription: 'Deskripto',
  saveEvent: 'Konservar Evento',
  cancelEvent: 'Nuligar',
  confirmDelete: 'Ka vu esas certa ke vu volas efacar ca evento?',
  eventCreated: 'Evento sucesoza kreita',
  eventUpdated: 'Evento sucesoza aktualigita',
  eventDeleted: 'Evento sucesoza efacita',
  eventError: 'Ne sucesis konservar evento. Voluntez probar itere.',
  
  // Months
  january: 'Januaro',
  february: 'Februaro',
  march: 'Marto',
  april: 'Aprilo',
  may: 'Mayo',
  june: 'Junio',
  july: 'Julio',
  august: 'Agosto',
  september: 'Septembro',
  october: 'Oktobro',
  november: 'Novembro',
  december: 'Decembro',
  
  // Days of week
  monday: 'Lundio',
  tuesday: 'Mardio',
  wednesday: 'Merkurdio',
  thursday: 'Jovdio',
  friday: 'Venerdio',
  saturday: 'Saturdio',
  sunday: 'Sundio',
  
  // Seasons
  winter: 'Vintro',
  spring: 'Printempo',
  summer: 'Somero',
  autumn: 'Autuno',
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
  pl,
  be,
  io,
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

