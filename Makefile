.PHONY: help build up down logs clean test lint format migrate seed

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Docker Commands
build: ## Build all Docker images
	docker-compose build

up: ## Start all services in development mode
	docker-compose up -d

down: ## Stop all services
	docker-compose down

logs: ## Show logs from all services
	docker-compose logs -f

clean: ## Remove all containers, volumes, and images
	docker-compose down -v --remove-orphans
	docker system prune -f

# Development Commands
dev: ## Start development environment
	@echo "Starting NBA Bets development environment..."
	docker-compose up --build

dev-backend: ## Start only backend services (postgres + api)
	docker-compose up postgres backend

dev-frontend: ## Start only frontend
	cd frontend && npm run dev

# Database Commands
migrate: ## Run database migrations
	docker-compose exec backend alembic upgrade head

migrate-create: ## Create a new migration (use: make migrate-create MESSAGE="description")
	docker-compose exec backend alembic revision --autogenerate -m "$(MESSAGE)"

migrate-rollback: ## Rollback last migration
	docker-compose exec backend alembic downgrade -1

db-reset: ## Reset database (WARNING: destroys all data)
	docker-compose down -v
	docker-compose up -d postgres
	@echo "Waiting for postgres to be ready..."
	@sleep 5
	docker-compose up backend -d
	$(MAKE) migrate

seed: ## Seed database with sample data
	docker-compose exec backend python -m scripts.seed_data

# Testing Commands
test: ## Run all tests
	$(MAKE) test-backend
	$(MAKE) test-frontend

test-backend: ## Run backend tests
	cd backend && uv run pytest -v

test-frontend: ## Run frontend tests
	cd frontend && npm run test -- --run

test-watch: ## Run backend tests in watch mode
	cd backend && uv run pytest --watch

# Linting and Formatting
lint: ## Lint all code
	$(MAKE) lint-backend
	$(MAKE) lint-frontend

lint-backend: ## Lint backend code
	cd backend && uv run ruff check .

lint-frontend: ## Lint frontend code
	cd frontend && npm run lint

format: ## Format all code
	$(MAKE) format-backend
	$(MAKE) format-frontend

format-backend: ## Format backend code
	cd backend && uv run black . && uv run ruff check --fix .

format-frontend: ## Format frontend code
	cd frontend && npm run format

# Production Commands
prod-build: ## Build production images
	docker-compose -f docker-compose.prod.yml build

prod-up: ## Start production environment
	docker-compose -f docker-compose.prod.yml up -d