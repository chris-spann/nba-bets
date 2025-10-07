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
- **FastAPI** - Modern, fast web framework for building APIs
- **SQLModel** - Type-safe SQL database interactions
- **PostgreSQL** - Robust relational database
- **Alembic** - Database migration management
- **Async SQLAlchemy** - High-performance database operations
- **Python 3.13** - Latest Python features and performance

### Frontend  
- **React 18** - Modern UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Lightning-fast build tool with HMR
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Powerful data fetching and caching
- **React Router** - Client-side routing

### Development & Deployment
- **Docker** - Containerized development and deployment
- **Docker Compose** - Multi-service orchestration
- **uv** - Fast Python package management
- **GitHub Actions** - CI/CD pipelines
- **Ruff + Black** - Python linting and formatting

## 🚀 Quick Start

### Prerequisites
- **Docker & Docker Compose** - For containerized development
- **Node.js 22+** - For frontend development (if running outside Docker)
- **Python 3.13+** - For backend development (if running outside Docker)

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
   - PostgreSQL database on port 5432
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

### Player Bets
- `GET /api/v1/bets/player` - List player bets
- `POST /api/v1/bets/player` - Create player bet
- `GET /api/v1/bets/player/{id}` - Get specific player bet
- `PATCH /api/v1/bets/player/{id}` - Update player bet

### Team Bets
- `GET /api/v1/bets/team` - List team bets
- `POST /api/v1/bets/team` - Create team bet
- `GET /api/v1/bets/team/{id}` - Get specific team bet
- `PATCH /api/v1/bets/team/{id}` - Update team bet

### Analytics
- `GET /api/v1/bets/analytics/summary` - Betting performance summary

Full API documentation available at http://localhost:8000/docs when running.

## 🗄 Database Schema

### PlayerBet
- Player name, prop type (points, rebounds, etc.), line, over/under
- Game details, odds, wager amount
- Result tracking and payout calculation

### TeamBet  
- Team, opponent, prop description
- Game details, odds, wager amount
- Result tracking and payout calculation

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
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Route components
│   │   ├── hooks/          # Custom React hooks
│   │   └── types/          # TypeScript types
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