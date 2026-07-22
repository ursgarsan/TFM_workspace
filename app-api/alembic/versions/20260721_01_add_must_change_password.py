"""add must_change_password to users

Revision ID: 20260721_01
Revises: d07c2a038b75
Create Date: 2026-07-21
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa

revision: str = "20260721_01"
down_revision: str | None = "d07c2a038b75"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    if "users" not in inspector.get_table_names():
        return
    if "must_change_password" in {column["name"] for column in inspector.get_columns("users")}:
        return

    op.add_column(
        "users",
        sa.Column("must_change_password", sa.Boolean(), server_default=sa.false(), nullable=False),
    )


def downgrade() -> None:
    connection = op.get_bind()
    inspector = sa.inspect(connection)
    if "users" not in inspector.get_table_names():
        return
    if "must_change_password" not in {column["name"] for column in inspector.get_columns("users")}:
        return
    op.drop_column("users", "must_change_password")
