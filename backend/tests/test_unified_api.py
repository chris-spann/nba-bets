from datetime import datetime
from decimal import Decimal

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bet import Bet, BetResult, BetType, PropType


class TestUnifiedBetAPI:
    """Test unified bet API endpoints"""

    async def test_create_player_bet(
        self, client: AsyncClient, db_session: AsyncSession, sample_player_bet_data
    ):
        """Test creating a player bet"""
        response = await client.post("/api/v1/bets", json=sample_player_bet_data)

        assert response.status_code == 200
        data = response.json()

        assert data["player_name"] == "LeBron James"
        assert data["prop_type"] == "points"
        assert data["prop_line"] == "25.5"
        assert data["over_under"] == "over"
        assert data["bet_placed_date"] is not None
        assert data["game_date"] is not None
        assert data["id"] is not None

    async def test_create_team_bet(
        self, client: AsyncClient, db_session: AsyncSession, sample_team_bet_data
    ):
        """Test creating a team bet"""
        response = await client.post("/api/v1/bets", json=sample_team_bet_data)

        assert response.status_code == 200
        data = response.json()

        assert data["prop_description"] == "Boston Celtics Total Points"
        assert data["bet_type"] == "team_prop"

    async def test_get_bets_empty(self, client: AsyncClient, db_session: AsyncSession):
        """Test getting bets when none exist"""
        response = await client.get("/api/v1/bets")

        assert response.status_code == 200
        data = response.json()
        assert data == []

    async def test_get_bets_with_filters(self, client: AsyncClient, db_session: AsyncSession):
        """Test getting bets with query filters"""
        # Create test data
        bet1 = Bet(
            bet_type=BetType.PLAYER_PROP,
            bet_placed_date=datetime(2025, 10, 7, 18, 0, 0),
            game_date=datetime(2025, 10, 7, 20, 0, 0),
            team="LAL",
            opponent="GSW",
            player_name="LeBron James",
            prop_type=PropType.POINTS,
            prop_line=Decimal("25.5"),
            over_under="over",
            wager_amount=Decimal("50.00"),
            odds=-110,
            result=BetResult.WIN,
        )
        bet2 = Bet(
            bet_type=BetType.TEAM_PROP,
            bet_placed_date=datetime(2025, 10, 7, 18, 0, 0),
            game_date=datetime(2025, 10, 8, 20, 0, 0),
            team="BOS",
            opponent="MIA",
            prop_description="Boston Celtics Total Points",
            prop_line=Decimal("112.5"),
            over_under="over",
            wager_amount=Decimal("75.00"),
            odds=-110,
            result=BetResult.LOSS,
        )

        db_session.add(bet1)
        db_session.add(bet2)
        await db_session.commit()

        # Test bet type filter
        response = await client.get("/api/v1/bets?bet_type=player_prop")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["bet_type"] == "player_prop"

    async def test_get_bet_by_id(self, client: AsyncClient, db_session: AsyncSession):
        """Test getting a specific bet by ID"""
        bet = Bet(
            bet_type=BetType.PLAYER_PROP,
            bet_placed_date=datetime(2025, 10, 7, 18, 0, 0),
            game_date=datetime(2025, 10, 7, 20, 0, 0),
            team="LAL",
            opponent="GSW",
            player_name="LeBron James",
            prop_type=PropType.POINTS,
            prop_line=Decimal("25.5"),
            over_under="over",
            prop_description="LeBron James Points",
            wager_amount=Decimal("50.00"),
            odds=-110,
            result=BetResult.PENDING,
        )
        db_session.add(bet)
        await db_session.commit()
        await db_session.refresh(bet)

        response = await client.get(f"/api/v1/bets/{bet.id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == bet.id

    async def test_update_bet(self, client: AsyncClient, db_session: AsyncSession):
        """Test updating a bet"""
        bet = Bet(
            bet_type=BetType.PLAYER_PROP,
            bet_placed_date=datetime(2025, 10, 7, 18, 0, 0),
            game_date=datetime(2025, 10, 7, 20, 0, 0),
            team="LAL",
            opponent="GSW",
            player_name="LeBron James",
            prop_type=PropType.POINTS,
            prop_line=Decimal("25.5"),
            over_under="over",
            prop_description="LeBron James Points",
            wager_amount=Decimal("50.00"),
            odds=-110,
            result=BetResult.PENDING,
        )
        db_session.add(bet)
        await db_session.commit()
        await db_session.refresh(bet)

        update_data = {
            "result": "win",
            "actual_value": "28.0",
            "payout": "95.45",
            "notes": "Updated bet result",
        }

        response = await client.patch(f"/api/v1/bets/{bet.id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["result"] == "win"


class TestAnalyticsAPI:
    """Test analytics API endpoints"""

    async def test_get_bet_summary_empty(self, client: AsyncClient, db_session: AsyncSession):
        """Test getting bet summary when no bets exist"""
        response = await client.get("/api/v1/bets/analytics/summary")

        assert response.status_code == 200
        data = response.json()

        assert data["total_bets"] == 0
        assert data["total_wins"] == 0
        assert data["total_losses"] == 0
        assert data["win_rate"] == 0
        assert data["player_bets"]["total"] == 0
        assert data["team_bets"]["total"] == 0


class TestMainAPI:
    """Test main app endpoints"""

    async def test_root_endpoint(self, client: AsyncClient):
        """Test root endpoint"""
        response = await client.get("/")

        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data
        assert "status" in data
        assert data["status"] == "healthy"

    async def test_health_check_endpoint(self, client: AsyncClient):
        """Test health check endpoint"""
        response = await client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "service" in data
