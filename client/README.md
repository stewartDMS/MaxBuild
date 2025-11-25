# MaxBuild Frontend

Modern SaaS dashboard for the AI-Powered Tender Automation System.

## Technology Stack

- **React 19** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **Material-UI (MUI) v6** - Component library
- **Emotion** - CSS-in-JS styling
- **React Router v7** - Client-side routing

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The development server will start at `http://localhost:5173`.

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Preview Production Build

```bash
npm run preview
```

## Features

- ✨ Modern Material Design UI with MUI v6
- 🌙 Light/Dark theme support with system preference detection
- 📱 Fully responsive design (mobile, tablet, desktop)
- ♿ WCAG accessibility compliance
- 🎨 Consistent design system with custom color palette
- 📊 Interactive dashboard with statistics and charts
- 📁 Drag-and-drop file upload area
- 🔔 Activity feed and notifications

## Project Structure

```
src/
├── components/       # Reusable UI components
│   ├── StatCard.tsx
│   ├── StatusBadge.tsx
│   ├── TenderCard.tsx
│   ├── UploadArea.tsx
│   └── RecentActivity.tsx
├── contexts/         # React contexts
│   ├── ThemeContext.ts
│   └── ThemeProvider.tsx
├── hooks/            # Custom React hooks
│   └── useThemeMode.ts
├── layouts/          # Layout components
│   └── DashboardLayout.tsx
├── pages/            # Page components
│   └── Dashboard.tsx
├── theme/            # MUI theme configuration
│   └── theme.ts
├── App.tsx           # Main application component
├── main.tsx          # React entry point
└── index.css         # Global styles
```

## Theme Customization

The theme is configured in `src/theme/theme.ts`. You can customize:

- Color palette (primary, secondary, success, warning, error, info)
- Typography (font family, sizes, weights)
- Component styles (buttons, cards, inputs, etc.)
- Spacing and border radius
- Light and dark mode colors

## Accessibility

The application follows WCAG 2.1 guidelines:

- Proper heading hierarchy
- ARIA labels on interactive elements
- Keyboard navigation support
- Skip links for main content
- Sufficient color contrast
- Reduced motion support
