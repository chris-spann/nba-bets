.PHONY: help build up down logs clean test lint format migrate seed

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# Docker Commands
build: ## Build all Docker images
	docker compose build

up: ## Start all services in development mode
	docker compose up -d

down: ## Stop all services
	docker compose down

logs: ## Show logs from all services
	docker compose logs -f

clean: ## Remove all containers, volumes, and images
	docker compose down -v --remove-orphans
	docker system prune -f

# Development Commands
dev: ## Start development environment
	@echo "Starting NBA Bets development environment..."
	docker compose up --build

dev-backend: ## Start only backend services (postgres + api)
	docker compose up postgres backend

dev-frontend: ## Start only frontend
	cd frontend && npm run dev

# Database Commands
migrate: ## Run database migrations
	docker compose exec backend alembic upgrade head

migrate-create: ## Create a new migration (use: make migrate-create MESSAGE="description")
	docker compose exec backend alembic revision --autogenerate -m "$(MESSAGE)"

migrate-rollback: ## Rollback last migration
	docker compose exec backend alembic downgrade -1

db-reset: ## Reset database (WARNING: destroys all data)
	docker compose down -v
	docker compose up -d postgres
	@echo "Waiting for postgres to be ready..."
	@sleep 5
	docker compose up backend -d
	$(MAKE) migrate

seed: ## Seed database with sample data
	docker compose exec backend python -m scripts.seed_data

# Testing Commands
test: ## Run all tests with coverage
	$(MAKE) test-backend-coverage
	$(MAKE) test-frontend-coverage

test-backend: ## Run backend tests
	cd backend && uv run pytest -v

test-backend-coverage: ## Run backend tests with coverage
	cd backend && uv run pytest -v --cov=app --cov-report=term-missing --cov-report=html

test-frontend: ## Run frontend tests
	cd frontend && npm run test

test-frontend-coverage: ## Run frontend tests with coverage
	cd frontend && npm run test:coverage

test-watch: ## Run backend tests in watch mode
	cd backend && uv run pytest --watch

# Linting and Formatting
lint: ## Lint all code
	$(MAKE) lint-backend
	$(MAKE) type-check
	$(MAKE) lint-frontend

lint-backend: ## Lint backend code
	cd backend && uv run ruff check .

type-check: ## Run type checking with ty
	cd backend && uv run ty check

type-check-watch: ## Run type checking in watch mode
	cd backend && uv run ty check --watch

lint-frontend: ## Lint frontend code
	cd frontend && npm run lint

format: ## Format all code
	$(MAKE) format-backend
	$(MAKE) format-frontend

format-backend: ## Format backend code
	cd backend && uv run ruff check --fix . && uv run ruff format .

format-frontend: ## Format frontend code
	cd frontend && npm run format

# Pre-commit specific commands
check-format-backend: ## Check backend code formatting (no fixes)
	cd backend && uv run ruff check . && uv run ruff format --check .

check-lint-frontend: ## Check frontend linting and types
	cd frontend && npm run lint && npx tsc --noEmit

check-yaml: ## Check YAML files (also available via: cd backend && uv run yamllint)
	@command -v yamllint >/dev/null 2>&1 || { echo "yamllint not found, installing..."; pip install yamllint; }
	@# yamllint with inline config: 120 char lines, no document-start, no comments-indentation, truthy values
	@find . -name '*.yml' -o -name '*.yaml' | grep -v node_modules | grep -v '\.venv/' | \
		xargs yamllint -d '{extends: default, rules: {line-length: {max: 120}, document-start: disable, comments-indentation: disable, truthy: {allowed-values: ["true", "false", "on", "off"]}}}'

check-json: ## Check JSON files (excluding package-lock and tsconfig)
	@find . -name '*.json' ! -path './frontend/package-lock.json' ! -path './frontend/tsconfig*.json' -exec python -m json.tool {} \; >/dev/null

check-security: ## Basic security checks
	@echo "Running basic security checks..."
	@grep -r "password\|secret\|key" --include="*.py" --include="*.js" --include="*.ts" --exclude-dir=node_modules --exclude-dir=.git . | grep -v test | grep -v example || echo "No obvious secrets found"

check-markdown: ## Check markdown files
	@# markdownlint with inline config: disable line-length, no-inline-html, first-line-heading, no-duplicate-heading
	@command -v markdownlint >/dev/null 2>&1 || { echo "markdownlint not found, installing globally..."; npm install -g markdownlint-cli; }
	@find . -name '*.md' | grep -v node_modules | grep -v '\.venv/' | grep -v '\.pytest_cache' | \
		xargs markdownlint --disable MD013 MD033 MD041 MD024 --

lint-docker: ## Lint Dockerfiles
	@command -v hadolint >/dev/null 2>&1 || { echo "hadolint not found. Install from: https://github.com/hadolint/hadolint"; exit 1; }
	hadolint --ignore DL3008 --ignore DL3009 */Dockerfile || echo "No Dockerfiles found or linting passed"

# Production Commands
prod-build: ## Build production images
	docker compose -f docker-compose.prod.yml build

prod-up: ## Start production environment
	docker compose -f docker-compose.prod.yml up -d
