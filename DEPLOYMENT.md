# Deployment Checklist for MaxBuild

This checklist ensures all deployment requirements are met before going live.

## Pre-Deployment Checklist

### Local Development Verification
- [ ] Clone repository: `git clone https://github.com/stewartDMS/MaxBuild.git`
- [ ] Install dependencies: `npm ci --legacy-peer-deps`
- [ ] Build successfully: `npm run build`
- [ ] All environment variables set in `.env`:
  - [ ] `OPENAI_API_KEY`
  - [ ] `DATABASE_URL`
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=3000`
  - [ ] `MAX_FILE_SIZE=10485760`
- [ ] Database migrations run: `npm run prisma:migrate`
- [ ] Prisma client generated: `npm run prisma:generate`
- [ ] Server starts: `npm start`
- [ ] Health check works: `curl http://localhost:3000/api/health`

### Docker Build Verification
- [ ] Development build: `docker build --target development -t maxbuild:dev .`
- [ ] Production build: `docker build --target production -t maxbuild:prod .`
- [ ] Docker Compose dev: `docker-compose up`
- [ ] Docker Compose prod: `docker-compose -f docker-compose.prod.yml up`

### Dependency Verification
- [ ] No peer dependency conflicts with `npm ci --legacy-peer-deps`
- [ ] `.npmrc` contains `legacy-peer-deps=true`
- [ ] All Dockerfile stages use `npm ci --legacy-peer-deps`
- [ ] GitHub Actions workflow uses `npm ci --legacy-peer-deps`

---

## Railway Deployment Checklist

### Initial Setup
- [ ] Create Railway account at [railway.app](https://railway.app)
- [ ] Install Railway CLI (optional): `npm install -g @railway/cli`
- [ ] Connect GitHub repository to Railway

### Railway Configuration
- [ ] **Build Command**: `npm ci --legacy-peer-deps && npm run build`
- [ ] **Start Command**: `npm start`
- [ ] **Health Check Path**: `/api/health`
- [ ] **Health Check Timeout**: 300 seconds

### Railway Services
- [ ] Add PostgreSQL service in Railway dashboard
- [ ] Link PostgreSQL to your application
- [ ] Verify `DATABASE_URL` auto-populated

### Environment Variables in Railway
- [ ] `NODE_ENV=production`
- [ ] `OPENAI_API_KEY=sk-your-key-here`
- [ ] `DATABASE_URL` (auto-set by Railway PostgreSQL)
- [ ] `PORT` (auto-set by Railway, typically)
- [ ] `MAX_FILE_SIZE=10485760`

### Deploy to Railway
- [ ] Push to GitHub main branch (triggers auto-deploy)
  ```bash
  git push origin main
  ```
- [ ] OR deploy via CLI:
  ```bash
  railway up
  ```

### Post-Deployment Verification
- [ ] Build logs show successful `npm ci --legacy-peer-deps`
- [ ] Build logs show successful `npm run build`
- [ ] Application starts successfully
- [ ] Check deployment logs: `railway logs`
- [ ] Health check responds:
  ```bash
  curl https://your-app.railway.app/api/health
  ```
- [ ] Test tender upload endpoint:
  ```bash
  curl -X POST https://your-app.railway.app/api/tenders/upload-mock
  ```

### Database Migrations on Railway
- [ ] Run migrations (one-time setup):
  ```bash
  # Via Railway CLI
  railway run npm run prisma:migrate
  
  # OR add to build command
  npm ci --legacy-peer-deps && npx prisma migrate deploy && npm run build
  ```

---

## Azure Deployment Checklist

### Azure Setup
- [ ] Create Azure account
- [ ] Install Azure CLI: `az --version`
- [ ] Login: `az login`

### GitHub Actions (Already Configured)
- [ ] Verify `.github/workflows/main_maxbuild.yml` exists
- [ ] Workflow uses `npm ci --legacy-peer-deps`
- [ ] Azure credentials set in GitHub Secrets:
  - [ ] `AZUREAPPSERVICE_CLIENTID_*`
  - [ ] `AZUREAPPSERVICE_TENANTID_*`
  - [ ] `AZUREAPPSERVICE_SUBSCRIPTIONID_*`

### Azure Web App Configuration
- [ ] Create Azure Web App: `az webapp create`
- [ ] Set Node.js version: 20.x or higher
- [ ] Configure app settings:
  - [ ] `OPENAI_API_KEY`
  - [ ] `DATABASE_URL`
  - [ ] `NODE_ENV=production`
  - [ ] `WEBSITE_NODE_DEFAULT_VERSION=~20`

### Deploy to Azure
- [ ] Push to main branch triggers GitHub Actions
- [ ] Verify workflow completes successfully
- [ ] Check Azure Web App logs

### Post-Deployment Verification
- [ ] Health check responds:
  ```bash
  curl https://maxbuild.azurewebsites.net/api/health
  ```
- [ ] Test mock endpoint:
  ```bash
  curl -X POST https://maxbuild.azurewebsites.net/api/tenders/upload-mock
  ```

---

## General Cloud Platform Deployment

For AWS, GCP, DigitalOcean, or other platforms:

### Build Configuration
- [ ] Build command: `npm ci --legacy-peer-deps && npm run build`
- [ ] Start command: `npm start`
- [ ] Node.js version: 18.x or higher
- [ ] Health check endpoint: `/api/health`

### Environment Variables
- [ ] `NODE_ENV=production`
- [ ] `PORT=3000` (or platform-provided)
- [ ] `OPENAI_API_KEY`
- [ ] `DATABASE_URL`
- [ ] `MAX_FILE_SIZE=10485760`

### Database Setup
- [ ] PostgreSQL 14+ instance created
- [ ] Database connection tested
- [ ] Migrations applied: `npx prisma migrate deploy`
- [ ] Prisma client generated: `npx prisma generate`

### Security
- [ ] HTTPS/TLS enabled
- [ ] Environment variables secured (not in code)
- [ ] Database credentials secured
- [ ] CORS configured if needed
- [ ] Rate limiting configured (already in code)

---

## Windows Development Checklist

### Before npm install
- [ ] Close all editors (VS Code, WebStorm, etc.)
- [ ] Kill all Node.js processes:
  ```powershell
  Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
  ```
- [ ] Delete node_modules if EPERM errors persist:
  ```powershell
  Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
  ```

### Installation
- [ ] Run in Administrator PowerShell if file locking issues occur
- [ ] Use `npm ci --legacy-peer-deps` (preferred) or `npm install`
- [ ] If EPERM errors occur, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

### Common Windows Issues
- [ ] Enable long paths if needed:
  ```powershell
  New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
    -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
  ```
- [ ] Temporarily disable antivirus during npm install if needed
- [ ] Restart computer if file locks persist

---

## CI/CD Pipeline Checklist

### GitHub Actions
- [ ] Workflow file uses `npm ci --legacy-peer-deps`
- [ ] All secrets configured in repository settings
- [ ] Workflow triggers on push to main branch
- [ ] Build step succeeds
- [ ] Deploy step succeeds

### Continuous Deployment
- [ ] Auto-deploy on git push enabled (Railway/Azure)
- [ ] Rollback strategy defined
- [ ] Monitoring and logging configured

---

## Post-Deployment Monitoring

### Health Checks
- [ ] `/api/health` endpoint responds with 200 OK
- [ ] Response time < 1000ms
- [ ] Database connection confirmed

### Functionality Tests
- [ ] Mock endpoint works:
  ```bash
  curl -X POST https://your-app/api/tenders/upload-mock
  ```
- [ ] Real endpoint works (with valid OpenAI key):
  ```bash
  curl -X POST https://your-app/api/tenders/upload \
    -F "tender=@test.pdf"
  ```
- [ ] List tenders works:
  ```bash
  curl https://your-app/api/tenders
  ```

### Performance
- [ ] Application responds within acceptable time
- [ ] Memory usage is stable
- [ ] CPU usage is reasonable
- [ ] No memory leaks detected

### Logs
- [ ] Application logs are accessible
- [ ] Error logs are being captured
- [ ] Database logs are being captured
- [ ] Log retention policy configured

---

## Troubleshooting Deployment Issues

If deployment fails, check:

1. **Build Logs**: Look for `npm ci --legacy-peer-deps` in logs
2. **Peer Dependencies**: Ensure `--legacy-peer-deps` is used everywhere
3. **Environment Variables**: Verify all required variables are set
4. **Database Connection**: Test DATABASE_URL is correct
5. **OpenAI API Key**: Verify key is valid and has credits
6. **Port Configuration**: Ensure PORT variable is set correctly
7. **Node.js Version**: Verify Node.js 18+ is being used

See [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for detailed solutions.

---

## Quick Test Commands

After deployment, run these commands to verify everything works:

```bash
# Set your deployment URL
export APP_URL="https://your-app-url"

# Health check
curl $APP_URL/api/health

# Test mock endpoint
curl -X POST $APP_URL/api/tenders/upload-mock

# Test with file (if you have a test PDF)
curl -X POST $APP_URL/api/tenders/upload-mock \
  -F "tender=@test.pdf"

# List tenders
curl $APP_URL/api/tenders
```

---

## Emergency Rollback

If deployment breaks production:

### Railway
```bash
# Via dashboard: Select previous deployment and click "Redeploy"
# Via CLI:
railway rollback
```

### Azure
```bash
# Via Azure Portal: Deployment slots → Swap slots
# Via CLI:
az webapp deployment source config-zip --resource-group <group> --name <app> --src <previous.zip>
```

### Docker
```bash
# Revert to previous image
docker tag maxbuild:prod-backup maxbuild:prod
docker-compose -f docker-compose.prod.yml up -d
```

---

## Success Criteria

Deployment is successful when:

- ✅ All checklist items above are completed
- ✅ Health check returns 200 OK
- ✅ Mock endpoint works without configuration
- ✅ Real endpoint works with OpenAI API key
- ✅ Database is connected and migrations applied
- ✅ No build or runtime errors in logs
- ✅ Application responds within acceptable time
- ✅ No memory leaks or performance issues

---

## Related Documentation

- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions
- [README.md](README.md) - Project overview and API documentation
- [QUICKSTART.md](QUICKSTART.md) - Quick start guide
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Detailed setup instructions
