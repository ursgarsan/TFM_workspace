"""existing database schema baseline

Revision ID: d07c2a038b75
Revises:

This no-op revision restores the migration identifier already recorded by
existing installations. The schema it represents was originally created
before migration files were committed to this repository.
"""

from collections.abc import Sequence

revision: str = "d07c2a038b75"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
