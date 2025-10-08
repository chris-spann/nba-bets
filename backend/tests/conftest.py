import asyncio

import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from sqlmodel import SQLModel

from app.database.connection import get_db_session
from app.main import app

# Test database URL - use in-memory SQLite for fast tests
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

# Create test engine
test_engine = create_async_engine(
    TEST_DATABASE_URL,
    echo=False,
    pool_pre_ping=True,
)

# Create test session factory
TestAsyncSessionLocal = sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_test_db_session():
    """Test database session dependency override"""
    async with TestAsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


@pytest.fixture(scope="session")
def event_loop():
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="function")
async def db_session():
    """Create a test database session for each test"""
    # Create all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.create_all)

    # Override the dependency
    app.dependency_overrides[get_db_session] = get_test_db_session

    async with TestAsyncSessionLocal() as session:
        yield session

    # Clean up
    app.dependency_overrides.clear()

    # Drop all tables
    async with test_engine.begin() as conn:
        await conn.run_sync(SQLModel.metadata.drop_all)


@pytest_asyncio.fixture
async def client(db_session: AsyncSession):
    """Create a test client for making HTTP requests"""
    from httpx import ASGITransport

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac


@pytest.fixture
def sample_player_bet_data():
    """Sample player bet data for testing"""
    return {
        "bet_type": "player_prop",
        "bet_placed_date": "2025-10-07T18:00:00",
        "game_date": "2025-10-07T20:00:00",
        "team": "LAL",
        "opponent": "GSW",
        "player_name": "LeBron James",
        "prop_type": "points",
        "prop_line": "25.5",
        "over_under": "over",
        "wager_amount": "50.00",
        "odds": -110,
        "notes": "Test player bet",
    }


@pytest.fixture
def sample_team_bet_data():
    """Sample team bet data for testing"""
    return {
        "bet_type": "team_prop",
        "bet_placed_date": "2025-10-07T18:00:00",
        "game_date": "2025-10-07T20:00:00",
        "team": "BOS",
        "opponent": "MIA",
        "prop_description": "Boston Celtics Total Points",
        "prop_line": "112.5",
        "over_under": "over",
        "wager_amount": "50.00",
        "odds": -110,
        "notes": "Test team bet",
    }
