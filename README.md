# Mark's Projects Portfolio

Welcome to my collection of web applications and experiments! This repository contains various projects organized in subdirectories.

---

## 📁 Projects

### 🎡 [YearWheel](./year-shape-calendar/)

**Status:** ✅ Active | **Version:** 0.5.1 | **Tech:** TypeScript, Vite, TailwindCSS

An interactive calendar visualization that morphs between circular and square shapes, representing the entire year in a unique way. Features Google Calendar integration, seasonal organization, and a beautiful modern UI.

**Environments:**
- **Production (Cloudflare):** https://yearwheel.pages.dev/
- **Production (GitHub Pages):** https://komapc.github.io/year-shape/ (legacy, still active)
- **Staging:** https://staging.yearwheel.pages.dev/ (auto-deployed from `staging` branch)
- **PR Previews:** Every PR gets a unique URL like `https://<branch>.yearwheel.pages.dev/`

**Features:**
- 🔄 Morphing shape (circle ↔ square)
- 📅 52-week year visualization
- 🌍 Seasonal organization (Winter, Spring, Summer, Autumn)
- 📊 Google Calendar API integration
- 🎨 Modern, accessible UI
- 📱 Fully responsive design

**Quick Start:**
```bash
cd year-shape-calendar
npm install
npm run dev
```

**Live Demo:** [https://yearwheel.pages.dev/](https://yearwheel.pages.dev/)

**Documentation:**
- [Full README](./year-shape-calendar/README.md)
- [Quick Start Guide](./year-shape-calendar/QUICKSTART.md)
- [Architecture](./year-shape-calendar/ARCHITECTURE.md)
- [Testing Guide](./year-shape-calendar/TESTING.md)

---

## 🛠️ Technologies Used Across Projects

- **Frontend:** TypeScript, React, Next.js, TailwindCSS
- **Build Tools:** Vite, Webpack
- **APIs:** Google Calendar API
- **Deployment:** GitHub Pages, GitHub Actions
- **Testing:** Manual testing, future: Vitest, Playwright

---

## 📂 Repository Structure

```
/
├── .github/                    # GitHub Actions workflows (shared)
├── year-shape-calendar/        # YearWheel project
│   ├── src/                   # Source code
│   ├── public/                # Static assets
│   ├── .env.example          # Environment variables template
│   └── README.md             # Project documentation
└── README.md                  # This file (projects index)
```

---

## 🚀 Getting Started

Each project is self-contained with its own dependencies and build configuration.

### General Workflow:

1. **Navigate to a project:**
   ```bash
   cd <project-name>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 🤝 Contributing

This is a personal portfolio repository, but feedback and suggestions are welcome!

---

## 📧 Contact

**GitHub:** [komapc](https://github.com/komapc)  
**Email:** komapc@gmail.com

---

## 📝 License

Each project may have its own license. Please refer to individual project directories for details.

---

**Last Updated:** November 2025  
**Projects Count:** 1 (more coming soon!)

