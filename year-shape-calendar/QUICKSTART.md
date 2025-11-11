# ⚡ Quick Start Guide

Get YearWheel running in 60 seconds!

## 🚀 Three Commands

```bash
# 1. Navigate to project directory
cd year-shape-calendar

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open browser
# Visit: http://localhost:5173
```

That's it! The calendar should now be running. 🎉

---

## 🎮 Try These Features

1. **Morph the Shape**
   - Drag the "Corner Radius" slider
   - Watch it smoothly transition from circle to square

2. **Change Direction**
   - Click "CCW" button to toggle between clockwise/counter-clockwise

3. **Swap Seasons**
   - Click "Swap Seasons" to exchange Winter ↔ Summer

4. **View Week Details**
   - Click any week (blue dots have demo events)
   - See the Soviet-style 4+3 diary layout

5. **Refresh Events**
   - Click "⟳ Refresh" to generate new random demo events

---

## 📝 Optional: Google Calendar Setup

To sync with your actual Google Calendar:

1. Visit [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → Enable Calendar API
3. Create OAuth credentials
4. Edit `src/utils/constants.ts`:
   ```typescript
   export const GOOGLE_CALENDAR_CONFIG = {
     clientId: 'YOUR_CLIENT_ID',
     apiKey: 'YOUR_API_KEY',
     // ... rest stays the same
   };
   ```
5. Restart dev server
6. Click "Sign in with Google"

---

## 🏗️ Build for Production

```bash
npm run build
```

Output in `dist/` directory - ready to deploy!

---

## 🎨 Customize

### Change Colors
Edit `tailwind.config.js`:
```javascript
colors: {
  primary: {
    500: '#YOUR_COLOR', // Change this
  }
}
```

### Adjust Layout
Edit `src/utils/constants.ts`:
```typescript
export const CALENDAR_CONFIG = {
  totalWeeks: 52,     // Number of weeks
  startAngle: -90,    // Start position
  // ...
};
```

---

## 🐛 Troubleshooting

### Port already in use?
```bash
# Use a different port
npm run dev -- --port 3000
```

### TypeScript errors?
```bash
# Clean and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Build fails?
```bash
# Check TypeScript
npx tsc --noEmit
```

---

## 📚 Learn More

- Full documentation: `README.md`
- Refactor details: `REFACTOR_SUMMARY.md`
- Code structure: `src/` directory

---

## 💡 Tips

- Use **Chrome DevTools** to inspect week elements
- **Keyboard navigation**: Tab through controls, Enter to activate
- **Responsive**: Try resizing your browser window
- **Accessibility**: Works great with screen readers

---

**Enjoy your new calendar! 🎊**

Need help? Check the main README or open an issue.

