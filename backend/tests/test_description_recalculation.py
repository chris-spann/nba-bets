"""
Test cases for description recalculation during bet updates.
"""

from datetime import datetime
from decimal import Decimal

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.bet import Bet, BetResult, BetType, PropType
from app.routers.bets import generate_description


class TestDescriptionRecalculation:
    """Test description recalculation functionality"""

    def test_generate_description_player_prop(self):
        """Test description generation for player props"""
        description = generate_description(
            bet_type=BetType.PLAYER_PROP, team="LAL", player_name="LeBron James", prop_type="points"
        )
        assert description == "LeBron James-points"

    def test_generate_description_team_prop(self):
        """Test description generation for team props"""
        description = generate_description(
            bet_type=BetType.TEAM_PROP, team="BOS", player_name=None, prop_type="points"
        )
        assert description == "BOS-points"

    def test_generate_description_spread(self):
        """Test description generation for spread bets"""
        description = generate_description(
            bet_type=BetType.SPREAD, team="MIL", player_name=None, prop_type=None
        )
        assert description == "MIL-spread"

    def test_generate_description_moneyline(self):
        """Test description generation for moneyline bets"""
        description = generate_description(
            bet_type=BetType.MONEYLINE, team="MIL", player_name=None, prop_type=None
        )
        assert description == "MIL-moneyline"

    def test_generate_description_missing_prop_type(self):
        """Test description generation for player prop without prop_type (fallback)"""
        description = generate_description(
            bet_type=BetType.PLAYER_PROP,
            team="LAL",
            player_name="LeBron James",
            prop_type=None,  # Missing prop_type
        )
        assert description == "LeBron James"  # Falls back to player name

    def test_generate_description_fallback(self):
        """Test description generation fallback to team name"""
        description = generate_description(
            bet_type=BetType.PLAYER_PROP,
            team="LAL",
            player_name=None,  # Missing player name
            prop_type="points",
        )
        assert description == "LAL"

    def test_generate_description_unknown_fallback(self):
        """Test description generation fallback to Unknown"""
        description = generate_description(
            bet_type=BetType.PLAYER_PROP, team=None, player_name=None, prop_type=None
        )
        assert description == "Unknown"

    async def test_create_bet_auto_generates_description_player_prop(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test that creating a player prop bet auto-generates description"""
        bet_data = {
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

        response = await client.post("/api/v1/bets", json=bet_data)
        assert response.status_code == 200

        data = response.json()
        assert data["description"] == "LeBron James-points"

    async def test_create_bet_auto_generates_description_team_prop(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test that creating a team prop bet auto-generates description"""
        bet_data = {
            "bet_type": "team_prop",
            "bet_placed_date": "2025-10-07T18:00:00",
            "game_date": "2025-10-07T20:00:00",
            "team": "BOS",
            "opponent": "MIA",
            "prop_type": "points",
            "prop_line": "112.5",
            "over_under": "over",
            "wager_amount": "75.00",
            "odds": -110,
        }

        response = await client.post("/api/v1/bets", json=bet_data)
        assert response.status_code == 200

        data = response.json()
        assert data["description"] == "BOS-points"

    async def test_create_bet_auto_generates_description_spread(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test that creating a spread bet auto-generates description"""
        bet_data = {
            "bet_type": "spread",
            "bet_placed_date": "2025-10-07T18:00:00",
            "game_date": "2025-10-07T20:00:00",
            "team": "MIL",
            "opponent": "CHI",
            "prop_line": "5.5",
            "wager_amount": "100.00",
            "odds": -110,
        }

        response = await client.post("/api/v1/bets", json=bet_data)
        assert response.status_code == 200

        data = response.json()
        assert data["description"] == "MIL-spread"

    async def test_create_bet_respects_provided_description(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test that providing a description overrides auto-generation"""
        bet_data = {
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
            "description": "Custom Description",
        }

        response = await client.post("/api/v1/bets", json=bet_data)
        assert response.status_code == 200

        data = response.json()
        assert data["description"] == "Custom Description"

    async def test_patch_update_recalculates_description_on_player_name_change(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test that PATCH update recalculates description when player name changes"""
        # Create initial bet
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
            description="LeBron James-points",
            wager_amount=Decimal("50.00"),
            odds=-110,
            result=BetResult.PENDING,
        )
        db_session.add(bet)
        await db_session.commit()
        await db_session.refresh(bet)

        # Update player name
        update_data = {"player_name": "Anthony Davis"}

        response = await client.patch(f"/api/v1/bets/{bet.id}", json=update_data)
        assert response.status_code == 200

        data = response.json()
        assert data["description"] == "Anthony Davis-points"

    async def test_patch_update_recalculates_description_on_team_change(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test that PATCH update recalculates description when team changes"""
        # Create initial bet
        bet = Bet(
            bet_type=BetType.TEAM_PROP,
            bet_placed_date=datetime(2025, 10, 7, 18, 0, 0),
            game_date=datetime(2025, 10, 7, 20, 0, 0),
            team="BOS",
            opponent="MIA",
            prop_type=PropType.POINTS,
            prop_line=Decimal("112.5"),
            over_under="over",
            description="BOS-points",
            wager_amount=Decimal("75.00"),
            odds=-110,
            result=BetResult.PENDING,
        )
        db_session.add(bet)
        await db_session.commit()
        await db_session.refresh(bet)

        # Update team
        update_data = {"team": "LAL"}

        response = await client.patch(f"/api/v1/bets/{bet.id}", json=update_data)
        assert response.status_code == 200

        data = response.json()
        assert data["description"] == "LAL-points"

    async def test_patch_update_recalculates_description_on_bet_type_change(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test that PATCH update recalculates description when bet type changes"""
        # Create initial player prop bet
        bet = Bet(
            bet_type=BetType.PLAYER_PROP,
            bet_placed_date=datetime(2025, 10, 7, 18, 0, 0),
            game_date=datetime(2025, 10, 7, 20, 0, 0),
            team="LAL",
            opponent="GSW",
            player_name="LeBron James",
            prop_type=PropType.POINTS,
            prop_line=Decimal("5.5"),
            over_under="over",
            description="LeBron James-points",
            wager_amount=Decimal("50.00"),
            odds=-110,
            result=BetResult.PENDING,
        )
        db_session.add(bet)
        await db_session.commit()
        await db_session.refresh(bet)

        # Change to spread bet
        update_data = {"bet_type": "spread"}

        response = await client.patch(f"/api/v1/bets/{bet.id}", json=update_data)
        assert response.status_code == 200

        data = response.json()
        assert data["description"] == "LAL-spread"  # Should now be team-bettype for spread

    async def test_patch_update_respects_explicit_description(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test that PATCH update respects explicitly provided description"""
        # Create initial bet
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
            description="LeBron James-points",
            wager_amount=Decimal("50.00"),
            odds=-110,
            result=BetResult.PENDING,
        )
        db_session.add(bet)
        await db_session.commit()
        await db_session.refresh(bet)

        # Update with explicit description
        update_data = {"player_name": "Anthony Davis", "description": "Custom Description Override"}

        response = await client.patch(f"/api/v1/bets/{bet.id}", json=update_data)
        assert response.status_code == 200

        data = response.json()
        assert data["description"] == "Custom Description Override"

    async def test_patch_update_no_recalculation_for_non_affecting_fields(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test that PATCH update doesn't recalculate description for non-affecting fields"""
        # Create initial bet
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
            description="LeBron James-points",
            wager_amount=Decimal("50.00"),
            odds=-110,
            result=BetResult.PENDING,
        )
        db_session.add(bet)
        await db_session.commit()
        await db_session.refresh(bet)

        # Update non-affecting fields
        update_data = {"result": "win", "payout": "95.45", "notes": "Good bet"}

        response = await client.patch(f"/api/v1/bets/{bet.id}", json=update_data)
        assert response.status_code == 200

        data = response.json()
        assert data["description"] == "LeBron James-points"  # Should remain unchanged

    async def test_put_update_recalculates_description(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test that PUT update recalculates description"""
        # Create initial bet
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
            description="LeBron James-points",
            wager_amount=Decimal("50.00"),
            odds=-110,
            result=BetResult.PENDING,
        )
        db_session.add(bet)
        await db_session.commit()
        await db_session.refresh(bet)

        # Full replacement with new data
        new_bet_data = {
            "bet_type": "spread",
            "bet_placed_date": "2025-10-07T18:00:00",
            "game_date": "2025-10-07T20:00:00",
            "team": "MIL",
            "opponent": "CHI",
            "prop_line": "5.5",
            "wager_amount": "100.00",
            "odds": -110,
        }

        response = await client.put(f"/api/v1/bets/{bet.id}", json=new_bet_data)
        assert response.status_code == 200

        data = response.json()
        assert data["description"] == "MIL-spread"

    async def test_put_update_respects_explicit_description(
        self, client: AsyncClient, db_session: AsyncSession
    ):
        """Test that PUT update respects explicitly provided description"""
        # Create initial bet
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
            description="LeBron James-points",
            wager_amount=Decimal("50.00"),
            odds=-110,
            result=BetResult.PENDING,
        )
        db_session.add(bet)
        await db_session.commit()
        await db_session.refresh(bet)

        # Full replacement with explicit description
        new_bet_data = {
            "bet_type": "spread",
            "bet_placed_date": "2025-10-07T18:00:00",
            "game_date": "2025-10-07T20:00:00",
            "team": "MIL",
            "opponent": "CHI",
            "prop_line": "5.5",
            "wager_amount": "100.00",
            "odds": -110,
            "description": "Custom Spread Description",
        }

        response = await client.put(f"/api/v1/bets/{bet.id}", json=new_bet_data)
        assert response.status_code == 200

        data = response.json()
        assert data["description"] == "Custom Spread Description"
