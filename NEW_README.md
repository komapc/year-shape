# 🗓️ Year Shape Calendar

A modern, interactive calendar visualization that represents the entire year as a morphing shape. Built with TypeScript, Vite, and TailwindCSS.

![Year Shape Calendar](https://img.shields.io/badge/TypeScript-5.3-blue)
![Vite](https://img.shields.io/badge/Vite-5.0-purple)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-cyan)

## ✨ Features

- **🔄 Morphing Shape** - Smoothly transition between circle and square by adjusting corner radius
- **📅 52 Weeks Layout** - All weeks arranged in 4 seasonal quadrants (Winter, Spring, Summer, Autumn)
- **🔁 Direction Control** - Toggle between clockwise and counter-clockwise time flow
- **🔀 Season Swapping** - Swap positions of Winter and Summer
- **📖 Soviet Diary View** - Click any week to see a detailed 4+3 day layout
- **📱 Responsive Design** - Works beautifully on desktop and mobile devices
- **♿ Accessible** - Full keyboard navigation and screen reader support
- **🔗 Google Calendar Integration** - Sync with your Google Calendar (optional)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

Visit `http://localhost:5173` to see the calendar in action!

## 📁 Project Structure

```
year-shape-calendar/
├── src/
│   ├── calendar/              # Calendar components
│   │   ├── CalendarApp.ts     # Main app controller
│   │   ├── CalendarRenderer.ts # Layout and rendering logic
│   │   ├── WeekElement.ts     # Individual week component
│   │   └── WeekModal.ts       # Weekly detail modal
│   ├── services/              # External services
│   │   └── googleCalendar.ts  # Google Calendar API integration
│   ├── types/                 # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/                 # Utility functions
│   │   ├── constants.ts       # App constants
│   │   ├── date.ts           # Date utilities
│   │   ├── dom.ts            # DOM utilities
│   │   └── math.ts           # Math utilities for positioning
│   ├── index.html            # HTML entry point
│   ├── main.ts               # TypeScript entry point
│   └── style.css             # TailwindCSS styles
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🔧 Configuration

### Google Calendar Integration (Optional)

To enable Google Calendar integration:

1. **Create a Google Cloud Project**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one

2. **Enable Google Calendar API**
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

3. **Create OAuth 2.0 Credentials**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application"
   - Add authorized JavaScript origins:
     - `http://localhost:5173` (for development)
     - Your production domain

4. **Configure the App**
   - Open `src/utils/constants.ts`
   - Add your credentials:

```typescript
export const GOOGLE_CALENDAR_CONFIG: GoogleCalendarConfig = {
  clientId: 'YOUR_CLIENT_ID_HERE',
  apiKey: 'YOUR_API_KEY_HERE',
  discoveryDoc: 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest',
  scopes: 'https://www.googleapis.com/auth/calendar.readonly',
};
```

5. **Test the Integration**
   - Restart the dev server
   - Click "Sign in with Google"
   - Authorize the app
   - Click "Refresh" to load your events

## 🎨 Customization

### Themes

Edit colors in `tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your custom colors
      },
    },
  },
},
```

### Calendar Layout

Adjust constants in `src/utils/constants.ts`:

```typescript
export const CALENDAR_CONFIG: CalendarConfig = {
  totalWeeks: 52,
  startAngle: -90,  // Start position (degrees)
  defaultSeasons: ['winter', 'spring', 'summer', 'autumn'],
};
```

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## 🧪 Development

### Code Style

This project follows functional programming patterns:

- Use `const` arrow functions instead of `function`
- Prefer immutability
- Descriptive variable names
- Proper TypeScript types

### Linting

```bash
npm run lint
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🙏 Acknowledgments

- Inspired by circular calendar designs and Soviet-style diaries
- Built with modern web technologies
- Google Calendar API for event synchronization

## 📮 Support

If you encounter any issues or have questions:

1. Check existing [Issues](../../issues)
2. Create a new issue with detailed description
3. Include browser version and steps to reproduce

---

**Made with ❤️ using TypeScript, Vite, and TailwindCSS**

