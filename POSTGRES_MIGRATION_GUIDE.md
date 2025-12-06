# PostgreSQL Migration Guide - Render Deployment

## ✅ Configuration Complete

Your project is now configured to work with PostgreSQL on Render!

## What Was Updated

### 1. Database Session Configuration (`server_py/db/session.py`)
- ✅ Added PostgreSQL-specific connection pooling
- ✅ Automatic `postgres://` to `postgresql://` conversion (Render compatibility)
- ✅ Connection pool settings optimized for production
- ✅ Maintains SQLite support for local development

### 2. Environment Variables (`.env.example`)
- ✅ Added DATABASE_URL configuration examples
- ✅ Documented PostgreSQL connection string format

## Render Setup Steps

### Step 1: Get Your PostgreSQL Connection String

1. **In Render Dashboard:**
   - Go to your PostgreSQL database
   - Copy the **Internal Database URL** or **External Database URL**
   - Format: `postgres://user:password@host:port/database`

### Step 2: Set Environment Variable in Render

1. **Go to your Web Service** (not the database)
2. Click **Environment** tab
3. Add environment variable:
   - **Key:** `DATABASE_URL`
   - **Value:** Your PostgreSQL connection string from Step 1
   - Example: `postgres://myuser:mypass@dpg-xxxxx-a.oregon-postgres.render.com/mydb_xxxx`

4. **Important:** Use the **Internal Database URL** if your web service and database are in the same region (faster and free)

### Step 3: Add Other Environment Variables

Make sure these are also set in Render:

```
OPENAI_API_KEY=your_actual_openai_key
NODE_ENV=production
```

### Step 4: Deploy

The app will automatically:
- ✅ Detect PostgreSQL connection string
- ✅ Convert `postgres://` to `postgresql://` (SQLAlchemy requirement)
- ✅ Use optimized connection pooling
- ✅ Create all database tables on first run

## Database Migration

### Option 1: Fresh Database (Recommended for New Deployment)

The app will automatically create all tables when it starts. Just deploy and the tables will be created.

### Option 2: Migrate Existing Data from SQLite

If you want to migrate your local SQLite data to PostgreSQL:

1. **Export data from SQLite:**
```bash
python export_sqlite_data.py
```

2. **Import to PostgreSQL:**
```bash
python import_to_postgres.py
```

(You'll need to create these scripts based on your data)

### Option 3: Use Alembic Migrations

```bash
# Initialize Alembic (if not already done)
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Initial migration"

# Apply migration
alembic upgrade head
```

## Connection String Formats

### Render PostgreSQL (Internal - Recommended)
```
postgres://user:password@dpg-xxxxx-a.oregon-postgres.render.com/database_name
```

### Render PostgreSQL (External)
```
postgres://user:password@dpg-xxxxx-a.oregon-postgres.render.com:5432/database_name
```

### Local PostgreSQL (for testing)
```
postgresql://localhost:5432/mydatabase
```

### Local SQLite (development)
```
sqlite:///./local_dev.db
```

## Connection Pool Settings

The app is configured with these PostgreSQL settings:

- **pool_size:** 10 connections
- **max_overflow:** 20 additional connections
- **pool_recycle:** 3600 seconds (1 hour)
- **pool_pre_ping:** True (verify connections)
- **connect_timeout:** 10 seconds
- **timezone:** UTC

These settings are optimized for Render's free tier and can handle moderate traffic.

## Troubleshooting

### Error: "could not connect to server"

**Solution:** Check that:
1. DATABASE_URL is set correctly in Render environment variables
2. You're using the Internal Database URL (not External)
3. Your web service and database are in the same region

### Error: "password authentication failed"

**Solution:**
1. Copy the DATABASE_URL again from Render (passwords can change)
2. Make sure there are no extra spaces in the environment variable
3. Check that you copied the complete URL including the password

### Error: "SSL connection required"

**Solution:** Add `?sslmode=require` to your DATABASE_URL:
```
postgres://user:pass@host/db?sslmode=require
```

### Error: "too many connections"

**Solution:** The connection pool is already configured. If you still see this:
1. Check if you have multiple instances running
2. Reduce pool_size in `server_py/db/session.py`

### Tables Not Created

**Solution:**
1. Check Render logs for errors
2. Ensure all models are imported in `server_py/main.py`
3. Verify DATABASE_URL is set correctly

## Verifying Connection

### Check Render Logs

```bash
# In Render dashboard, go to Logs tab
# Look for:
"Python backend started successfully on port 5000"
"Database already initialized with X users"
```

### Test Database Connection

Add this to your startup to verify:

```python
# In server_py/main.py startup event
try:
    db = SessionLocal()
    db.execute("SELECT 1")
    print("✅ Database connection successful!")
    db.close()
except Exception as e:
    print(f"❌ Database connection failed: {e}")
```

## Local Development vs Production

### Local Development (SQLite)
```bash
# .env file
DATABASE_URL=sqlite:///./local_dev.db
```

### Production (PostgreSQL on Render)
```bash
# Render environment variable
DATABASE_URL=postgres://user:pass@dpg-xxxxx.render.com/dbname
```

The app automatically detects which database to use based on the DATABASE_URL format.

## Database Backup (PostgreSQL on Render)

### Manual Backup
1. Go to your PostgreSQL database in Render
2. Click **Backups** tab
3. Click **Create Backup**

### Automated Backups
Render automatically backs up your database daily (on paid plans).

## Performance Tips

1. **Use Internal Database URL** - Faster and free bandwidth
2. **Index frequently queried fields** - Add indexes to your models
3. **Use connection pooling** - Already configured
4. **Monitor query performance** - Use Render's metrics
5. **Optimize queries** - Use eager loading for relationships

## Security Best Practices

✅ **Never commit DATABASE_URL** to git
✅ **Use environment variables** for all secrets
✅ **Use Internal Database URL** when possible
✅ **Enable SSL** for external connections
✅ **Rotate passwords** periodically
✅ **Monitor access logs** in Render dashboard

## Next Steps

1. ✅ Set DATABASE_URL in Render environment variables
2. ✅ Deploy your application
3. ✅ Check logs to verify database connection
4. ✅ Test the application
5. ✅ Set up automated backups (if on paid plan)

## Support

If you encounter issues:
1. Check Render logs for detailed error messages
2. Verify all environment variables are set
3. Test database connection from Render shell
4. Check Render status page for outages

---
*Migration Guide Created: December 6, 2025*
*Status: Ready for PostgreSQL deployment ✅*
