# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

NBA Bets is a full-stack web application for tracking NBA prop bets and analyzing betting performance. The application uses a modern stack with FastAPI backend, React frontend, and PostgreSQL database, all containerized with Docker.

**Recent Improvements**:
- ✅ Upgraded to Tailwind CSS v4 with CSS-based configuration
- ✅ Fixed Node.js 20+ compatibility for Vite 7
- ✅ Resolved Docker port conflicts (PostgreSQL on 5433)
- ✅ Fixed TypeScript verbatimModuleSyntax issues
- ✅ Improved .gitignore to prevent Docker error files

## Development Commands

### Quick Start
```bash
# First time setup (automatically creates virtual env and installs dependencies)
./setup_dev_env.sh    # One-time setup script

# Or use VSCode tasks:
# Cmd+Shift+P → "Tasks: Run Task" → "Setup Development Environment"

# Then start development
make dev              # Start full development environment (Docker)
make migrate          # Run database migrations (required on first run)
```

### Core Development
```bash
# Environment Management
make up               # Start services without rebuilding
make down             # Stop all services
make build            # Build Docker images
make clean            # Remove containers and volumes

# Database Operations
make migrate          # Apply migrations
make migrate-create MESSAGE="description"  # Create new migration
make migrate-rollback # Rollback last migration
make db-reset         # Reset database (destroys data!)
make seed             # Seed with sample data

# Development Modes
make dev-backend      # Start only postgres + FastAPI backend
make dev-frontend     # Start only React frontend (requires backend running)
```

### Testing
```bash
make test             # Run all tests
make test-backend     # Backend tests only (pytest)
make test-frontend    # Frontend tests only (Vitest)

# Backend-specific testing (in backend/ directory)
uv run pytest -v                    # All backend tests
uv run pytest --cov=app            # With coverage
uv run pytest -k "test_player"     # Specific test pattern
```

### Code Quality (Astral Stack: uv + ruff + ty)
```bash
make lint             # Lint all code (includes type checking)
make format           # Format all code
make lint-backend     # Backend linting (Ruff)
make type-check       # Type checking (ty)
make type-check-watch # Type checking in watch mode
make lint-frontend    # Frontend linting (ESLint)
make format-backend   # Backend formatting (Ruff)
make format-frontend  # Frontend formatting
```

### Single Test Execution
```bash
# Backend (from backend/ directory)
uv run pytest tests/test_bets.py::test_create_player_bet -v

# Frontend (from frontend/ directory)
npm run test -- PropBets.test.tsx
```

## Architecture Overview

### High-Level Structure

**Full-Stack Application**: Separated backend API and frontend SPA with shared database
- **Backend**: FastAPI with async SQLAlchemy, PostgreSQL database
- **Frontend**: React 19 with TypeScript, TanStack Query for state management
- **Database**: PostgreSQL with Alembic migrations
- **Deployment**: Docker Compose for development, containerized services

### Backend Architecture (FastAPI)

**Key Components**:
- **SQLModel/SQLAlchemy**: Database ORM with async support and type safety
- **Alembic**: Database migration management  
- **FastAPI Routing**: RESTful API with automatic OpenAPI docs
- **Async Database Operations**: High-performance database interactions
- **Astral Stack**: Modern Python tooling (uv + ruff + ty)

**Core Models**:
- `Bet`: Unified model for all bet types (player props, team props, spreads, totals, moneylines)
- `BetType`: Enum for different bet categories (PLAYER_PROP, TEAM_PROP, GAME_TOTAL, SPREAD, MONEYLINE)
- `PropType`: Enum for player prop types (POINTS, REBOUNDS, ASSISTS, etc.)
- `BetResult`: Enum for bet outcomes (WIN, LOSS, PUSH, PENDING, CANCELLED)

**API Structure**:
- `/api/v1/bets/` - Unified bet CRUD operations for all bet types
- `/api/v1/bets/{id}` - Individual bet operations
- `/api/v1/bets/analytics/summary` - Performance analytics

**Database Schema**:
- Decimal precision for monetary values and prop lines
- Enum types for bet results, prop types, and bet categories
- Timestamp tracking for created/updated dates
- American odds format (e.g., -110, +150)

### Frontend Architecture (React + TypeScript)

**State Management**:
- **TanStack Query**: Server state, caching, and data fetching
- **React Router**: Client-side routing
- **Local Component State**: UI state management

**Key Pages/Components**:
- `Dashboard`: Performance overview and recent activity
- `PropBets`: Unified bet listing and management for all bet types
- `AddBet`: Bet entry forms supporting all bet types
- `Layout`: Navigation and common UI structure

**API Integration**:
- Native fetch API for HTTP requests to FastAPI backend (axios available as fallback)
- TanStack Query for caching and data synchronization
- TypeScript interfaces in lib/api.ts matching backend models

### Development Workflow

**Database Changes**:
1. Modify SQLModel models in `backend/app/models/`
2. Generate migration: `make migrate-create MESSAGE="description"`
3. Apply migration: `make migrate`
4. Update API endpoints and frontend types as needed

**Adding New Endpoints**:
1. Add route handler in `backend/app/routers/`
2. Update model schemas if needed
3. Add corresponding frontend API calls and components
4. Test with both unit tests and integration tests

**Code Organization**:
- **Backend**: Domain-driven with models, routers, database, core config
- **Frontend**: Feature-based with pages, components, hooks, and types
- **Shared**: Database migrations, Docker configs, development scripts

### Key Configuration

**Configuration Files**:
- Root `pyproject.toml`: Project metadata and tool configuration (Commitizen)
- Backend `pyproject.toml`: Python dependencies, Ruff, pytest, coverage settings
- Frontend `package.json`: Node.js dependencies and scripts

**Environment Variables** (backend `.env`):
- `POSTGRES_*`: Database connection settings
- `DEBUG`: Development mode flag
- `API_PREFIX`: API route prefix (/api/v1)

**Development Ports**:
- PostgreSQL: 5433 (host) → 5432 (container) - *Changed to avoid local PostgreSQL conflicts*
- FastAPI backend: 8000 
- React frontend: 5173
- API docs: http://localhost:8000/docs

**Node.js Requirements**:
- Node.js 20.19+ required for Vite 7 compatibility
- Use `nvm use 20 && nvm alias default 20` to ensure correct version

### Testing Strategy

**Backend Testing**:
- pytest with async test support
- SQLModel/SQLAlchemy test database
- API endpoint testing with FastAPI TestClient
- Coverage reporting with pytest-cov

**Frontend Testing**:
- Vitest for unit testing
- React Testing Library for component testing
- Mock API responses for integration testing

## Development Notes

**Database Considerations**:
- Uses async SQLAlchemy with asyncpg driver for PostgreSQL
- Decimal fields for precise monetary calculations
- Alembic handles schema changes automatically
- Foreign keys and constraints enforce data integrity

**Performance Optimizations**:
- TanStack Query caching reduces API calls
- Async backend operations for database
- Docker volume mounts for development hot reloading
- PostgreSQL indexes on commonly queried fields

**Type Safety**:
- Full TypeScript on frontend with verbatimModuleSyntax enabled
- SQLModel provides Pydantic validation on backend
- Shared data contracts between frontend/backend
- Enum types prevent invalid state values

## Troubleshooting & Common Issues

### Frontend Development Issues

**Tailwind CSS v4 Setup**:
- Configuration is now CSS-based, not JavaScript
- Use `@import "tailwindcss"` in `index.css` instead of `@tailwind` directives
- Theme configuration goes in `@theme {}` block within CSS
- No `tailwind.config.js` file needed (delete if present)

**TypeScript verbatimModuleSyntax**:
```typescript
// ❌ This will cause errors
import { ReactNode } from 'react'

// ✅ Use type-only imports for types
import { type ReactNode } from 'react'
```

**Node.js Version Issues**:
- Vite 7 requires Node.js 20.19+
- Use nvm: `nvm install 20 && nvm use 20 && nvm alias default 20`
- Restart terminal after switching versions

### Docker & Environment Issues

**Port Conflicts**:
- PostgreSQL runs on host port 5433 to avoid conflicts with local installs
- If port 5432 errors persist: `lsof -i :5432` and stop conflicting services
- Clean Docker state: `make clean && docker system prune -f`

**Container Issues**:
```bash
# Full reset if containers are misbehaving
make clean
docker system prune -f
make build
make dev
```

**Database Connection Issues**:
- Ensure PostgreSQL container is healthy before backend starts
- Check logs: `docker compose logs postgres`
- Reset database: `make db-reset` (destroys data)

### Development Workflow Tips

**CSS/Styling Changes**:
- Tailwind v4 has better HMR, but restart dev server if styles aren't updating
- Check browser console for PostCSS errors
- Verify `@tailwindcss/postcss` is installed

**TypeScript Errors**:
- Use type-only imports for React types: `import { type FC } from 'react'`
- Check tsconfig.json has `verbatimModuleSyntax: true`
- Restart TypeScript server in VS Code: Cmd+Shift+P → "TypeScript: Restart TS Server"

**Hot Reloading Issues**:
- Frontend: Vite HMR should work automatically, restart if stuck
- Backend: FastAPI auto-reloads on file changes in development
- Database: Schema changes require migrations (`make migrate`)
