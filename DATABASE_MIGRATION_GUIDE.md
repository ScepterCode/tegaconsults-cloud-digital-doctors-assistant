# Database Migration Guide - Fix Schema Issues

## Problem
Your database is missing columns (like `hospital_admin_id`) that your application needs.

## Solution: Run Drizzle Migrations Locally

### Step 1: Get Your Database URL from Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on **dda-database**
3. Click the **Info** tab
4. Copy the **External Database URL**

It will look like:
```
postgresql://dda_user:password@dpg-xxxxx-a.oregon-postgres.render.com/digital_doctors
```

### Step 2: Set Environment Variable Locally

Open your terminal in the project root and run:

**Windows (PowerShell):**
```powershell
$env:DATABASE_URL="paste-your-database-url-here"
```

**Windows (CMD):**
```cmd
set DATABASE_URL=paste-your-database-url-here
```

**Mac/Linux:**
```bash
export DATABASE_URL="paste-your-database-url-here"
```

### Step 3: Run Database Migration

```bash
npm run db:push
```

This command will:
- Read your schema from `shared/schema.ts`
- Compare it with your PostgreSQL database
- Add any missing columns (like `hospital_admin_id`)
- Show you what changes it will make
- Ask for confirmation before applying

Type **'yes'** when it asks to confirm the changes.

### Step 4: Verify the Migration

You should see output like:
```
✓ Pushing schema to database...
✓ Changes applied successfully!
```

### Step 5: Deploy to Render

The `render.yaml` has been updated to automatically run migrations on every deployment.

Commit and push:
```bash
git add render.yaml DATABASE_MIGRATION_GUIDE.md
git commit -m "Update render.yaml to use npm run db:push for migrations"
git push origin main
```

Render will now automatically run migrations on every deployment! 🚀

## Important Notes

### Two Database Systems in Your Project

Your project uses **two different backends**:

1. **Python FastAPI** (`server_py/`) - Uses SQLAlchemy ORM
   - Tables are auto-created when the app starts
   - No manual migration needed for Python backend

2. **Node.js/TypeScript** (`server/`) - Uses Drizzle ORM
   - Requires `npm run db:push` to sync schema
   - This is what the guide above addresses

### Which Backend Are You Using?

Check your `render.yaml`:
- **dda-backend** service runs the Python FastAPI backend
- **dda-frontend** service runs the Node.js frontend + Drizzle migrations

Both services connect to the same PostgreSQL database, so running `npm run db:push` will ensure the schema is correct for both.

## Troubleshooting

### Error: "DATABASE_URL is not set"
Make sure you set the environment variable in Step 2.

### Error: "Connection refused"
Check that your Render database is running and the connection string is correct.

### Error: "Column already exists"
This is fine - it means the column was already added. The migration will skip it.

### Need to Reset Database?
If you want to start fresh, you can drop all tables and re-run migrations:
```bash
npm run db:push
```
Then re-seed your data using the Python scripts in your project root.
