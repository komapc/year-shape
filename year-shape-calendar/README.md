# YearWheel

An interactive calendar visualization that morphs between circular and square shapes, representing the entire year in a unique way.

## Environments

- **Production:** https://komapc.github.io/year-shape/
- **Staging:** https://komapc.github.io/year-shape-staging/

## Features

- 🔄 Morphing shape (circle ↔ square with smooth transitions)
- 📅 52-week year visualization
- 🌍 Seasonal organization (Winter, Spring, Summer, Autumn)
- 📊 Google Calendar integration (OAuth 2.0)
- 🌙 Moon phases and zodiac signs on hover
- 🌐 Multi-language support (7 languages)
- 🎨 Light/Dark theme
- 📱 Fully responsive design
- ✡️ Hebrew calendar integration

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:5173

## Development Workflow

### Normal Feature Development

```bash
# Start from staging
git checkout staging
git pull

# Create feature branch
git checkout -b feature/my-feature

# Develop and test locally
npm run dev

# Commit and create PR to staging
git push -u origin feature/my-feature
gh pr create --base staging --title "Feature: My Feature"

# After merge, test on staging:
# https://komapc.github.io/year-shape-staging/
```

### Production Release

```bash
# When staging is stable, promote to production
git checkout staging
gh pr create --base main --title "Release: v0.5.2"

# After merge, live at:
# https://komapc.github.io/year-shape/
```

## Build Commands

```bash
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Run tests (watch mode)
npm run test:run     # Run tests (single run)
npm run test:ui      # Visual test UI
```

## Google Calendar Integration

YearWheel integrates with Google Calendar API. Setup:

1. **Create OAuth 2.0 Client ID** at [Google Cloud Console](https://console.cloud.google.com/)
2. **Create API Key** for Calendar API
3. **Add to environment:**
   - Create `.env.local` file
   - Add `VITE_GOOGLE_CLIENT_ID=your_client_id`
   - Add `VITE_GOOGLE_API_KEY=your_api_key`
4. **Configure OAuth:**
   - Add authorized JavaScript origins
   - Add test users to OAuth consent screen

See [QUICKSTART.md](./QUICKSTART.md) for detailed setup instructions.

## Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - Get running in 60 seconds
- **[DOCUMENTATION.md](./DOCUMENTATION.md)** - Architecture and code documentation
- **[TESTING.md](./TESTING.md)** - Testing guide
- **[DEPLOYMENT.md](../DEPLOYMENT.md)** - Deployment and staging workflow

## Technology Stack

- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **TailwindCSS** - Utility-first CSS
- **Google Calendar API** - Event integration
- **Vitest** - Unit testing (68 tests)
- **GitHub Actions** - CI/CD pipeline
