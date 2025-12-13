# Detailed Setup Guide

This guide will walk you through setting up the 1099 MC Submit application from scratch.

## Step 1: System Requirements

Ensure you have the following installed:

```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version
npm --version

# Check PostgreSQL version (should be 14+)
psql --version
```

If you need to install these:

### macOS
```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node

# Install PostgreSQL
brew install postgresql@14
brew services start postgresql@14
```

### Ubuntu/Debian
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### Windows
- Download Node.js from https://nodejs.org/
- Download PostgreSQL from https://www.postgresql.org/download/windows/

## Step 2: Clone and Install

```bash
# Clone the repository
git clone https://github.com/yourusername/1099mcsubmit.git
cd 1099mcsubmit

# Install all dependencies (backend + frontend)
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

## Step 3: Database Setup

### Create Database

```bash
# Access PostgreSQL
psql postgres

# In PostgreSQL prompt, create database and user
CREATE DATABASE 1099mcsubmit;
CREATE USER 1099user WITH ENCRYPTED PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE 1099mcsubmit TO 1099user;
\q
```

### Configure Database URL

Edit `backend/.env`:
```
DATABASE_URL="postgresql://1099user:yourpassword@localhost:5432/1099mcsubmit?schema=public"
```

### Run Migrations

```bash
cd backend
npx prisma db push
npx prisma generate
```

You should see output confirming tables were created:
- User
- Business
- Recipient
- Form1099

## Step 4: TaxBandits API Setup

### Get Sandbox Credentials

1. Go to https://developer.taxbandits.com/
2. Click "Get Started Free"
3. Create an account
4. Navigate to API Credentials
5. Copy your:
   - User Token
   - Client ID
   - Client Secret

### Configure TaxBandits

Edit `backend/.env`:
```
TAXBANDITS_API_URL="https://testtbs.com/tbsapi"
TAXBANDITS_USER_TOKEN="your-user-token-here"
TAXBANDITS_CLIENT_ID="your-client-id-here"
TAXBANDITS_CLIENT_SECRET="your-client-secret-here"
```

## Step 5: Generate JWT Secret

```bash
# Generate a secure random secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Add to `backend/.env`:
```
JWT_SECRET="your-generated-secret-here"
```

## Step 6: Complete Environment Configuration

Your `backend/.env` should now look like:

```env
# Database
DATABASE_URL="postgresql://1099user:yourpassword@localhost:5432/1099mcsubmit?schema=public"

# JWT Secret
JWT_SECRET="your-generated-secret-here"

# Server
PORT=3001
NODE_ENV=development

# TaxBandits API Configuration
TAXBANDITS_API_URL="https://testtbs.com/tbsapi"
TAXBANDITS_USER_TOKEN="your-user-token-here"
TAXBANDITS_CLIENT_ID="your-client-id-here"
TAXBANDITS_CLIENT_SECRET="your-client-secret-here"
```

## Step 7: Start the Application

### Option 1: Start Everything Together

From the root directory:
```bash
npm run dev
```

This starts both backend (port 3001) and frontend (port 3000).

### Option 2: Start Separately

Terminal 1 - Backend:
```bash
cd backend
npm run dev
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

## Step 8: Verify Installation

1. **Check Backend**
   - Open http://localhost:3001/health
   - Should see: `{"status":"ok","timestamp":"..."}`

2. **Check Frontend**
   - Open http://localhost:3000
   - Should see login page

3. **Check Database**
   ```bash
   cd backend
   npx prisma studio
   ```
   - Opens at http://localhost:5555
   - Should see all tables

## Step 9: Test the Application

### Register a Test Business

1. Go to http://localhost:3000/register
2. Fill in test data:
   ```
   Email: test@example.com
   Password: testpassword123
   Business Name: Test Company LLC
   EIN: 12-3456789
   Contact Name: John Doe
   Phone: 555-123-4567
   Address: 123 Main St
   City: San Francisco
   State: CA
   ZIP: 94102
   ```
3. Click "Create account"
4. Should redirect to dashboard

### Add a Test Recipient

1. Click "Recipients" > "Add Recipient"
2. Fill in test data:
   ```
   Name: Jane Smith
   TIN Type: SSN
   SSN: 123-45-6789
   Address: 456 Oak Ave
   City: Los Angeles
   State: CA
   ZIP: 90001
   Email: jane@example.com
   ```
3. Click "Save"

### Create a Test Form

1. Click "1099 Forms" > "Create Form"
2. Select:
   ```
   Form Type: 1099-NEC
   Tax Year: 2024
   Recipient: Jane Smith
   Non-employee Compensation: 5000.00
   ```
3. Click "Create Draft"
4. **Do NOT submit** in sandbox without reading TaxBandits docs

## Step 10: Database Backup (Optional)

Set up regular backups:

```bash
# Create backup script
cat > backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR
FILENAME="$BACKUP_DIR/backup-$(date +%Y%m%d-%H%M%S).sql"
pg_dump 1099mcsubmit > $FILENAME
echo "Backup created: $FILENAME"
EOF

chmod +x backup-db.sh

# Run backup
./backup-db.sh
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill process
kill -9 <PID>

# Or change port in backend/.env
PORT=3002
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
# macOS
brew services list

# Linux
sudo systemctl status postgresql

# Restart if needed
# macOS
brew services restart postgresql@14

# Linux
sudo systemctl restart postgresql
```

### Prisma Issues

```bash
# Reset Prisma client
cd backend
rm -rf node_modules/.prisma
npx prisma generate

# Reset database (WARNING: deletes all data)
npx prisma db push --force-reset
```

### TaxBandits Authentication Failed

1. Double-check credentials in `.env`
2. Ensure no extra spaces
3. Verify sandbox account is active
4. Check TaxBandits developer dashboard

### Frontend Build Errors

```bash
# Clear node modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

Once everything is running:

1. Read the [README.md](README.md) for usage instructions
2. Review the TaxBandits documentation
3. Test all features in sandbox before production
4. Set up proper error monitoring
5. Configure backups

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment instructions.

## Getting Help

- TaxBandits Support: https://developer.taxbandits.com/support
- PostgreSQL Docs: https://www.postgresql.org/docs/
- Prisma Docs: https://www.prisma.io/docs
- React Docs: https://react.dev

---

Need more help? Create an issue on GitHub.
