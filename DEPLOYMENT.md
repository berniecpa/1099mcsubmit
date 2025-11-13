# Production Deployment Guide

This guide covers deploying the 1099 MC Submit application to production.

## Pre-Deployment Checklist

- [ ] All features tested in development
- [ ] TaxBandits sandbox testing completed
- [ ] Production TaxBandits account created
- [ ] Database backup strategy in place
- [ ] SSL certificates configured
- [ ] Environment variables documented
- [ ] Error monitoring setup
- [ ] Security audit completed

## Deployment Options

### Option 1: Railway (Recommended for Beginners)

Railway provides easy deployment for full-stack apps.

#### Backend Deployment

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Create New Project**
   ```bash
   cd backend
   railway init
   ```

4. **Add PostgreSQL**
   ```bash
   railway add postgresql
   ```

5. **Set Environment Variables**
   ```bash
   railway variables set JWT_SECRET=your-production-secret
   railway variables set NODE_ENV=production
   railway variables set TAXBANDITS_API_URL=https://api.taxbandits.com
   railway variables set TAXBANDITS_USER_TOKEN=your-prod-token
   railway variables set TAXBANDITS_CLIENT_ID=your-prod-client-id
   railway variables set TAXBANDITS_CLIENT_SECRET=your-prod-secret
   ```

6. **Deploy**
   ```bash
   railway up
   ```

#### Frontend Deployment (Vercel)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel
   ```

3. **Set Environment Variable**
   - In Vercel dashboard, set `VITE_API_URL` to your Railway backend URL

### Option 2: AWS (For Scalability)

#### Backend on AWS Elastic Beanstalk

1. **Install EB CLI**
   ```bash
   pip install awsebcli
   ```

2. **Initialize EB**
   ```bash
   cd backend
   eb init -p node.js-18 1099mcsubmit-api
   ```

3. **Create Environment**
   ```bash
   eb create production
   ```

4. **Set Environment Variables**
   ```bash
   eb setenv JWT_SECRET=your-secret \
            NODE_ENV=production \
            DATABASE_URL=your-rds-url \
            TAXBANDITS_API_URL=https://api.taxbandits.com \
            TAXBANDITS_USER_TOKEN=your-token \
            TAXBANDITS_CLIENT_ID=your-client-id \
            TAXBANDITS_CLIENT_SECRET=your-secret
   ```

5. **Deploy**
   ```bash
   eb deploy
   ```

#### Database on AWS RDS

1. **Create PostgreSQL RDS Instance**
   - Engine: PostgreSQL 14+
   - Instance class: db.t3.micro (can scale up)
   - Storage: 20GB SSD (can auto-scale)
   - Enable automated backups

2. **Configure Security Group**
   - Allow inbound PostgreSQL (port 5432) from EB security group

3. **Run Migrations**
   ```bash
   # SSH into EB instance or run locally with production DB URL
   npx prisma migrate deploy
   ```

#### Frontend on AWS CloudFront + S3

1. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

2. **Create S3 Bucket**
   ```bash
   aws s3 mb s3://1099mcsubmit-frontend
   ```

3. **Upload Build**
   ```bash
   aws s3 sync dist/ s3://1099mcsubmit-frontend --delete
   ```

4. **Create CloudFront Distribution**
   - Origin: Your S3 bucket
   - Enable HTTPS only
   - Set default root object: index.html

### Option 3: DigitalOcean (Good Balance)

#### App Platform Deployment

1. **Create Account** at digitalocean.com

2. **Create App**
   - Connect GitHub repository
   - Select branch

3. **Configure Backend**
   - Type: Web Service
   - Build Command: `cd backend && npm install && npm run build`
   - Run Command: `cd backend && npm start`
   - Environment Variables: (same as above)

4. **Add PostgreSQL Database**
   - In Resources tab, add PostgreSQL
   - 1GB RAM minimum

5. **Configure Frontend**
   - Type: Static Site
   - Build Command: `cd frontend && npm install && npm run build`
   - Output Directory: `frontend/dist`

6. **Deploy**
   - Click "Deploy"

## Database Migration

### From Development to Production

1. **Export Schema**
   ```bash
   cd backend
   npx prisma migrate dev --create-only
   ```

2. **Review Migration**
   - Check generated SQL in `prisma/migrations`

3. **Deploy to Production**
   ```bash
   npx prisma migrate deploy
   ```

### Ongoing Migrations

```bash
# Create new migration
npx prisma migrate dev --name add_new_feature

# Deploy to production
npx prisma migrate deploy
```

## Environment Variables

### Production Backend (.env)

```env
# Database (from hosting provider)
DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"

# JWT Secret (generate new for production)
JWT_SECRET="use-a-very-long-random-secret-here-64-characters-minimum"

# Server
PORT=3001
NODE_ENV=production

# TaxBandits Production API
TAXBANDITS_API_URL="https://api.taxbandits.com"
TAXBANDITS_USER_TOKEN="production-user-token"
TAXBANDITS_CLIENT_ID="production-client-id"
TAXBANDITS_CLIENT_SECRET="production-client-secret"

# Optional: Error Tracking
SENTRY_DSN="your-sentry-dsn"
```

### Production Frontend

Update API URL in frontend if needed:
```typescript
// frontend/src/lib/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  // ...
});
```

Set in deployment platform:
```
VITE_API_URL=https://your-backend-url.com/api
```

## Security Configuration

### 1. Enable HTTPS

Most platforms provide free SSL. If not:
```bash
# Let's Encrypt with Certbot
sudo certbot --nginx -d yourdomain.com
```

### 2. Configure CORS

Update `backend/src/index.ts`:
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://yourdomain.com',
  credentials: true
}));
```

### 3. Add Rate Limiting

```bash
cd backend
npm install express-rate-limit
```

Update `backend/src/index.ts`:
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 4. Secure Headers

```bash
cd backend
npm install helmet
```

```typescript
import helmet from 'helmet';
app.use(helmet());
```

## Monitoring & Logging

### Error Tracking with Sentry

1. **Install Sentry**
   ```bash
   cd backend
   npm install @sentry/node
   ```

2. **Configure**
   ```typescript
   // backend/src/index.ts
   import * as Sentry from '@sentry/node';

   if (process.env.NODE_ENV === 'production') {
     Sentry.init({
       dsn: process.env.SENTRY_DSN,
       tracesSampleRate: 1.0,
     });
   }
   ```

### Application Performance Monitoring

Consider adding:
- New Relic
- DataDog
- AWS CloudWatch

### Database Monitoring

- Enable slow query logs
- Set up automated backups
- Configure alerts for high CPU/memory

## Backup Strategy

### Automated Database Backups

#### Railway/Heroku
- Enable automated backups in dashboard
- Schedule: Daily at 2 AM
- Retention: 7 days

#### AWS RDS
```bash
# Enable automated backups
aws rds modify-db-instance \
  --db-instance-identifier your-instance \
  --backup-retention-period 7 \
  --preferred-backup-window 02:00-03:00
```

#### Manual Backup Script

```bash
#!/bin/bash
# backup-production.sh

DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="./backups"
mkdir -p $BACKUP_DIR

# Database backup
pg_dump $DATABASE_URL > "$BACKUP_DIR/db-$DATE.sql"

# Compress
gzip "$BACKUP_DIR/db-$DATE.sql"

# Upload to S3 (optional)
aws s3 cp "$BACKUP_DIR/db-$DATE.sql.gz" s3://your-backup-bucket/

# Clean old backups (keep last 30 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: db-$DATE.sql.gz"
```

Schedule with cron:
```bash
# Run daily at 2 AM
0 2 * * * /path/to/backup-production.sh
```

## Scaling Considerations

### Horizontal Scaling

- Use load balancer (AWS ALB, Nginx)
- Run multiple backend instances
- Use connection pooling for database

### Database Scaling

- Enable read replicas
- Implement caching (Redis)
- Optimize queries with indexes

### CDN for Frontend

- CloudFlare
- AWS CloudFront
- Vercel Edge Network

## TaxBandits Production Checklist

- [ ] Production account created and verified
- [ ] Production credentials obtained
- [ ] API rate limits understood
- [ ] Error handling tested
- [ ] Webhook endpoints configured (if using)
- [ ] TIN matching service tested
- [ ] Submission workflows tested end-to-end

## Post-Deployment

### 1. Smoke Tests

```bash
# Health check
curl https://your-api.com/health

# Test authentication
curl -X POST https://your-api.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

### 2. Monitor Initial Traffic

- Check error rates
- Monitor response times
- Verify database connections

### 3. Set Up Alerts

- Error rate > 5%
- Response time > 2s
- Database connections > 80%
- Disk space > 90%

## Rollback Plan

### Quick Rollback

#### Railway/Vercel
```bash
railway rollback
vercel rollback
```

#### AWS EB
```bash
eb deploy --version previous-version
```

### Database Rollback

```bash
# Restore from backup
pg_restore -d $DATABASE_URL backup.sql

# Or rollback migration
npx prisma migrate resolve --rolled-back migration_name
```

## Maintenance Windows

Schedule regular maintenance:
- Weekly: Review logs and metrics
- Monthly: Update dependencies
- Quarterly: Security audit
- Yearly: Infrastructure review

## Cost Optimization

### Railway (Estimated)
- Backend: $5-10/month
- Database: $10/month
- Total: ~$20/month

### AWS (Estimated)
- EC2 t3.micro: $10/month
- RDS t3.micro: $15/month
- S3 + CloudFront: $5/month
- Total: ~$30/month

### DigitalOcean (Estimated)
- App Platform: $12/month
- Database: $15/month
- Total: ~$27/month

## Support & Maintenance

- Document all deployment procedures
- Keep dependency versions tracked
- Maintain changelog
- Regular security updates

---

Need help with deployment? Create an issue or consult the hosting provider's documentation.
