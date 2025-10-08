from datetime import UTC, datetime
from decimal import Decimal
from enum import Enum

from sqlmodel import Field, SQLModel


class BetType(str, Enum):
    PLAYER_PROP = "player_prop"
    TEAM_PROP = "team_prop"
    GAME_TOTAL = "game_total"
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
    FIELD_GOALS_MADE = "field_goals_made"
    FREE_THROWS_MADE = "free_throws_made"
    DOUBLE_DOUBLE = "double_double"
    TRIPLE_DOUBLE = "triple_double"
    # Additional prop types for the enum
    THREE_POINTERS = "threes"  # Updated to match frontend
    PRA = "pra"
    PR = "pr"
    PA = "pa"
    RA = "ra"



class Bet(SQLModel, table=True):
    """Unified bet model for all bet types"""

    __tablename__ = "bets"

    id: int | None = Field(default=None, primary_key=True)

    # Common fields for all bet types
    bet_type: BetType
    bet_placed_date: datetime = Field(default_factory=lambda: datetime.now(UTC).replace(tzinfo=None))
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
    prop_description: str | None = None  # Auto-generated for player props, manual for others
    prop_line: Decimal = Field(decimal_places=1)
    over_under: str | None = None  # "over" or "under", not required for spread/moneyline
    actual_value: Decimal | None = Field(default=None, decimal_places=1)


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
    prop_description: str | None = None
    prop_line: Decimal
    over_under: str | None = None
    result: BetResult = BetResult.PENDING
    actual_value: Decimal | None = None
    payout: Decimal | None = None
    notes: str | None = None


class BetUpdate(SQLModel):
    """Model for updating existing bets"""
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


class PlayerBet(BetBase, table=True):
    """Legacy player prop bet model - kept for compatibility"""
    __tablename__ = "player_bets"
    id: int | None = Field(default=None, primary_key=True)
    player_name: str
    prop_type: PropType
    prop_line: Decimal = Field(decimal_places=1)
    over_under: str = Field(regex="^(over|under)$")
    actual_value: Decimal | None = Field(default=None, decimal_places=1)


class TeamBet(BetBase, table=True):
    """Legacy team prop bet model - kept for compatibility"""
    __tablename__ = "team_bets"
    id: int | None = Field(default=None, primary_key=True)
    prop_description: str
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
    prop_description: str
    prop_line: Decimal
    over_under: str | None = None
    wager_amount: Decimal
    odds: int
    notes: str | None = None
