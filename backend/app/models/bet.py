from datetime import UTC, datetime
from decimal import Decimal
from enum import Enum

from sqlmodel import Field, SQLModel


class BetType(str, Enum):
    PLAYER_PROP = "player_prop"
    TEAM_PROP = "team_prop"
    SPREAD = "spread"
    MONEYLINE = "moneyline"


class BetResult(str, Enum):
    WIN = "win"
    LOSS = "loss"
    PUSH = "push"
    PENDING = "pending"
    CANCELLED = "cancelled"


class PropType(str, Enum):
    POINTS = "points"
    REBOUNDS = "rebounds"
    ASSISTS = "assists"
    STEALS = "steals"
    BLOCKS = "blocks"
    TURNOVERS = "turnovers"
    THREE_POINTERS = "threes"  # Match frontend
    PRA = "pra"
    # Legacy prop types (keeping for backward compatibility)
    FIELD_GOALS_MADE = "field_goals_made"
    FREE_THROWS_MADE = "free_throws_made"
    DOUBLE_DOUBLE = "double_double"
    TRIPLE_DOUBLE = "triple_double"
    PR = "pr"
    PA = "pa"
    RA = "ra"


class Bet(SQLModel, table=True):
    """Unified bet model for all bet types"""

    __tablename__ = "bets"

    id: int | None = Field(default=None, primary_key=True)

    # Common fields for all bet types
    bet_type: BetType
    bet_placed_date: datetime = Field(
        default_factory=lambda: datetime.now(UTC).replace(tzinfo=None)
    )
    game_date: datetime
    team: str
    opponent: str
    wager_amount: Decimal = Field(decimal_places=2)
    odds: int  # American odds format (-110, +150, etc.)
    result: BetResult = BetResult.PENDING
    payout: Decimal | None = Field(default=None, decimal_places=2)
    notes: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None))
    updated_at: datetime | None = None

    # Player prop specific fields (optional)
    player_name: str | None = None
    prop_type: PropType | None = None

    # Prop fields (used by both player and team props)
    description: str | None = None  # Auto-generated based on bet type
    prop_line: Decimal | None = Field(default=None, decimal_places=1)  # Not required for moneyline
    over_under: str | None = None  # "over" or "under", not required for spread/moneyline
    actual_value: Decimal | None = Field(default=None, decimal_places=1)

    def __init__(self, **data):
        super().__init__(**data)
        # Auto-generate description if not provided
        if not self.description:
            self.description = self._generate_description()

    def _generate_description(self) -> str:
        """Generate description based on bet type and data"""
        if self.bet_type == BetType.PLAYER_PROP and self.player_name:
            return self.player_name
        if self.bet_type == BetType.TEAM_PROP and self.team:
            return self.team
        if self.bet_type == BetType.SPREAD and self.team:
            return f"{self.team} {self.prop_line}"
        if self.bet_type == BetType.MONEYLINE and self.team:
            return self.team
        return self.team or "Unknown"


class BetCreate(SQLModel):
    """Model for creating new bets"""

    bet_type: BetType
    bet_placed_date: datetime
    game_date: datetime
    team: str
    opponent: str
    wager_amount: Decimal
    odds: int

    # Optional fields that depend on bet type
    player_name: str | None = None
    prop_type: PropType | None = None
    description: str | None = None  # Will be auto-generated if not provided
    prop_line: Decimal | None = None  # Not required for moneyline
    over_under: str | None = None
    result: BetResult = BetResult.PENDING
    actual_value: Decimal | None = None
    payout: Decimal | None = None
    notes: str | None = None


class BetUpdate(SQLModel):
    """Model for updating existing bets"""

    bet_type: BetType | None = None
    bet_placed_date: datetime | None = None
    game_date: datetime | None = None
    team: str | None = None
    opponent: str | None = None
    player_name: str | None = None
    prop_type: PropType | None = None
    description: str | None = None
    prop_line: Decimal | None = None
    over_under: str | None = None
    wager_amount: Decimal | None = None
    odds: int | None = None
    result: BetResult | None = None
    actual_value: Decimal | None = None
    payout: Decimal | None = None
    notes: str | None = None


# Legacy models for backward compatibility (if needed)
class BetBase(SQLModel):
    """Base model for bet data - kept for compatibility"""

    bet_type: BetType
    game_date: datetime
    team: str
    opponent: str
    wager_amount: Decimal = Field(decimal_places=2)
    odds: int
    result: BetResult = BetResult.PENDING
    payout: Decimal | None = Field(default=None, decimal_places=2)
    notes: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None))
    updated_at: datetime | None = None


class PlayerBet(BetBase, table=False):
    """Legacy player prop bet model - kept for compatibility (no table creation)"""

    __tablename__ = "player_bets"
    id: int | None = Field(default=None, primary_key=True)
    player_name: str
    prop_type: PropType
    prop_line: Decimal = Field(decimal_places=1)
    over_under: str = Field(regex="^(over|under)$")
    actual_value: Decimal | None = Field(default=None, decimal_places=1)


class TeamBet(BetBase, table=False):
    """Legacy team prop bet model - kept for compatibility (no table creation)"""

    __tablename__ = "team_bets"
    id: int | None = Field(default=None, primary_key=True)
    description: str
    prop_line: Decimal = Field(decimal_places=1)
    over_under: str | None = Field(default=None, regex="^(over|under)$")
    actual_value: Decimal | None = Field(default=None, decimal_places=1)


# Additional Pydantic models for API compatibility
class PlayerBetCreate(SQLModel):
    """Legacy model for creating player bets - kept for compatibility"""

    bet_type: BetType = BetType.PLAYER_PROP
    game_date: datetime
    team: str
    opponent: str
    player_name: str
    prop_type: PropType
    prop_line: Decimal
    over_under: str
    wager_amount: Decimal
    odds: int
    notes: str | None = None


class TeamBetCreate(SQLModel):
    """Legacy model for creating team bets - kept for compatibility"""

    bet_type: BetType = BetType.TEAM_PROP
    game_date: datetime
    team: str
    opponent: str
    description: str
    prop_line: Decimal
    over_under: str | None = None
    wager_amount: Decimal
    odds: int
    notes: str | None = None
