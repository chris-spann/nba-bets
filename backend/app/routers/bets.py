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


# Unified Bet Endpoints
@router.post("", response_model=Bet)
async def create_bet(bet: BetCreate, db: AsyncSession = Depends(get_db_session)):
    """Create a new bet (player prop, team prop, or any other bet type)"""
    # Auto-generate prop_description for player props if not provided
    bet_data = bet.model_dump()
    if bet.bet_type == BetType.PLAYER_PROP and not bet.prop_description and bet.prop_type:
        bet_data["prop_description"] = (
            f"{bet.player_name} {bet.prop_type.value.replace('_', ' ').title()}"
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
    """Update a bet (typically to set result and actual value)"""
    bet = await db.get(Bet, bet_id)
    if not bet:
        raise HTTPException(status_code=404, detail="Bet not found")

    # Update fields that are not None
    update_data = bet_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bet, field, value)

    # Always set updated_at when updating
    bet.updated_at = datetime.now(UTC).replace(tzinfo=None)

    await db.commit()
    await db.refresh(bet)
    return bet


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
