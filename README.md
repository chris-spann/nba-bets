# NBA Bets Tracking Application

A full-stack web application for tracking NBA prop bets, analyzing betting performance, and providing ML-backed recommendations.

## 🏀 Features

### Current (Phase 1 - Bet Tracking)
- **Player Prop Bets**: Track points, rebounds, assists, and other player statistics
- **Team Prop Bets**: Track team-level prop bets and totals
- **Performance Analytics**: Win rate, ROI, and detailed betting statistics
- **Historical Data**: Complete betting history with search and filtering
- **REST API**: Full CRUD operations for bet management

### Planned (Phase 2 - Recommendations)
- **ML Recommendations**: Data-driven betting suggestions
- **Historical Success Analysis**: Track which bet types perform best
- **Current Betting Options**: Integration with betting APIs
- **Advanced Analytics**: Deeper performance insights

## 🛠 Tech Stack

### Backend
- **FastAPI** - Modern, fast web framework for building APIs (≥0.118.0)
- **SQLModel** - Type-safe SQL database interactions (≥0.0.25)
- **PostgreSQL 16** - Robust relational database with async support
- **Alembic** - Database migration management (≥1.16.5)
- **Async SQLAlchemy** - High-performance database operations via asyncpg
- **Python 3.13+** - Latest Python features and performance

### Frontend  
- **React 19** - Latest UI framework with concurrent features and improved performance (^19.1.1)
- **TypeScript 5.9** - Type-safe JavaScript with verbatimModuleSyntax (~5.9.3)
- **Vite 7** - Lightning-fast build tool with HMR (^7.1.7)
- **Tailwind CSS v4** - Latest utility-first CSS framework with CSS-based config (^4.1.14)
- **TanStack Query v5** - Powerful data fetching and caching (^5.90.2)
- **React Router v7** - Client-side routing (^7.9.3)

### Development & Deployment
- **Docker** - Containerized development and deployment
- **Docker Compose** - Multi-service orchestration with health checks
- **uv** - Fast Python package management and virtual environments
- **Node.js 20.19+** - Required for Vite 7 compatibility (use nvm to manage versions)
- **Requirements files** - requirements.txt (production) + requirements-dev.txt (development)
- **GitHub Actions** - CI/CD pipelines
- **Astral Stack** - Modern Python tooling (uv + ruff + ty)

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** - For containerized development
- **Node.js 20.19+** - Required for Vite 7 compatibility (use nvm to manage versions)
- **Python 3.13+** - For backend development (if running outside Docker)
- **PostgreSQL** - Local installation will conflict with Docker on port 5432

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd nba-bets
   ```

2. **Start the development environment**
   ```bash
   make dev
   ```
   This will start:
   - PostgreSQL database on port 5433 (Docker internal: 5432)
   - FastAPI backend on port 8000  
   - React frontend on port 5173

3. **Run database migrations**
   ```bash
   make migrate
   ```

4. **Open the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Alternative: Local Development

#### Backend Setup
```bash
cd backend
uv venv --python 3.13
# Install production dependencies
uv pip install -r requirements.txt
# Or install with development dependencies
uv pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

#### Frontend Setup  
```bash
cd frontend
npm install
npm run dev
```

## 📋 Available Commands

Run `make help` to see all available commands:

```bash
# Development
make dev              # Start full development environment
make dev-backend      # Start only backend services
make dev-frontend     # Start only frontend

# Database
make migrate          # Run migrations
make migrate-create   # Create new migration
make db-reset         # Reset database (destroys data!)
make seed             # Seed with sample data

# Testing
make test             # Run all tests
make test-backend     # Backend tests only
make test-frontend    # Frontend tests only

# Code Quality
make lint             # Lint all code
make format           # Format all code

# Docker
make build            # Build Docker images
make up               # Start services
make down             # Stop services
make clean            # Remove containers and volumes
```

## 📊 API Endpoints

### Unified Bet Management
- `GET /api/v1/bets/` - List all bets with filtering support:
  - `?bet_type=` - Filter by bet type (player_prop, team_prop, etc.)
  - `?team=` - Filter by team name (partial match)
  - `?player_name=` - Filter by player name (partial match)  
  - `?prop_type=` - Filter by prop type (points, rebounds, etc.)
  - `?result=` - Filter by bet result (win, loss, pending, etc.)
  - `?skip=` & `?limit=` - Pagination support
- `POST /api/v1/bets/` - Create new bet (all types: player props, team props, spreads, totals, moneylines)
- `GET /api/v1/bets/{id}` - Get specific bet
- `PATCH /api/v1/bets/{id}` - Update bet (typically for result and actual_value)

### Analytics
- `GET /api/v1/bets/analytics/summary` - Betting performance summary with overall and per-type statistics

Full API documentation available at http://localhost:8000/docs when running.

## 🗄 Database Schema

### Unified Bet Model
- **Bet Type**: PLAYER_PROP, TEAM_PROP, GAME_TOTAL, SPREAD, MONEYLINE
- **Common Fields**: Team, opponent, game date, odds, wager amount, result, payout
- **Player Props**: Player name, prop type (points, rebounds, assists, etc.), line, over/under
- **Team/Game Props**: Prop description, line, over/under (where applicable)
- **Result Tracking**: WIN, LOSS, PUSH, PENDING, CANCELLED with actual values

## 🧪 Testing

### Backend Tests
```bash
cd backend
uv run pytest -v                    # Run all tests
uv run pytest --cov=app            # With coverage
uv run pytest -k "test_player"     # Run specific tests
```

### Frontend Tests
```bash
cd frontend
npm run test           # Run tests once
npm run test:watch     # Run in watch mode
```

## 🔧 Configuration

### Environment Variables

Backend configuration via `.env` file:
```env
# Database
POSTGRES_SERVER=localhost
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=nba_bets

# App Settings
DEBUG=true
API_PREFIX=/api/v1
```

See `backend/.env.template` for all available options.

## 🔧 Troubleshooting

### Common Issues

#### Port 5432 Already in Use
If you get a "port 5432 already in use" error, you likely have PostgreSQL running locally. The project uses port 5433 on the host to avoid conflicts:
```bash
# Check what's using the port
lsof -i :5432
ps aux | grep postgres

# Stop local PostgreSQL (macOS with Homebrew)
brew services stop postgresql@14
# or
sudo launchctl unload /Library/LaunchDaemons/com.edb.launchd.postgresql-14.plist
```

Note: The project PostgreSQL runs on host port 5433, but if you have a local PostgreSQL instance, it may still cause issues.

#### Node.js Version Issues
Vite 7 requires Node.js 20.19+. Use nvm to manage versions:
```bash
nvm install 20
nvm use 20
nvm alias default 20
```

#### TypeScript verbatimModuleSyntax Errors
If you see "must be imported using a type-only import" errors:
```typescript
// ❌ Wrong
import { ReactNode } from 'react'

// ✅ Correct
import { type ReactNode } from 'react'
```

#### Tailwind CSS Not Working
If styles aren't applying after upgrading to Tailwind v4:
1. Ensure you have `@tailwindcss/postcss` installed
2. Check that `index.css` uses `@import "tailwindcss"` instead of `@tailwind` directives
3. Remove old `tailwind.config.js` file (v4 uses CSS-based config)

#### Docker Issues
```bash
# Clean up Docker state
make clean
docker system prune -f

# Rebuild from scratch
make build
```

## 📦 Project Structure

```
nba-bets/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── models/         # SQLModel database models
│   │   ├── routers/        # API route handlers  
│   │   ├── database/       # Database connection
│   │   ├── core/           # Configuration
│   │   └── main.py         # FastAPI application
│   ├── alembic/            # Database migrations
│   ├── tests/              # Backend tests
│   └── requirements*.txt   # Python dependencies
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components (Layout)
│   │   ├── pages/          # Route components (Dashboard, PropBets, AddBet)
│   │   ├── lib/            # API client and shared utilities
│   │   └── setupTests.ts   # Test configuration
│   ├── eslint.config.js    # ESLint configuration
│   ├── postcss.config.js   # PostCSS configuration
│   ├── vite.config.ts      # Vite configuration
│   └── package.json        # Node.js dependencies
├── .github/workflows/      # CI/CD pipelines
├── docker-compose.yml      # Development orchestration
└── Makefile               # Development commands
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`make test`)
5. Format code (`make format`)
6. Commit changes (`git commit -m 'Add amazing feature'`)
7. Push to branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🎯 Roadmap

### Phase 1: Core Bet Tracking ✅
- [x] Database models and API
- [x] Basic UI for bet entry and viewing
- [x] Docker development environment
- [x] CI/CD pipeline

### Phase 2: Advanced Analytics (Coming Soon)
- [ ] ML-based bet recommendations
- [ ] Advanced performance analytics
- [ ] Data visualization dashboard
- [ ] Betting API integrations

### Phase 3: Production Features
- [ ] User authentication
- [ ] Multi-user support
- [ ] Mobile responsive design
- [ ] Production deployment