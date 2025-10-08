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
        assert data["wager_amount"] == "50.00"
        assert data["odds"] == -110
        assert data["result"] == "pending"
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

        assert data["description"] == "BOS-points"
        assert data["prop_line"] == "112.5"
        assert data["over_under"] == "over"
        assert data["wager_amount"] == "50.00"
        assert data["odds"] == -110
        assert data["result"] == "pending"
        assert data["bet_placed_date"] is not None
        assert data["game_date"] is not None
        assert data["id"] is not None

    async def test_create_team_prop_with_prop_type(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test creating a team prop bet with prop_type"""
        team_prop_data = {
            "bet_type": "team_prop",
            "bet_placed_date": "2025-10-07T18:00:00",
            "game_date": "2025-10-07T20:00:00",
            "team": "LAL",
            "opponent": "GSW",
            "prop_type": "points",
            "prop_line": "225.5",
            "over_under": "over",
            "wager_amount": "75.00",
            "odds": -110,
            "notes": "High scoring team expected",
        }

        response = await client.post("/api/v1/bets", json=team_prop_data)

        assert response.status_code == 200
        data = response.json()

        assert data["bet_type"] == "team_prop"
        assert data["prop_type"] == "points"
        assert data["prop_line"] == "225.5"
        assert data["over_under"] == "over"

    async def test_create_spread_bet(self, client: AsyncClient, db_session: AsyncSession):
        """Test creating a spread bet"""
        spread_data = {
            "bet_type": "spread",
            "bet_placed_date": "2025-10-07T18:00:00",
            "game_date": "2025-10-07T20:00:00",
            "team": "MIL",
            "opponent": "CHI",
            "description": "MIL-spread",
            "prop_line": "5.5",
            "wager_amount": "100.00",
            "odds": -110,
        }

        response = await client.post("/api/v1/bets", json=spread_data)

        assert response.status_code == 200
        data = response.json()

        assert data["bet_type"] == "spread"
        assert data["description"] == "MIL-spread"
        assert data["over_under"] is None  # Spreads don't use over/under

    async def test_get_bets_empty(self, client: AsyncClient, db_session: AsyncSession):
        """Test getting bets when none exist"""
        response = await client.get("/api/v1/bets")

        assert response.status_code == 200
        data = response.json()
        assert data == []

    async def test_get_bets_with_data(self, client: AsyncClient, db_session: AsyncSession):
        """Test getting bets with existing data"""
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
            result=BetResult.PENDING,
        )
        bet2 = Bet(
            bet_type=BetType.TEAM_PROP,
            bet_placed_date=datetime(2025, 10, 7, 19, 0, 0),
            game_date=datetime(2025, 10, 8, 20, 0, 0),
            team="BOS",
            opponent="MIA",
            prop_type=PropType.POINTS,
            prop_line=Decimal("215.5"),
            over_under="under",
            wager_amount=Decimal("75.00"),
            odds=110,
            result=BetResult.WIN,
            actual_value=Decimal("210.0"),
            payout=Decimal("157.50"),
        )

        db_session.add(bet1)
        db_session.add(bet2)
        await db_session.commit()

        response = await client.get("/api/v1/bets")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

        # Should be ordered by created_at desc (most recent first)
        assert data[0]["bet_type"] == "team_prop"
        assert data[1]["bet_type"] == "player_prop"

    async def test_get_bets_with_filters(self, client: AsyncClient, db_session: AsyncSession):
        """Test getting bets with query filters"""
        # Create test data with different properties
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
            bet_placed_date=datetime(2025, 10, 7, 19, 0, 0),
            game_date=datetime(2025, 10, 8, 20, 0, 0),
            team="GSW",
            opponent="LAC",
            prop_type=PropType.POINTS,
            description="GSW-points",
            prop_line=Decimal("118.5"),
            over_under="over",
            wager_amount=Decimal("75.00"),
            odds=120,
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

        # Test player name filter
        response = await client.get("/api/v1/bets?player_name=LeBron")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["player_name"] == "LeBron James"

        # Test team filter
        response = await client.get("/api/v1/bets?team=GSW")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["team"] == "GSW"

        # Test result filter
        response = await client.get("/api/v1/bets?result=win")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["result"] == "win"

    async def test_get_bets_pagination(self, client: AsyncClient, db_session: AsyncSession):
        """Test pagination for bets"""
        # Create multiple bets
        for i in range(5):
            bet = Bet(
                bet_type=BetType.PLAYER_PROP,
                bet_placed_date=datetime(2025, 10, 7 + i, 18, 0, 0),
                game_date=datetime(2025, 10, 7 + i, 20, 0, 0),
                team="LAL",
                opponent="GSW",
                player_name=f"Player {i}",
                prop_type=PropType.POINTS,
                prop_line=Decimal("25.5"),
                over_under="over",
                wager_amount=Decimal("50.00"),
                odds=-110,
                result=BetResult.PENDING,
            )
            db_session.add(bet)

        await db_session.commit()

        # Test limit
        response = await client.get("/api/v1/bets?limit=3")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3

        # Test offset
        response = await client.get("/api/v1/bets?offset=2&limit=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

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
        assert data["player_name"] == "LeBron James"

    async def test_get_bet_not_found(self, client: AsyncClient, db_session: AsyncSession):
        """Test getting a non-existent bet"""
        response = await client.get("/api/v1/bets/999")

        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()

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
        assert data["actual_value"] == "28.0"
        assert data["payout"] == "95.45"
        assert data["notes"] == "Updated bet result"
        assert data["updated_at"] is not None

    async def test_update_bet_not_found(self, client: AsyncClient, db_session: AsyncSession):
        """Test updating a non-existent bet"""
        update_data = {"result": "win"}

        response = await client.patch("/api/v1/bets/999", json=update_data)

        assert response.status_code == 404

    async def test_create_moneyline_bet(self, client: AsyncClient, db_session: AsyncSession):
        """Test creating a moneyline bet"""
        moneyline_data = {
            "bet_type": "moneyline",
            "bet_placed_date": "2025-10-07T18:00:00",
            "game_date": "2025-10-07T20:00:00",
            "team": "BOS",
            "opponent": "MIA",
            "description": "BOS-moneyline",
            "prop_line": "1.0",
            "wager_amount": "50.00",
            "odds": 150,
        }

        response = await client.post("/api/v1/bets", json=moneyline_data)

        assert response.status_code == 200
        data = response.json()

        assert data["bet_type"] == "moneyline"
        assert data["description"] == "BOS-moneyline"
        assert data["over_under"] is None  # Moneylines don't use over/under

    async def test_create_player_bet_with_auto_description(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test creating a player bet with auto-generated prop description"""
        player_data = {
            "bet_type": "player_prop",
            "bet_placed_date": "2025-10-07T18:00:00",
            "game_date": "2025-10-07T20:00:00",
            "team": "LAL",
            "opponent": "GSW",
            "player_name": "LeBron James",
            "prop_type": "rebounds",
            "prop_line": "8.5",
            "over_under": "over",
            "wager_amount": "25.00",
            "odds": -110,
        }

        response = await client.post("/api/v1/bets", json=player_data)

        assert response.status_code == 200
        data = response.json()

        assert data["description"] == "LeBron James-rebounds"

    async def test_get_bets_with_all_filters(self, client: AsyncClient, db_session: AsyncSession):
        """Test getting bets with multiple filters applied"""
        # Create diverse test data
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
            bet_type=BetType.SPREAD,
            bet_placed_date=datetime(2025, 10, 7, 19, 0, 0),
            game_date=datetime(2025, 10, 8, 20, 0, 0),
            team="GSW",
            opponent="LAL",
            description="GSW-spread",
            prop_line=Decimal("3.5"),
            wager_amount=Decimal("100.00"),
            odds=-110,
            result=BetResult.LOSS,
        )

        db_session.add(bet1)
        db_session.add(bet2)
        await db_session.commit()

        # Test prop_type filter
        response = await client.get("/api/v1/bets?prop_type=points")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["prop_type"] == "points"

    async def test_get_bets_with_invalid_query_params(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test that invalid query parameters don't break the API"""
        response = await client.get("/api/v1/bets?invalid_param=test")
        assert response.status_code == 200
        data = response.json()
        assert data == []

    async def test_get_bets_ordering_by_bet_placed_date(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test that bets are ordered by bet_placed_date descending"""
        # Create bets with different placed dates
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
        )
        bet2 = Bet(
            bet_type=BetType.TEAM_PROP,
            bet_placed_date=datetime(2025, 10, 8, 18, 0, 0),  # Later date
            game_date=datetime(2025, 10, 8, 20, 0, 0),
            team="BOS",
            opponent="MIA",
            prop_type=PropType.POINTS,
            description="BOS-points",
            prop_line=Decimal("112.5"),
            over_under="over",
            wager_amount=Decimal("75.00"),
            odds=-105,
        )

        db_session.add(bet1)
        db_session.add(bet2)
        await db_session.commit()

        response = await client.get("/api/v1/bets")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

        # Later bet should come first (desc order)
        assert data[0]["bet_type"] == "team_prop"
        assert data[1]["bet_type"] == "player_prop"

    async def test_update_bet_sets_updated_at(self, client: AsyncClient, db_session: AsyncSession):
        """Test that updating a bet sets the updated_at field"""
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
            wager_amount=Decimal("50.00"),
            odds=-110,
            result=BetResult.PENDING,
        )
        db_session.add(bet)
        await db_session.commit()
        await db_session.refresh(bet)

        # Initially updated_at should be None
        assert bet.updated_at is None

        # Update the bet
        update_data = {"result": "win", "payout": "95.45"}
        response = await client.patch(f"/api/v1/bets/{bet.id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["updated_at"] is not None

    async def test_create_bet_with_minimal_data(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test creating a bet with only required fields"""
        minimal_data = {
            "bet_type": "spread",
            "bet_placed_date": "2025-10-07T18:00:00",
            "game_date": "2025-10-07T20:00:00",
            "team": "LAL",
            "opponent": "GSW",
            "description": "LAL-spread",
            "prop_line": "5.5",
            "wager_amount": "100.00",
            "odds": -110,
        }

        response = await client.post("/api/v1/bets", json=minimal_data)

        assert response.status_code == 200
        data = response.json()
        assert data["bet_type"] == "spread"
        assert data["result"] == "pending"  # Default value
        assert data["notes"] is None
        assert data["payout"] is None

    async def test_get_bets_with_team_filter_partial_match(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test team filter with partial string matching (ilike)"""
        bet = Bet(
            bet_type=BetType.PLAYER_PROP,
            bet_placed_date=datetime(2025, 10, 7, 18, 0, 0),
            game_date=datetime(2025, 10, 7, 20, 0, 0),
            team="Lakers",  # Full name instead of abbreviation
            opponent="Warriors",
            player_name="LeBron James",
            prop_type=PropType.POINTS,
            prop_line=Decimal("25.5"),
            over_under="over",
            wager_amount=Decimal("50.00"),
            odds=-110,
        )
        db_session.add(bet)
        await db_session.commit()

        # Test partial match
        response = await client.get("/api/v1/bets?team=Lak")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["team"] == "Lakers"

    async def test_get_bets_with_player_name_filter_partial_match(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test player name filter with partial string matching (ilike)"""
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
            wager_amount=Decimal("50.00"),
            odds=-110,
        )
        db_session.add(bet)
        await db_session.commit()

        # Test partial match
        response = await client.get("/api/v1/bets?player_name=LeBron")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["player_name"] == "LeBron James"

    async def test_update_bet_with_exclude_unset(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test that bet update only updates provided fields"""
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
            wager_amount=Decimal("50.00"),
            odds=-110,
            result=BetResult.PENDING,
            notes="Original note",
        )
        db_session.add(bet)
        await db_session.commit()
        await db_session.refresh(bet)

        # Update only result, leaving notes unchanged
        update_data = {"result": "win"}
        response = await client.patch(f"/api/v1/bets/{bet.id}", json=update_data)

        assert response.status_code == 200
        data = response.json()
        assert data["result"] == "win"
        assert data["notes"] == "Original note"  # Should remain unchanged


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

    async def test_get_bet_summary_with_data(self, client: AsyncClient, db_session: AsyncSession):
        """Test getting bet summary with actual bet data"""
        # Create player bets
        player_bet_win = Bet(
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
        player_bet_loss = Bet(
            bet_type=BetType.PLAYER_PROP,
            bet_placed_date=datetime(2025, 10, 8, 18, 0, 0),
            game_date=datetime(2025, 10, 8, 20, 0, 0),
            team="GSW",
            opponent="LAC",
            player_name="Stephen Curry",
            prop_type=PropType.THREE_POINTERS,
            prop_line=Decimal("4.5"),
            over_under="over",
            wager_amount=Decimal("75.00"),
            odds=120,
            result=BetResult.LOSS,
        )
        player_bet_pending = Bet(
            bet_type=BetType.PLAYER_PROP,
            bet_placed_date=datetime(2025, 10, 9, 18, 0, 0),
            game_date=datetime(2025, 10, 9, 20, 0, 0),
            team="BOS",
            opponent="MIA",
            player_name="Jayson Tatum",
            prop_type=PropType.REBOUNDS,
            prop_line=Decimal("8.5"),
            over_under="under",
            wager_amount=Decimal("40.00"),
            odds=-105,
            result=BetResult.PENDING,
        )

        # Create non-player bets (team props, game totals, spreads)
        team_bet_win = Bet(
            bet_type=BetType.TEAM_PROP,
            bet_placed_date=datetime(2025, 10, 7, 18, 0, 0),
            game_date=datetime(2025, 10, 7, 20, 0, 0),
            team="BOS",
            opponent="MIA",
            prop_type=PropType.POINTS,
            description="BOS-points",
            prop_line=Decimal("112.5"),
            over_under="over",
            wager_amount=Decimal("50.00"),
            odds=-110,
            result=BetResult.WIN,
        )
        spread_bet_loss = Bet(
            bet_type=BetType.SPREAD,
            bet_placed_date=datetime(2025, 10, 8, 18, 0, 0),
            game_date=datetime(2025, 10, 8, 20, 0, 0),
            team="LAL",
            opponent="GSW",
            description="LAL-spread",
            prop_line=Decimal("7.5"),
            over_under=None,  # Spreads don't use over/under
            wager_amount=Decimal("75.00"),
            odds=105,
            result=BetResult.LOSS,
        )

        db_session.add_all(
            [player_bet_win, player_bet_loss, player_bet_pending, team_bet_win, spread_bet_loss]
        )
        await db_session.commit()

        response = await client.get("/api/v1/bets/analytics/summary")

        assert response.status_code == 200
        data = response.json()

        assert data["total_bets"] == 5
        assert data["total_wins"] == 2  # 1 player + 1 team
        assert data["total_losses"] == 2  # 1 player + 1 spread
        assert data["win_rate"] == 50.0  # 2 wins out of 4 completed bets

        assert data["player_bets"]["total"] == 3
        assert data["player_bets"]["wins"] == 1
        assert data["player_bets"]["losses"] == 1
        assert data["player_bets"]["win_rate"] == 50.0

        assert data["team_bets"]["total"] == 2  # 1 team prop + 1 spread
        assert data["team_bets"]["wins"] == 1  # team prop win
        assert data["team_bets"]["losses"] == 1  # spread loss
        assert data["team_bets"]["win_rate"] == 50.0

    async def test_get_bet_summary_with_comprehensive_data(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test analytics endpoint with comprehensive test data to cover all scenarios"""
        # Create comprehensive test data to cover all analytics paths
        bets = [
            # Player props
            Bet(
                bet_type=BetType.PLAYER_PROP,
                bet_placed_date=datetime(2025, 10, 1, 18, 0, 0),
                game_date=datetime(2025, 10, 1, 20, 0, 0),
                team="LAL",
                opponent="GSW",
                player_name="LeBron James",
                prop_type=PropType.POINTS,
                prop_line=Decimal("25.5"),
                over_under="over",
                wager_amount=Decimal("50.00"),
                odds=-110,
                result=BetResult.WIN,
            ),
            Bet(
                bet_type=BetType.PLAYER_PROP,
                bet_placed_date=datetime(2025, 10, 2, 18, 0, 0),
                game_date=datetime(2025, 10, 2, 20, 0, 0),
                team="BOS",
                opponent="MIA",
                player_name="Jayson Tatum",
                prop_type=PropType.ASSISTS,
                prop_line=Decimal("6.5"),
                over_under="under",
                wager_amount=Decimal("30.00"),
                odds=110,
                result=BetResult.LOSS,
            ),
            Bet(
                bet_type=BetType.PLAYER_PROP,
                bet_placed_date=datetime(2025, 10, 3, 18, 0, 0),
                game_date=datetime(2025, 10, 3, 20, 0, 0),
                team="GSW",
                opponent="LAC",
                player_name="Stephen Curry",
                prop_type=PropType.THREE_POINTERS,
                prop_line=Decimal("4.5"),
                over_under="over",
                wager_amount=Decimal("25.00"),
                odds=-105,
                result=BetResult.PENDING,
            ),
            # Team/other bets
            Bet(
                bet_type=BetType.TEAM_PROP,
                bet_placed_date=datetime(2025, 10, 4, 18, 0, 0),
                game_date=datetime(2025, 10, 4, 20, 0, 0),
                team="MIL",
                opponent="CHI",
                prop_type=PropType.POINTS,
                description="MIL-points",
                prop_line=Decimal("115.5"),
                over_under="over",
                wager_amount=Decimal("75.00"),
                odds=-110,
                result=BetResult.WIN,
            ),
            Bet(
                bet_type=BetType.TEAM_PROP,
                bet_placed_date=datetime(2025, 10, 5, 18, 0, 0),
                game_date=datetime(2025, 10, 5, 20, 0, 0),
                team="PHI",
                opponent="BRK",
                prop_type=PropType.POINTS,
                description="PHI-points",
                prop_line=Decimal("220.5"),
                over_under="under",
                wager_amount=Decimal("100.00"),
                odds=105,
                result=BetResult.LOSS,
            ),
            Bet(
                bet_type=BetType.SPREAD,
                bet_placed_date=datetime(2025, 10, 6, 18, 0, 0),
                game_date=datetime(2025, 10, 6, 20, 0, 0),
                team="DEN",
                opponent="SAS",
                description="DEN-spread",
                prop_line=Decimal("7.5"),
                wager_amount=Decimal("50.00"),
                odds=-110,
                result=BetResult.WIN,
            ),
            Bet(
                bet_type=BetType.MONEYLINE,
                bet_placed_date=datetime(2025, 10, 7, 18, 0, 0),
                game_date=datetime(2025, 10, 7, 20, 0, 0),
                team="CLE",
                opponent="DET",
                description="CLE-moneyline",
                prop_line=Decimal("1.0"),
                wager_amount=Decimal("40.00"),
                odds=150,
                result=BetResult.PENDING,
            ),
        ]

        for bet in bets:
            db_session.add(bet)
        await db_session.commit()

        response = await client.get("/api/v1/bets/analytics/summary")

        assert response.status_code == 200
        data = response.json()

        # Overall stats
        assert data["total_bets"] == 7
        assert data["total_wins"] == 3  # 1 player + 2 non-player
        assert data["total_losses"] == 2  # 1 player + 1 non-player
        assert data["win_rate"] == 60.0  # 3 wins out of 5 completed bets

        # Player bet stats
        assert data["player_bets"]["total"] == 3
        assert data["player_bets"]["wins"] == 1
        assert data["player_bets"]["losses"] == 1
        assert data["player_bets"]["win_rate"] == 50.0

        # Non-player bet stats (2 team props + 1 spread + 1 moneyline = 4)
        assert data["team_bets"]["total"] == 4
        assert data["team_bets"]["wins"] == 2  # MIL-points win, DEN-spread win
        assert data["team_bets"]["losses"] == 1  # PHI-points loss
        assert data["team_bets"]["win_rate"] == 66.67

    async def test_all_database_operations_coverage(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test to ensure all database operations in routers are covered"""
        # This test ensures all db operations like commit, refresh, get are executed

        # Test create (covers db.add, db.commit, db.refresh)
        create_data = {
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
        }
        create_response = await client.post("/api/v1/bets", json=create_data)
        assert create_response.status_code == 200
        bet_data = create_response.json()
        bet_id = bet_data["id"]

        # Test get by ID (covers db.get)
        get_response = await client.get(f"/api/v1/bets/{bet_id}")
        assert get_response.status_code == 200

        # Test update (covers db.get, setattr, db.commit, db.refresh)
        update_data = {"result": "win", "payout": "95.45", "actual_value": "28.0"}
        update_response = await client.patch(f"/api/v1/bets/{bet_id}", json=update_data)
        assert update_response.status_code == 200
        updated_data = update_response.json()
        assert updated_data["result"] == "win"
        assert updated_data["updated_at"] is not None

        # Test get_bets (covers query execution and result.scalars().all())
        list_response = await client.get("/api/v1/bets")
        assert list_response.status_code == 200
        bets_list = list_response.json()
        assert len(bets_list) >= 1

    async def test_get_bet_not_found(self, client: AsyncClient):
        """Test getting non-existent bet returns 404"""
        response = await client.get("/api/v1/bets/99999")
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    async def test_update_bet_not_found(self, client: AsyncClient):
        """Test updating non-existent bet returns 404"""
        update_data = {"result": "win"}
        response = await client.patch("/api/v1/bets/99999", json=update_data)
        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()


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
