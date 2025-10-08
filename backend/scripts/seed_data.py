#!/usr/bin/env python3
"""
Seed script to populate the NBA Bets database with sample data.

This script creates sample bets of all types for testing and development.
"""

import asyncio
from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlmodel import select

from app.database.connection import AsyncSessionLocal
from app.models.bet import (
    Bet,
    BetResult,
    BetType,
    PropType,
)


async def clear_existing_data():
    """Clear all existing bet data"""
    async with AsyncSessionLocal() as session:
        # Clear all bets
        result = await session.execute(select(Bet))
        bets = result.scalars().all()
        for bet in bets:
            await session.delete(bet)

        await session.commit()
        print("✅ Cleared existing betting data")


async def seed_bets():
    """Create sample bets of all types"""

    # Base dates for games and when bets were placed
    game_base_date = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=7)
    bet_placed_base = datetime.now(UTC).replace(tzinfo=None) - timedelta(days=10)

    sample_bets = [
        # Player prop bets
        {
            "bet_type": BetType.PLAYER_PROP,
            "bet_placed_date": bet_placed_base,
            "game_date": game_base_date,
            "team": "LAL",
            "opponent": "GSW",
            "player_name": "LeBron James",
            "prop_type": PropType.POINTS,
            "prop_line": Decimal("25.5"),
            "over_under": "over",
            "description": "LeBron James-points",
            "wager_amount": Decimal("50.00"),
            "odds": -110,
            "result": BetResult.WIN,
            "actual_value": Decimal("28.0"),
            "payout": Decimal("95.45"),
            "notes": "Strong performance against Warriors",
        },
        {
            "bet_type": BetType.PLAYER_PROP,
            "bet_placed_date": bet_placed_base + timedelta(days=1),
            "game_date": game_base_date + timedelta(days=1),
            "team": "LAL",
            "opponent": "PHX",
            "player_name": "LeBron James",
            "prop_type": PropType.ASSISTS,
            "prop_line": Decimal("7.5"),
            "over_under": "under",
            "description": "LeBron James-assists",
            "wager_amount": Decimal("25.00"),
            "odds": +105,
            "result": BetResult.LOSS,
            "actual_value": Decimal("9.0"),
            "payout": Decimal("0.00"),
            "notes": "Had 9 assists, bet lost",
        },
        {
            "bet_type": BetType.PLAYER_PROP,
            "bet_placed_date": bet_placed_base + timedelta(days=2),
            "game_date": game_base_date + timedelta(days=2),
            "team": "GSW",
            "opponent": "LAC",
            "player_name": "Stephen Curry",
            "prop_type": PropType.THREE_POINTERS,
            "prop_line": Decimal("4.5"),
            "over_under": "over",
            "description": "Stephen Curry-threes",
            "wager_amount": Decimal("75.00"),
            "odds": +120,
            "result": BetResult.WIN,
            "actual_value": Decimal("6.0"),
            "payout": Decimal("165.00"),
            "notes": "Hot shooting night - 6 threes",
        },
        {
            "bet_type": BetType.PLAYER_PROP,
            "bet_placed_date": bet_placed_base + timedelta(days=3),
            "game_date": game_base_date + timedelta(days=3),
            "team": "BOS",
            "opponent": "MIA",
            "player_name": "Jayson Tatum",
            "prop_type": PropType.REBOUNDS,
            "prop_line": Decimal("8.5"),
            "over_under": "under",
            "description": "Jayson Tatum-rebounds",
            "wager_amount": Decimal("40.00"),
            "odds": -105,
            "result": BetResult.PUSH,
            "actual_value": Decimal("8.0"),
            "payout": Decimal("40.00"),
            "notes": "Exactly 8 rebounds - push",
        },
        {
            "bet_type": BetType.PLAYER_PROP,
            "bet_placed_date": bet_placed_base + timedelta(days=3),
            "game_date": game_base_date + timedelta(days=4),
            "team": "MIL",
            "opponent": "CHI",
            "player_name": "Giannis Antetokounmpo",
            "prop_type": PropType.POINTS,
            "prop_line": Decimal("30.5"),
            "over_under": "over",
            "description": "Giannis Antetokounmpo-points",
            "wager_amount": Decimal("60.00"),
            "odds": +110,
            "result": BetResult.WIN,
            "actual_value": Decimal("35.0"),
            "payout": Decimal("126.00"),
            "notes": "Dominant performance with 35 points",
        },
        # Team prop bets
        {
            "bet_type": BetType.TEAM_PROP,
            "bet_placed_date": bet_placed_base,
            "game_date": game_base_date,
            "team": "BOS",
            "opponent": "MIA",
            "prop_type": PropType.POINTS,
            "prop_line": Decimal("112.5"),
            "over_under": "over",
            "description": "BOS-points",
            "wager_amount": Decimal("50.00"),
            "odds": -110,
            "result": BetResult.WIN,
            "actual_value": Decimal("118.0"),
            "payout": Decimal("95.45"),
            "notes": "Celtics team points over 112.5 - scored 118",
        },
        {
            "bet_type": BetType.TEAM_PROP,
            "bet_placed_date": bet_placed_base + timedelta(days=1),
            "game_date": game_base_date + timedelta(days=1),
            "team": "LAL",
            "opponent": "GSW",
            "prop_type": PropType.REBOUNDS,
            "prop_line": Decimal("45.5"),
            "over_under": "under",
            "description": "LAL-rebounds",
            "wager_amount": Decimal("75.00"),
            "odds": +105,
            "result": BetResult.LOSS,
            "actual_value": Decimal("48.0"),
            "payout": Decimal("0.00"),
            "notes": "Lakers team rebounds - had 48, over the line",
        },
        # Additional diverse prop bets
        {
            "bet_type": BetType.PLAYER_PROP,
            "bet_placed_date": bet_placed_base + timedelta(days=4),
            "game_date": game_base_date + timedelta(days=4),
            "team": "GSW",
            "opponent": "DEN",
            "player_name": "Draymond Green",
            "prop_type": PropType.STEALS,
            "prop_line": Decimal("1.5"),
            "over_under": "over",
            "description": "Draymond Green-steals",
            "wager_amount": Decimal("30.00"),
            "odds": +140,
            "result": BetResult.WIN,
            "actual_value": Decimal("3.0"),
            "payout": Decimal("72.00"),
            "notes": "Great defensive game - 3 steals",
        },
        {
            "bet_type": BetType.TEAM_PROP,
            "bet_placed_date": bet_placed_base + timedelta(days=5),
            "game_date": game_base_date + timedelta(days=5),
            "team": "MIL",
            "opponent": "BKN",
            "prop_type": PropType.THREE_POINTERS,
            "prop_line": Decimal("12.5"),
            "over_under": "over",
            "description": "MIL-threes",
            "wager_amount": Decimal("45.00"),
            "odds": -120,
            "result": BetResult.PENDING,
            "notes": "Milwaukee team 3-pointers made",
        },
        {
            "bet_type": BetType.SPREAD,
            "bet_placed_date": bet_placed_base + timedelta(days=3),
            "game_date": game_base_date + timedelta(days=3),
            "team": "MIL",
            "opponent": "CHI",
            "description": "MIL-spread",
            "prop_line": Decimal("5.5"),
            "over_under": None,  # Spread doesn't use over/under
            "wager_amount": Decimal("100.00"),
            "odds": -110,
            "result": BetResult.WIN,
            "actual_value": Decimal("8.0"),  # Won by 8 points
            "payout": Decimal("190.91"),
            "notes": "Bucks won by 8 - covered the spread",
        },
    ]

    async with AsyncSessionLocal() as session:
        for bet_data in sample_bets:
            # Remove created_at since it's auto-generated by the model
            bet_dict = bet_data.copy()
            if "created_at" in bet_dict:
                del bet_dict["created_at"]
            bet = Bet(**bet_dict)
            session.add(bet)

        await session.commit()
        print(f"✅ Created {len(sample_bets)} sample bets")


async def print_summary():
    """Print summary of seeded data"""
    async with AsyncSessionLocal() as session:
        # Count all bets
        result = await session.execute(select(Bet))
        all_bets = result.scalars().all()

        # Overall stats
        overall_results = {}
        bet_type_counts = {}
        total_wager = Decimal("0.00")
        total_payout = Decimal("0.00")

        for bet in all_bets:
            # Count by result
            bet_result = bet.result
            overall_results[bet_result] = overall_results.get(bet_result, 0) + 1

            # Count by bet type
            bet_type = bet.bet_type
            bet_type_counts[bet_type] = bet_type_counts.get(bet_type, 0) + 1

            # Track money
            total_wager += bet.wager_amount
            if bet.payout:
                total_payout += bet.payout

        print("\n" + "=" * 50)
        print("🏀 NBA BETS SEED DATA SUMMARY")
        print("=" * 50)

        print("\n📊 OVERALL RESULTS:")
        for result, count in overall_results.items():
            print(f"  {result.upper()}: {count} bets")

        print("\n🎯 BET TYPES:")
        for bet_type, count in bet_type_counts.items():
            print(f"  {bet_type.replace('_', ' ').title()}: {count} bets")

        net_result = total_payout - total_wager
        print("\n💰 FINANCIAL SUMMARY:")
        print(f"  Total Wagered: ${total_wager}")
        print(f"  Total Payouts: ${total_payout}")
        print(
            f"  Net P&L: ${net_result} ({'✅ Profit' if net_result > 0 else '❌ Loss' if net_result < 0 else '➖ Break Even'})"
        )
        print("=" * 50)


async def main():
    """Main seeding function"""
    print("🏀 Starting NBA Bets database seeding...")

    try:
        await clear_existing_data()
        await seed_bets()
        await print_summary()

        print("\n✅ Database seeding completed successfully!")

    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        raise


if __name__ == "__main__":
    asyncio.run(main())
