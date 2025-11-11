# Healthcare Management System - Deployment Guide

This guide covers various deployment options for the Healthcare Management System, from development to production environments.

## 🏗️ Build Process

The project uses a dual-build system for client and server:

```bash
# Build both client and server
pnpm build

# Or build separately
pnpm build:client  # Builds React SPA to dist/spa/
pnpm build:server  # Builds Express server to dist/server/
```

### Build Output Structure
```
dist/
├── spa/                    # Client build (React SPA)
│   ├── index.html
│   ├── assets/
│   └── ...
└── server/                 # Server build (Express)
    ├── node-build.mjs      # Main server entry
    └── ...
```

## 🌐 Deployment Options

### 1. Netlify Deployment (Recommended)

#### Prerequisites
- Netlify account
- Git repository

#### Automatic Deployment
1. Connect your repository to Netlify
2. Configure build settings:
   - **Build command**: `pnpm build`
   - **Publish directory**: `dist/spa`
   - **Functions directory**: `netlify/functions`

#### Environment Variables
Set in Netlify dashboard:
```bash
JWT_SECRET=your_production_jwt_secret_here
PING_MESSAGE=Healthcare System API
```

#### Netlify Configuration
The project includes `netlify.toml`:
```toml
[build]
  command = "pnpm build"
  functions = "netlify/functions"
  publish = "dist/spa"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/api"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### Manual Deployment
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

### 2. Vercel Deployment

#### Prerequisites
- Vercel account
- Git repository

#### Automatic Deployment
1. Import project to Vercel
2. Configure build settings:
   - **Framework Preset**: Other
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist/spa`

#### Environment Variables
Set in Vercel dashboard:
```bash
JWT_SECRET=your_production_jwt_secret_here
PING_MESSAGE=Healthcare System API
```

#### Manual Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### 3. Traditional VPS/Server Deployment

#### Prerequisites
- Linux VPS/server
- Node.js 18+
- PM2 (recommended for process management)
- Nginx (recommended for reverse proxy)

#### Server Setup
```bash
# Clone repository
git clone <your-repo-url>
cd healthcare-management-system

# Install dependencies
pnpm install

# Build application
pnpm build

# Install PM2 globally
npm install -g pm2

# Start application with PM2
pm2 start dist/server/node-build.mjs --name healthcare-system

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve static files
    location / {
        root /path/to/healthcare-management-system/dist/spa;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### SSL with Let's Encrypt
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 4. Docker Deployment

#### Dockerfile
```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install

COPY . .
RUN pnpm build

FROM node:18-alpine AS runner

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["node", "dist/server/node-build.mjs"]
```

#### Docker Compose
```yaml
version: '3.8'

services:
  healthcare-app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - JWT_SECRET=your_jwt_secret_here
      - PING_MESSAGE=Healthcare System API
    volumes:
      - ./healthcare.db:/app/healthcare.db
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - healthcare-app
    restart: unless-stopped
```

#### Deploy with Docker
```bash
# Build and run
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### 5. AWS Deployment

#### Option A: AWS Lambda + CloudFront

1. **Deploy API to Lambda**:
   ```bash
   # Use Serverless Framework
   npm install -g serverless
   
   # Create serverless.yml
   # Deploy
   serverless deploy
   ```

2. **Deploy SPA to S3 + CloudFront**:
   ```bash
   # Upload to S3 bucket
   aws s3 sync dist/spa/ s3://your-bucket-name/
   
   # Configure CloudFront distribution
   # Point to S3 bucket
   ```

#### Option B: AWS EC2

1. **Launch EC2 instance** (Ubuntu 22.04 LTS recommended)
2. **Follow VPS deployment steps** above
3. **Configure security groups** for HTTP/HTTPS access
4. **Use Elastic IP** for static IP address

### 6. Google Cloud Platform Deployment

#### Option A: Cloud Run
```bash
# Build and deploy container
gcloud builds submit --tag gcr.io/[PROJECT-ID]/healthcare-system
gcloud run deploy --image gcr.io/[PROJECT-ID]/healthcare-system --platform managed
```

#### Option B: App Engine
```yaml
# app.yaml
runtime: nodejs18

env_variables:
  JWT_SECRET: "your_jwt_secret_here"
  PING_MESSAGE: "Healthcare System API"

handlers:
- url: /.*
  script: auto
```

```bash
gcloud app deploy
```

## 🔒 Production Security Checklist

### Environment Configuration
- [ ] Set strong JWT_SECRET (32+ characters)
- [ ] Configure HTTPS/SSL certificates
- [ ] Set secure environment variables
- [ ] Remove debug endpoints in production

### Server Security
- [ ] Configure firewall (allow only 80, 443, SSH)
- [ ] Set up fail2ban for SSH protection
- [ ] Regular security updates
- [ ] Monitor server logs

### Application Security
- [ ] Change default admin credentials
- [ ] Review user permissions
- [ ] Enable rate limiting if needed
- [ ] Monitor authentication logs

### Database Security
- [ ] Regular database backups
- [ ] Secure file permissions on healthcare.db
- [ ] Consider encryption at rest
- [ ] Monitor database access

## 📊 Monitoring & Maintenance

### Application Monitoring
```bash
# PM2 monitoring
pm2 monit

# Check application logs
pm2 logs healthcare-system

# Check system resources
htop
df -h
```

### Database Backup
```bash
# Create backup script
#!/bin/bash
BACKUP_DIR="/home/backups"
DATE=$(date +%Y%m%d_%H%M%S)
cp /path/to/healthcare.db $BACKUP_DIR/healthcare_$DATE.db

# Schedule with cron
0 2 * * * /home/scripts/backup-db.sh
```

### Log Rotation
```bash
# Configure logrotate for application logs
sudo nano /etc/logrotate.d/healthcare-system

/var/log/healthcare-system/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        pm2 reload healthcare-system
    endscript
}
```

## 🚨 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database file permissions
ls -la healthcare.db

# Ensure proper ownership
chown www-data:www-data healthcare.db
```

#### Port Already in Use
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

#### Memory Issues
```bash
# Check memory usage
free -h

# Restart application if needed
pm2 restart healthcare-system
```

#### SSL Certificate Issues
```bash
# Renew Let's Encrypt certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

### Health Checks

#### Application Health
```bash
# Check API health
curl https://your-domain.com/api/ping

# Check application status
pm2 status
```

#### System Health
```bash
# Check system resources
top
df -h
free -h

# Check service status
systemctl status nginx
systemctl status pm2-root
```

## 🔄 Updates & Maintenance

### Application Updates
```bash
# Stop application
pm2 stop healthcare-system

# Pull latest changes
git pull origin main

# Install new dependencies
pnpm install

# Rebuild application
pnpm build

# Start application
pm2 start healthcare-system

# Verify deployment
curl https://your-domain.com/api/ping
```

### Database Migrations
- The application handles database schema updates automatically
- Always backup database before updates
- Test migrations in staging environment first

### Rollback Strategy
```bash
# Keep previous version
cp -r current-version backup-version

# If rollback needed
pm2 stop healthcare-system
rm -rf current-version
mv backup-version current-version
pm2 start healthcare-system
```

---

Choose the deployment method that best fits your infrastructure, budget, and technical requirements. For most users, Netlify or Vercel provide the easiest deployment experience with automatic HTTPS and global CDN.
