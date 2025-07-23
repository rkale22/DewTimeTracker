from alembic import op

# revision identifiers, used by Alembic.
revision = 'add_draft_submitted_enum'
down_revision = 'e0dd256979c2'
branch_labels = None
depends_on = None

def upgrade():
    op.execute("ALTER TYPE timesheetstatus ADD VALUE IF NOT EXISTS 'draft'")
    op.execute("ALTER TYPE timesheetstatus ADD VALUE IF NOT EXISTS 'submitted'")

def downgrade():
    # No downgrade for enum value addition
    pass 