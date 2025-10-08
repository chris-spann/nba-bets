from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession

from app.database.connection import engine, get_db_session


class TestDatabaseConnection:
    """Test database connection functionality"""

    def test_engine_creation(self):
        """Test that engine is created correctly"""
        assert isinstance(engine, AsyncEngine)
        # Engine should be either PostgreSQL (production) or SQLite (test)
        assert engine.url.drivername in ["postgresql+asyncpg", "sqlite+aiosqlite"]

    async def test_get_db_session(self):
        """Test that get_db_session returns AsyncSession"""
        session_gen = get_db_session()
        session = await anext(session_gen)

        assert isinstance(session, AsyncSession)

        # Clean up
        await session.close()
