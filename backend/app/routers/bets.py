from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import func

from app.database.connection import get_db_session
from app.models.bet import (
    Bet,
    BetCreate,
    BetResult,
    BetType,
    BetUpdate,
    PropType,
)

router = APIRouter(prefix="/bets", tags=["bets"])


def generate_description(
    bet_type: BetType, team: str | None = None, player_name: str | None = None, prop_type=None
) -> str:
    """Generate description based on bet type and data following the pattern:
    - Player Props: '{player_name}-{prop_type}'
    - Team Props: '{team}-{prop_type}'
    - Non-Props: '{team}-{bet_type}'
    """
    # Handle PropType enum or string
    prop_type_str = None
    if prop_type is not None:
        prop_type_str = prop_type.value if hasattr(prop_type, "value") else str(prop_type)

    if bet_type == BetType.PLAYER_PROP and player_name and prop_type_str:
        return f"{player_name}-{prop_type_str}"
    if bet_type == BetType.TEAM_PROP and team and prop_type_str:
        return f"{team}-{prop_type_str}"
    if bet_type in [BetType.SPREAD, BetType.MONEYLINE] and team:
        return f"{team}-{bet_type.value}"
    # Fallback for incomplete data
    if player_name:
        return player_name
    if team:
        return team
    return "Unknown"


# Unified Bet Endpoints
@router.post("", response_model=Bet)
async def create_bet(bet: BetCreate, db: AsyncSession = Depends(get_db_session)):
    """Create a new bet (player prop, team prop, or any other bet type)"""
    # Convert to dict and let Bet model auto-generate description if needed
    bet_data = bet.model_dump()

    # Auto-generate description based on bet type if not provided
    if not bet.description:
        bet_data["description"] = generate_description(
            bet.bet_type, bet.team, bet.player_name, bet.prop_type
        )

    db_bet = Bet(**bet_data)
    db.add(db_bet)
    await db.commit()
    await db.refresh(db_bet)
    return db_bet


@router.get("", response_model=list[Bet])
async def get_bets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    bet_type: BetType = Query(None, description="Filter by bet type"),
    team: str = Query(None, description="Filter by team"),
    player_name: str = Query(None, description="Filter by player name"),
    prop_type: PropType = Query(None, description="Filter by prop type"),
    result: BetResult = Query(None, description="Filter by bet result"),
    db: AsyncSession = Depends(get_db_session),
):
    """Get all bets with optional filters"""
    query = select(Bet).order_by(desc(Bet.bet_placed_date))

    # Apply filters
    if bet_type:
        query = query.where(Bet.bet_type == bet_type)
    if team:
        query = query.where(Bet.team.ilike(f"%{team}%"))
    if player_name:
        query = query.where(Bet.player_name.ilike(f"%{player_name}%"))
    if prop_type:
        query = query.where(Bet.prop_type == prop_type)
    if result:
        query = query.where(Bet.result == result)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{bet_id}", response_model=Bet)
async def get_bet(bet_id: int, db: AsyncSession = Depends(get_db_session)):
    """Get a specific bet by ID"""
    bet = await db.get(Bet, bet_id)
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")
    return bet


@router.patch("/{bet_id}", response_model=Bet)
async def update_bet(
    bet_id: int, bet_update: BetUpdate, db: AsyncSession = Depends(get_db_session)
):
    """Update a bet (supports both partial PATCH and full PUT updates)"""
    bet = await db.get(Bet, bet_id)
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")

    # Update fields that are not None
    update_data = bet_update.model_dump(exclude_unset=True)

    # Check if any fields that affect description have changed
    description_affecting_fields = ["bet_type", "team", "player_name", "prop_type"]
    description_fields_changed = any(field in update_data for field in description_affecting_fields)

    # Apply updates
    for field, value in update_data.items():
        setattr(bet, field, value)

    # Recalculate description if relevant fields changed and description wasn't explicitly set
    if description_fields_changed and "description" not in update_data:
        bet.description = generate_description(
            bet.bet_type, bet.team, bet.player_name, bet.prop_type
        )

    # Always set updated_at when updating
    bet.updated_at = datetime.now(UTC).replace(tzinfo=None)

    await db.commit()
    await db.refresh(bet)
    return bet


@router.put("/{bet_id}", response_model=Bet)
async def replace_bet(bet_id: int, bet_data: BetCreate, db: AsyncSession = Depends(get_db_session)):
    """Replace a bet entirely (PUT operation)"""
    bet = await db.get(Bet, bet_id)
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")

    # Convert new data to dict
    new_data = bet_data.model_dump()

    # Auto-generate description if not provided
    if not bet_data.description:
        new_data["description"] = generate_description(
            bet_data.bet_type, bet_data.team, bet_data.player_name, bet_data.prop_type
        )

    # Update all fields
    for field, value in new_data.items():
        if hasattr(bet, field):
            setattr(bet, field, value)

    # Always set updated_at when updating
    bet.updated_at = datetime.now(UTC).replace(tzinfo=None)

    await db.commit()
    await db.refresh(bet)
    return bet


@router.delete("/{bet_id}")
async def delete_bet(bet_id: int, db: AsyncSession = Depends(get_db_session)):
    """Delete a bet"""
    bet = await db.get(Bet, bet_id)
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")

    await db.delete(bet)
    await db.commit()
    return {"message": "Bet deleted successfully"}


# Analytics Endpoints
@router.get("/analytics/summary")
async def get_bet_summary(db: AsyncSession = Depends(get_db_session)):
    """Get betting performance summary"""

    # Overall bet stats
    total_bets_result = await db.execute(select(func.count(Bet.id)))
    total_wins_result = await db.execute(
        select(func.count(Bet.id)).where(Bet.result == BetResult.WIN)
    )
    total_losses_result = await db.execute(
        select(func.count(Bet.id)).where(Bet.result == BetResult.LOSS)
    )

    # Player bet stats
    player_total_result = await db.execute(
        select(func.count(Bet.id)).where(Bet.bet_type == BetType.PLAYER_PROP)
    )
    player_wins_result = await db.execute(
        select(func.count(Bet.id)).where(
            (Bet.bet_type == BetType.PLAYER_PROP) & (Bet.result == BetResult.WIN)
        )
    )
    player_losses_result = await db.execute(
        select(func.count(Bet.id)).where(
            (Bet.bet_type == BetType.PLAYER_PROP) & (Bet.result == BetResult.LOSS)
        )
    )

    # Team/other bet stats (everything that's not a player prop)
    team_total_result = await db.execute(
        select(func.count(Bet.id)).where(Bet.bet_type != BetType.PLAYER_PROP)
    )
    team_wins_result = await db.execute(
        select(func.count(Bet.id)).where(
            (Bet.bet_type != BetType.PLAYER_PROP) & (Bet.result == BetResult.WIN)
        )
    )
    team_losses_result = await db.execute(
        select(func.count(Bet.id)).where(
            (Bet.bet_type != BetType.PLAYER_PROP) & (Bet.result == BetResult.LOSS)
        )
    )

    total_bets = total_bets_result.scalar() or 0
    total_wins = total_wins_result.scalar() or 0
    total_losses = total_losses_result.scalar() or 0

    player_total_count = player_total_result.scalar() or 0
    player_win_count = player_wins_result.scalar() or 0
    player_loss_count = player_losses_result.scalar() or 0

    team_total_count = team_total_result.scalar() or 0
    team_win_count = team_wins_result.scalar() or 0
    team_loss_count = team_losses_result.scalar() or 0

    completed_bets = total_wins + total_losses
    win_rate = (total_wins / completed_bets * 100) if completed_bets > 0 else 0

    return {
        "total_bets": total_bets,
        "total_wins": total_wins,
        "total_losses": total_losses,
        "win_rate": round(win_rate, 2),
        "player_bets": {
            "total": player_total_count,
            "wins": player_win_count,
            "losses": player_loss_count,
            "win_rate": round(
                (player_win_count / (player_win_count + player_loss_count) * 100)
                if (player_win_count + player_loss_count) > 0
                else 0,
                2,
            ),
        },
        "team_bets": {
            "total": team_total_count,
            "wins": team_win_count,
            "losses": team_loss_count,
            "win_rate": round(
                (team_win_count / (team_win_count + team_loss_count) * 100)
                if (team_win_count + team_loss_count) > 0
                else 0,
                2,
            ),
        },
    }
