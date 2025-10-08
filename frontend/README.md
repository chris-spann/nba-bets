# NBA Bets Frontend

React frontend for the NBA Bets tracking application. Built with React 19, TypeScript, Vite 7, and Tailwind CSS v4.

## 🛠 Tech Stack

- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe JavaScript with verbatimModuleSyntax
- **Vite 7** - Lightning-fast build tool with HMR
- **Tailwind CSS v4** - Utility-first CSS with CSS-based configuration
- **TanStack Query** - Powerful data fetching and caching
- **React Router v7** - Client-side routing
- **Vitest** - Fast unit testing framework

## 🚀 Development

### Prerequisites
- Node.js 20.19+ (required for Vite 7)
- Backend API running on http://localhost:8000

### Start Development Server
```bash
# From frontend directory
npm install
npm run dev
```

Or from project root:
```bash
make dev-frontend
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run format       # Format code with ESLint
npm run preview      # Preview production build
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage
```

## 📁 Project Structure

```
src/
├── components/     # Reusable UI components
│   └── Layout.tsx  # Main layout with navigation
├── pages/          # Route components
│   ├── Dashboard.tsx   # Performance overview
│   ├── PropBets.tsx    # Bet listing and management
│   └── AddBet.tsx      # Bet entry forms
├── lib/            # Utilities and API client
│   └── api.ts      # API client with TypeScript types
├── App.tsx         # Main app component with routing
├── main.tsx        # App entry point
└── setupTests.ts   # Test configuration
```

## 🔌 API Integration

The frontend uses a custom API client (`lib/api.ts`) that:
- Provides type-safe interfaces matching the backend models
- Uses native fetch API for HTTP requests (axios available as fallback dependency)
- Integrates with TanStack Query for caching and synchronization
- Supports the unified bet model for all bet types

### Key Types
```typescript
interface Bet {
  id: number
  bet_type: string        // 'player_prop', 'team_prop', etc.
  player_name?: string    // For player prop bets
  prop_type?: string      // 'points', 'rebounds', etc.
  prop_line: string
  over_under?: string
  // ... other fields
}
```

## 🎨 Styling

### Tailwind CSS v4
- Configuration is CSS-based (not JavaScript)
- Theme configuration in `src/index.css` using `@theme {}` blocks
- Import with `@import "tailwindcss"` (not `@tailwind` directives)
- No `tailwind.config.js` file needed

### TypeScript Configuration
- Uses `verbatimModuleSyntax: true`
- Requires type-only imports: `import { type ReactNode } from 'react'`
- Ensures optimal compatibility with React 19

## 🧪 Testing

Tests use Vitest with React Testing Library:

```bash
# Run all tests
npm run test

# Watch mode for development
npm run test:watch

# Coverage report
npm run test:coverage
```

## 🚨 Troubleshooting

### TypeScript Errors
If you see "must be imported using a type-only import" errors:
```typescript
// ❌ Wrong
import { ReactNode } from 'react'

// ✅ Correct
import { type ReactNode } from 'react'
```

### Tailwind Not Working
1. Ensure `@tailwindcss/postcss` is installed
2. Check `index.css` uses `@import "tailwindcss"` 
3. Remove any old `tailwind.config.js` file
4. Restart dev server

### Node.js Version
Vite 7 requires Node.js 20.19+. Use nvm:
```bash
nvm install 20
nvm use 20
nvm alias default 20
```
