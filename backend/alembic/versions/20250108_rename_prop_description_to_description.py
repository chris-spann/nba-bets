"""rename prop_description to description

Revision ID: 20250108_rename_prop_description
Revises: 013bb0e20ef8
Create Date: 2025-01-08 19:59:00.000000

"""

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "20250108_rename_prop_description"
down_revision = "013bb0e20ef8"
branch_labels = None
depends_on = None


def upgrade():
    """Rename prop_description column to description"""
    # Check if prop_description column exists before renaming
    connection = op.get_bind()
    result = connection.execute(
        sa.text("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'bets' AND column_name = 'prop_description'
            )
        """)
    ).scalar()

    # Only rename if prop_description exists
    if result:
        op.alter_column("bets", "prop_description", new_column_name="description")


def downgrade():
    """Rename description column back to prop_description"""
    # Check if description column exists before renaming back
    connection = op.get_bind()
    result = connection.execute(
        sa.text("""
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'bets' AND column_name = 'description'
            )
        """)
    ).scalar()

    # Only rename if description exists
    if result:
        op.alter_column("bets", "description", new_column_name="prop_description")
