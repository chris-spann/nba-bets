from datetime import datetime
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
    THREE_POINTERS = "three_pointers"
    STEALS = "steals"
    BLOCKS = "blocks"
    TURNOVERS = "turnovers"
    FIELD_GOALS_MADE = "field_goals_made"
    FREE_THROWS_MADE = "free_throws_made"
    DOUBLE_DOUBLE = "double_double"
    TRIPLE_DOUBLE = "triple_double"


class BetBase(SQLModel):
    """Base model for bet data"""

    bet_type: BetType
    game_date: datetime
    team: str
    opponent: str
    wager_amount: Decimal = Field(decimal_places=2)
    odds: int  # American odds format (-110, +150, etc.)
    result: BetResult = BetResult.PENDING
    payout: Decimal | None = Field(default=None, decimal_places=2)
    notes: str | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime | None = None


class PlayerBet(BetBase, table=True):
    """Player prop bet tracking"""

    __tablename__ = "player_bets"

    id: int | None = Field(default=None, primary_key=True)
    player_name: str
    prop_type: PropType
    prop_line: Decimal = Field(decimal_places=1)  # e.g., 25.5 points
    over_under: str = Field(regex="^(over|under)$")  # "over" or "under"
    actual_value: Decimal | None = Field(default=None, decimal_places=1)


class TeamBet(BetBase, table=True):
    """Team prop bet tracking"""

    __tablename__ = "team_bets"

    id: int | None = Field(default=None, primary_key=True)
    prop_description: str  # e.g., "Total Team Rebounds Over 45.5"
    prop_line: Decimal = Field(decimal_places=1)
    over_under: str | None = Field(default=None, regex="^(over|under)$")
    actual_value: Decimal | None = Field(default=None, decimal_places=1)


# Pydantic models for API
class PlayerBetCreate(SQLModel):
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


class BetUpdate(SQLModel):
    result: BetResult | None = None
    actual_value: Decimal | None = None
    payout: Decimal | None = None
    notes: str | None = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)
