from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'normalize_timesheetstatus_enum'
down_revision = 'add_draft_submitted_enum'
branch_labels = None
depends_on = None

def upgrade():
    # 1. Rename the old enum type
    op.execute("ALTER TYPE timesheetstatus RENAME TO timesheetstatus_old;")
    # 2. Create the new enum type
    op.execute("CREATE TYPE timesheetstatus AS ENUM ('draft', 'submitted', 'approved', 'rejected');")
    # 3. Update any old data
    op.execute("UPDATE timesheet SET status = 'submitted' WHERE LOWER(status::text) = 'pending';")
    # 4. Alter the column to use the new type
    op.execute("""ALTER TABLE timesheet ALTER COLUMN status TYPE timesheetstatus USING LOWER(status::text)::timesheetstatus;""")
    # 5. Drop the old enum type
    op.execute("DROP TYPE timesheetstatus_old;")

def downgrade():
    pass 