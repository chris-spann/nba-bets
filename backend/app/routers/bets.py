from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import func

from app.database.connection import get_db_session
from app.models.bet import (
    BetResult,
    BetUpdate,
    PlayerBet,
    PlayerBetCreate,
    PropType,
    TeamBet,
    TeamBetCreate,
)

router = APIRouter(prefix="/bets", tags=["bets"])


# Player Bet Endpoints
@router.post("/player", response_model=PlayerBet)
async def create_player_bet(bet: PlayerBetCreate, db: AsyncSession = Depends(get_db_session)):
    """Create a new player prop bet"""
    db_bet = PlayerBet(**bet.model_dump())
    db.add(db_bet)
    await db.commit()
    await db.refresh(db_bet)
    return db_bet


@router.get("/player", response_model=list[PlayerBet])
async def get_player_bets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    player_name: str = Query(None, description="Filter by player name"),
    prop_type: PropType = Query(None, description="Filter by prop type"),
    result: BetResult = Query(None, description="Filter by bet result"),
    db: AsyncSession = Depends(get_db_session),
):
    """Get player prop bets with optional filters"""
    query = select(PlayerBet).order_by(desc(PlayerBet.created_at))

    # Apply filters
    if player_name:
        query = query.where(PlayerBet.player_name.ilike(f"%{player_name}%"))
    if prop_type:
        query = query.where(PlayerBet.prop_type == prop_type)
    if result:
        query = query.where(PlayerBet.result == result)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/player/{bet_id}", response_model=PlayerBet)
async def get_player_bet(bet_id: int, db: AsyncSession = Depends(get_db_session)):
    """Get a specific player bet by ID"""
    result = await db.execute(select(PlayerBet).where(PlayerBet.id == bet_id))
    bet = result.scalar_one_or_none()
    if not bet:
        raise HTTPException(status_code=404, detail="Player bet not found")
    return bet


@router.patch("/player/{bet_id}", response_model=PlayerBet)
async def update_player_bet(
    bet_id: int, bet_update: BetUpdate, db: AsyncSession = Depends(get_db_session)
):
    """Update a player bet (typically to set result and actual value)"""
    result = await db.execute(select(PlayerBet).where(PlayerBet.id == bet_id))
    bet = result.scalar_one_or_none()
    if not bet:
        raise HTTPException(status_code=404, detail="Player bet not found")

    # Update fields that are not None
    update_data = bet_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bet, field, value)

    await db.commit()
    await db.refresh(bet)
    return bet


# Team Bet Endpoints
@router.post("/team", response_model=TeamBet)
async def create_team_bet(bet: TeamBetCreate, db: AsyncSession = Depends(get_db_session)):
    """Create a new team prop bet"""
    db_bet = TeamBet(**bet.model_dump())
    db.add(db_bet)
    await db.commit()
    await db.refresh(db_bet)
    return db_bet


@router.get("/team", response_model=list[TeamBet])
async def get_team_bets(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    team: str = Query(None, description="Filter by team"),
    result: BetResult = Query(None, description="Filter by bet result"),
    db: AsyncSession = Depends(get_db_session),
):
    """Get team prop bets with optional filters"""
    query = select(TeamBet).order_by(desc(TeamBet.created_at))

    # Apply filters
    if team:
        query = query.where(TeamBet.team.ilike(f"%{team}%"))
    if result:
        query = query.where(TeamBet.result == result)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/team/{bet_id}", response_model=TeamBet)
async def get_team_bet(bet_id: int, db: AsyncSession = Depends(get_db_session)):
    """Get a specific team bet by ID"""
    result = await db.execute(select(TeamBet).where(TeamBet.id == bet_id))
    bet = result.scalar_one_or_none()
    if not bet:
        raise HTTPException(status_code=404, detail="Team bet not found")
    return bet


@router.patch("/team/{bet_id}", response_model=TeamBet)
async def update_team_bet(
    bet_id: int, bet_update: BetUpdate, db: AsyncSession = Depends(get_db_session)
):
    """Update a team bet (typically to set result and actual value)"""
    result = await db.execute(select(TeamBet).where(TeamBet.id == bet_id))
    bet = result.scalar_one_or_none()
    if not bet:
        raise HTTPException(status_code=404, detail="Team bet not found")

    # Update fields that are not None
    update_data = bet_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(bet, field, value)

    await db.commit()
    await db.refresh(bet)
    return bet


# Analytics Endpoints
@router.get("/analytics/summary")
async def get_bet_summary(db: AsyncSession = Depends(get_db_session)):
    """Get betting performance summary"""

    # Player bet stats
    player_total = await db.execute(select(func.count(PlayerBet.id)))
    player_wins = await db.execute(
        select(func.count(PlayerBet.id)).where(PlayerBet.result == BetResult.WIN)
    )
    player_losses = await db.execute(
        select(func.count(PlayerBet.id)).where(PlayerBet.result == BetResult.LOSS)
    )

    # Team bet stats
    team_total = await db.execute(select(func.count(TeamBet.id)))
    team_wins = await db.execute(
        select(func.count(TeamBet.id)).where(TeamBet.result == BetResult.WIN)
    )
    team_losses = await db.execute(
        select(func.count(TeamBet.id)).where(TeamBet.result == BetResult.LOSS)
    )

    player_total_count = player_total.scalar() or 0
    team_total_count = team_total.scalar() or 0
    total_bets = player_total_count + team_total_count

    player_win_count = player_wins.scalar() or 0
    team_win_count = team_wins.scalar() or 0
    total_wins = player_win_count + team_win_count

    player_loss_count = player_losses.scalar() or 0
    team_loss_count = team_losses.scalar() or 0
    total_losses = player_loss_count + team_loss_count

    win_rate = (total_wins / total_bets * 100) if total_bets > 0 else 0

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
                (player_win_count / player_total_count * 100) if player_total_count > 0 else 0, 2
            ),
        },
        "team_bets": {
            "total": team_total_count,
            "wins": team_win_count,
            "losses": team_loss_count,
            "win_rate": round(
                (team_win_count / team_total_count * 100) if team_total_count > 0 else 0, 2
            ),
        },
    }
