# Pre-commit Setup

This project uses [pre-commit](https://pre-commit.com/) to ensure code quality and consistency before commits.

## Installation

Pre-commit is already installed and configured. The hooks will run automatically on each commit.

## What's Included

### Active Hooks

**File Quality Checks:**
- Trim trailing whitespace
- Fix end of files
- Check TOML syntax
- Check XML syntax
- Detect merge conflicts
- Detect large files
- Detect private keys
- Enforce Unix line endings

**Python Backend (using Makefile commands):**
- Ruff linting with autofix (`make format-backend`)
- Code formatting
- Import sorting
- All Ruff rules from pyproject.toml

**Frontend (using Makefile commands):**
- ESLint linting (`make check-lint-frontend`)
- TypeScript type checking
- Combined frontend quality checks

### Available but Disabled Hooks

These hooks are available in the Makefile but commented out in pre-commit for performance:

- **YAML validation** (`make check-yaml`): Can be slow with large node_modules
- **JSON validation** (`make check-json`): Conflicts with TSConfig files
- **Python Type Checking** (`make type-check`): ty is pre-release software
- **Security checks** (`make check-security`): Basic grep-based security scanning
- **Docker linting** (`make lint-docker`): Requires hadolint installation
- **Test execution**: Backend/frontend tests run in CI instead

## Usage

### Automatic (Recommended)

Once installed, pre-commit runs automatically on every `git commit`:

```bash
git add .
git commit -m "Your commit message"
# Pre-commit hooks run automatically
# If any hook fails, the commit is blocked
# Fix issues and commit again
```

### Manual Execution

Run on all files:

```bash
pre-commit run --all-files
```

Run specific hooks:

```bash
pre-commit run ruff-format --all-files
pre-commit run check-lint-frontend --all-files
```

Run only on staged files:

```bash
pre-commit run
```

### Direct Makefile Usage

You can also run the underlying Makefile commands directly:

```bash
# Backend formatting and linting
make format-backend
make lint-backend

# Frontend checks
make check-lint-frontend
make format-frontend

# Additional checks (not in pre-commit by default)
make type-check        # Python type checking with ty
make check-yaml        # YAML validation with inline config
make check-json        # JSON validation
make check-markdown    # Markdown linting with inline config
make check-security    # Basic security scanning
make lint-docker       # Dockerfile linting (requires hadolint)
```

### Bypassing Hooks

```bash
# Skip all hooks (use sparingly)
git commit --no-verify

# Update hook versions
pre-commit autoupdate
```

## Configuration

- **Main config**: `.pre-commit-config.yaml`
- **Project config**: `pyproject.toml` (Commitizen settings)
- **Python linting**: `backend/pyproject.toml` (Ruff configuration)
- **Frontend linting**: `frontend/eslint.config.js`
- **YAML linting**: Inline configuration in Makefile (`make check-yaml`)
- **Markdown linting**: Inline configuration in Makefile (`make check-markdown`)

## Troubleshooting

### Common Issues

1. **Python version mismatch**: Update `target-version` in `backend/pyproject.toml`
2. **Executable scripts**: Use `git add --chmod=+x filename`
3. **JSON with comments**: TSConfig files are excluded from JSON validation
4. **Large files**: Consider using Git LFS or exclude from repo

### Performance

If hooks are too slow:
1. Enable only essential hooks for daily work
2. Run full checks in CI/CD
3. Use `pre-commit run --files changed_file.py` for single files

## Benefits

- **Consistent code style** across the team
- **Early error detection** before CI/CD
- **Automated formatting** saves manual work
- **Security checks** prevent credential leaks
- **Type safety** with TypeScript checking
- **Clean git history** with consistent formatting