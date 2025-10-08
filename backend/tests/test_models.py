from datetime import UTC, datetime
from decimal import Decimal

from app.models.bet import (
    Bet,
    BetCreate,
    BetResult,
    BetType,
    BetUpdate,
    PropType,
)


class TestEnums:
    """Test enum classes"""

    def test_bet_type_enum(self):
        """Test BetType enum values"""
        assert BetType.PLAYER_PROP == "player_prop"
        assert BetType.TEAM_PROP == "team_prop"
        assert BetType.SPREAD == "spread"
        assert BetType.MONEYLINE == "moneyline"

    def test_bet_result_enum(self):
        """Test BetResult enum values"""
        assert BetResult.WIN == "win"
        assert BetResult.LOSS == "loss"
        assert BetResult.PUSH == "push"
        assert BetResult.PENDING == "pending"
        assert BetResult.CANCELLED == "cancelled"

    def test_prop_type_enum(self):
        """Test PropType enum values"""
        assert PropType.POINTS == "points"
        assert PropType.REBOUNDS == "rebounds"
        assert PropType.ASSISTS == "assists"
        assert PropType.THREE_POINTERS == "threes"  # Updated to match frontend
        assert PropType.STEALS == "steals"
        assert PropType.BLOCKS == "blocks"
        assert PropType.TURNOVERS == "turnovers"
        assert PropType.FIELD_GOALS_MADE == "field_goals_made"
        assert PropType.FREE_THROWS_MADE == "free_throws_made"
        assert PropType.DOUBLE_DOUBLE == "double_double"
        assert PropType.TRIPLE_DOUBLE == "triple_double"
        # Test new prop types
        assert PropType.PRA == "pra"
        assert PropType.PR == "pr"
        assert PropType.PA == "pa"
        assert PropType.RA == "ra"


class TestPlayerBet:
    """Test unified Bet model for player bets"""

    def test_create_player_bet(self):
        """Test creating a Bet instance for a player prop"""
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
            notes="Test bet",
        )

        assert bet.bet_type == BetType.PLAYER_PROP
        assert bet.bet_placed_date == datetime(2025, 10, 7, 18, 0, 0)
        assert bet.game_date == datetime(2025, 10, 7, 20, 0, 0)
        assert bet.team == "LAL"
        assert bet.opponent == "GSW"
        assert bet.player_name == "LeBron James"
        assert bet.prop_type == PropType.POINTS
        assert bet.prop_line == Decimal("25.5")
        assert bet.over_under == "over"
        assert bet.wager_amount == Decimal("50.00")
        assert bet.odds == -110
        assert bet.result == BetResult.PENDING
        assert bet.payout is None
        assert bet.actual_value is None
        assert bet.notes == "Test bet"
        assert bet.created_at is not None

    def test_player_bet_with_result(self):
        """Test Bet with completed result for player prop"""
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
            result=BetResult.WIN,
            actual_value=Decimal("28.0"),
            payout=Decimal("95.45"),
        )

        assert bet.result == BetResult.WIN
        assert bet.actual_value == Decimal("28.0")
        assert bet.payout == Decimal("95.45")

    def test_player_bet_over_under_validation(self):
        """Test over_under field regex validation"""
        # Valid values
        bet_over = Bet(
            bet_type=BetType.PLAYER_PROP,
            bet_placed_date=datetime.now(UTC).replace(tzinfo=None),
            game_date=datetime.now(UTC).replace(tzinfo=None),
            team="LAL",
            opponent="GSW",
            player_name="Test Player",
            prop_type=PropType.POINTS,
            prop_line=Decimal("25.5"),
            over_under="over",
            wager_amount=Decimal("50.00"),
            odds=-110,
        )
        assert bet_over.over_under == "over"

        bet_under = Bet(
            bet_type=BetType.PLAYER_PROP,
            bet_placed_date=datetime.now(UTC).replace(tzinfo=None),
            game_date=datetime.now(UTC).replace(tzinfo=None),
            team="LAL",
            opponent="GSW",
            player_name="Test Player",
            prop_type=PropType.POINTS,
            prop_line=Decimal("25.5"),
            over_under="under",
            wager_amount=Decimal("50.00"),
            odds=-110,
        )
        assert bet_under.over_under == "under"


class TestTeamBet:
    """Test unified Bet model for team/game bets"""

    def test_create_team_bet(self):
        """Test creating a Bet instance for a team prop"""
        bet = Bet(
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
            result=BetResult.PENDING,
        )

        assert bet.bet_type == BetType.TEAM_PROP
        assert bet.bet_placed_date == datetime(2025, 10, 7, 18, 0, 0)
        assert bet.game_date == datetime(2025, 10, 7, 20, 0, 0)
        assert bet.team == "BOS"
        assert bet.opponent == "MIA"
        assert bet.description == "BOS-points"
        assert bet.prop_line == Decimal("112.5")
        assert bet.over_under == "over"
        assert bet.wager_amount == Decimal("50.00")
        assert bet.odds == -110
        assert bet.result == BetResult.PENDING

    def test_team_bet_spread(self):
        """Test Bet for spread betting"""
        bet = Bet(
            bet_type=BetType.SPREAD,
            bet_placed_date=datetime(2025, 10, 7, 18, 0, 0),
            game_date=datetime(2025, 10, 7, 20, 0, 0),
            team="MIL",
            opponent="CHI",
            description="MIL-spread",
            prop_line=Decimal("5.5"),
            over_under=None,  # Spread doesn't use over/under
            wager_amount=Decimal("100.00"),
            odds=-110,
            result=BetResult.PENDING,
        )

        assert bet.bet_type == BetType.SPREAD
        assert bet.over_under is None
        assert bet.prop_line == Decimal("5.5")

    def test_team_bet_with_prop_type(self):
        """Test team prop bet with prop_type"""
        bet = Bet(
            bet_type=BetType.TEAM_PROP,
            bet_placed_date=datetime(2025, 10, 7, 18, 0, 0),
            game_date=datetime(2025, 10, 7, 20, 0, 0),
            team="LAL",
            opponent="GSW",
            prop_type=PropType.POINTS,
            prop_line=Decimal("225.5"),
            over_under="under",
            wager_amount=Decimal("75.00"),
            odds=105,
            result=BetResult.LOSS,
            actual_value=Decimal("232.0"),
            payout=Decimal("0.00"),
        )

        assert bet.bet_type == BetType.TEAM_PROP
        assert bet.prop_type == PropType.POINTS
        assert bet.over_under == "under"
        assert bet.actual_value == Decimal("232.0")
        assert bet.payout == Decimal("0.00")


class TestCreateModels:
    """Test Pydantic create models"""

    def test_player_bet_create(self):
        """Test BetCreate model for player props"""
        bet_create = BetCreate(
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
            notes="Test bet",
        )

        assert bet_create.bet_type == BetType.PLAYER_PROP
        assert bet_create.player_name == "LeBron James"
        assert bet_create.prop_type == PropType.POINTS
        assert bet_create.notes == "Test bet"

    def test_team_bet_create(self):
        """Test BetCreate model for team props"""
        bet_create = BetCreate(
            bet_type=BetType.TEAM_PROP,
            bet_placed_date=datetime(2025, 10, 7, 18, 0, 0),
            game_date=datetime(2025, 10, 7, 20, 0, 0),
            team="BOS",
            opponent="MIA",
            description="BOS-points",
            prop_line=Decimal("112.5"),
            over_under="over",
            wager_amount=Decimal("50.00"),
            odds=-110,
        )

        assert bet_create.bet_type == BetType.TEAM_PROP
        assert bet_create.description == "BOS-points"
        assert bet_create.over_under == "over"

    def test_team_bet_create_without_over_under(self):
        """Test BetCreate without over_under (for spreads)"""
        bet_create = BetCreate(
            bet_type=BetType.SPREAD,
            bet_placed_date=datetime(2025, 10, 7, 18, 0, 0),
            game_date=datetime(2025, 10, 7, 20, 0, 0),
            team="MIL",
            opponent="CHI",
            description="MIL-spread",
            prop_line=Decimal("5.5"),
            wager_amount=Decimal("100.00"),
            odds=-110,
        )

        assert bet_create.over_under is None


class TestBetUpdate:
    """Test BetUpdate model"""

    def test_bet_update_all_fields(self):
        """Test BetUpdate with all fields"""
        bet_update = BetUpdate(
            result=BetResult.WIN,
            actual_value=Decimal("28.0"),
            payout=Decimal("95.45"),
            notes="Updated bet result",
        )

        assert bet_update.result == BetResult.WIN
        assert bet_update.actual_value == Decimal("28.0")
        assert bet_update.payout == Decimal("95.45")
        assert bet_update.notes == "Updated bet result"

    def test_bet_update_partial_fields(self):
        """Test BetUpdate with only some fields"""
        bet_update = BetUpdate(result=BetResult.LOSS, payout=Decimal("0.00"))

        assert bet_update.result == BetResult.LOSS
        assert bet_update.actual_value is None
        assert bet_update.payout == Decimal("0.00")
        assert bet_update.notes is None

    def test_bet_update_empty(self):
        """Test BetUpdate with no fields"""
        bet_update = BetUpdate()

        assert bet_update.result is None
        assert bet_update.actual_value is None
        assert bet_update.payout is None
        assert bet_update.notes is None
