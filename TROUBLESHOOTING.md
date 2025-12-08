# Troubleshooting Guide for MaxBuild

This guide covers common issues and their solutions when deploying or developing MaxBuild.

## Table of Contents
- [npm Installation Issues](#npm-installation-issues)
- [Windows-Specific Issues](#windows-specific-issues)
- [Docker Build Issues](#docker-build-issues)
- [Database Connection Issues](#database-connection-issues)
- [Runtime Issues](#runtime-issues)

---

## npm Installation Issues

### ERESOLVE: Peer Dependency Conflicts

**Symptoms:**
```
npm error ERESOLVE could not resolve
npm error While resolving: @langchain/community@1.0.4
npm error Found: zod@4.1.12
npm error Could not resolve dependency:
npm error peer @browserbasehq/stagehand@"^1.0.0" from @langchain/community@1.0.4
npm error Conflicting peer dependency: zod@3.25.76
```

**Root Cause:**
The project uses `zod@4.1.12`, but `@langchain/community` has a peer dependency on `@browserbasehq/stagehand`, which requires `zod@^3.23.8`. This creates a version conflict.

**Solutions:**

#### Option 1: Use --legacy-peer-deps Flag (Recommended)
This flag bypasses strict peer dependency resolution and is already configured in the project.

```bash
# For clean installs (recommended for CI/CD)
npm ci --legacy-peer-deps

# For regular installs (works with .npmrc config)
npm install
```

**Why this works:** The `.npmrc` file in the project root already contains `legacy-peer-deps=true`, so `npm install` will use this flag automatically. However, `npm ci` requires the flag to be passed explicitly.

#### Option 2: Downgrade zod to v3 (Alternative)
If the legacy-peer-deps approach doesn't work for your deployment:

```bash
# Update package.json
npm install zod@^3.23.8

# Rebuild
npm run build
```

**Note:** The project has been tested with zod v4, and Option 1 is preferred to maintain compatibility.

#### Option 3: Use --force Flag (Not Recommended)
```bash
npm install --force
```

**Warning:** This can lead to broken dependencies and unexpected behavior. Use only as a last resort.

---

## Windows-Specific Issues

### EPERM: File Locking Errors

**Symptoms:**
```
Error: EPERM: operation not permitted, unlink 'node_modules\@img\sharp-win32-x64\lib\sharp.node'
Error: EPERM: operation not permitted, unlink 'node_modules\canvas\build\Release\canvas.node'
Error: EPERM: operation not permitted, unlink 'node_modules\@napi-rs\canvas-win32-x64-msvc\skia.win32-x64-msvc.node'
```

**Root Cause:**
Windows locks `.node` binary files when they're in use by Node.js processes, editors, or antivirus software. This prevents npm from updating or removing these files.

**Solutions:**

#### Solution 1: Close All Related Processes
1. **Close all code editors** (VS Code, WebStorm, Sublime, etc.)
   ```powershell
   # PowerShell: Check for open VS Code instances
   Get-Process | Where-Object {$_.ProcessName -like "*code*"}
   ```

2. **Kill all Node.js processes**
   ```powershell
   # PowerShell: Stop all Node processes
   Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force
   
   # Or use Task Manager:
   # Ctrl+Shift+Esc → Find "Node.js" processes → End Task
   ```

3. **Retry the installation**
   ```bash
   npm ci --legacy-peer-deps
   ```

#### Solution 2: Delete node_modules and Retry
```powershell
# PowerShell: Force delete node_modules
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue

# Then retry install
npm ci --legacy-peer-deps
```

If deletion fails, try:
```powershell
# Use robocopy to force delete (Windows)
mkdir empty_temp
robocopy empty_temp node_modules /MIR
rmdir empty_temp
rmdir node_modules

# Then retry install
npm ci --legacy-peer-deps
```

#### Solution 3: Run as Administrator
Right-click Command Prompt or PowerShell and select "Run as Administrator":

```powershell
# Then run your npm commands
npm ci --legacy-peer-deps
```

#### Solution 4: Temporarily Disable Antivirus
Antivirus software can lock files during scans. Temporarily disable real-time protection:
1. Open Windows Security
2. Go to "Virus & threat protection"
3. Manage settings → Turn off "Real-time protection"
4. Run npm commands
5. **Re-enable protection after installation**

#### Solution 5: Restart Your Computer
Sometimes Windows file locks persist. A full restart clears all locks:

```powershell
# After restart
cd C:\path\to\MaxBuild
npm ci --legacy-peer-deps
```

#### Solution 6: Use npm clean-install Alternative
```bash
# Clear npm cache
npm cache clean --force

# Remove package-lock.json
rm package-lock.json

# Reinstall
npm install --legacy-peer-deps
```

### Windows Path Length Issues

**Symptoms:**
```
Error: ENAMETOOLONG: name too long
```

**Solution:**
Enable long path support in Windows:

```powershell
# Run in Administrator PowerShell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" `
  -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force

# Or via Git config
git config --system core.longpaths true
```

---

## Docker Build Issues

### Docker Build Fails with Peer Dependency Errors

**Symptoms:**
```
ERROR [build 5/6] RUN npm ci
npm error ERESOLVE could not resolve
```

**Solution:**
Ensure your Dockerfile uses `--legacy-peer-deps`:

```dockerfile
# Development Stage
RUN npm ci --legacy-peer-deps

# Build Stage
RUN npm ci --legacy-peer-deps

# Production Stage
RUN npm ci --only=production --legacy-peer-deps
```

The Dockerfile in this project has been updated to include these flags.

### Docker Build Caching Issues

**Solution:**
```bash
# Clear Docker build cache
docker builder prune -a

# Rebuild without cache
docker build --no-cache -t maxbuild .
```

### Docker on Windows with WSL2

If you're using Docker Desktop with WSL2 and encounter issues:

1. **Restart Docker Desktop**
2. **Clear WSL2 cache:**
   ```powershell
   wsl --shutdown
   # Wait 10 seconds, then restart Docker Desktop
   ```

3. **Move project to WSL2 filesystem** (better performance):
   ```bash
   # In WSL2 terminal
   cd ~
   git clone https://github.com/stewartDMS/MaxBuild.git
   cd MaxBuild
   docker-compose up
   ```

---

## Database Connection Issues

### Cannot Connect to PostgreSQL

**Symptoms:**
```
Error: P1001: Can't reach database server at `localhost:5432`
```

**Solutions:**

#### Check PostgreSQL is Running
```bash
# Linux/macOS
pg_isready -h localhost -p 5432

# Windows
pg_isready -h localhost -p 5432

# Or check with Docker
docker ps | grep postgres
```

#### Verify DATABASE_URL
```bash
# Check .env file
cat .env | grep DATABASE_URL

# Test connection
psql $DATABASE_URL
```

#### Start PostgreSQL with Docker
```bash
docker run --name maxbuild-postgres \
  -e POSTGRES_USER=maxbuild \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=maxbuild \
  -p 5432:5432 \
  -d postgres:15
```

### Prisma Client Not Generated

**Symptoms:**
```
Error: @prisma/client did not initialize yet
```

**Solution:**
```bash
npm run prisma:generate
```

---

## Runtime Issues

### OpenAI API Authentication Failed

**Symptoms:**
```
Error: OpenAI API authentication failed
```

**Solutions:**
1. **Check API key in .env:**
   ```bash
   cat .env | grep OPENAI_API_KEY
   ```

2. **Verify key is valid:**
   - Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
   - Check the key exists and has no restrictions

3. **Ensure no extra spaces:**
   ```bash
   # .env should look like:
   OPENAI_API_KEY=sk-xxxxx
   # NOT:
   OPENAI_API_KEY = sk-xxxxx
   # NOT:
   OPENAI_API_KEY="sk-xxxxx"
   ```

### Port Already in Use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**

#### Find and Kill Process Using Port
```bash
# Linux/macOS
lsof -ti:3000 | xargs kill -9

# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force

# Windows Command Prompt
FOR /F "tokens=5" %P IN ('netstat -ano ^| findstr :3000') DO taskkill /PID %P /F
```

#### Change Port in .env
```bash
echo "PORT=3001" >> .env
npm run dev
```

### File Upload Fails

**Symptoms:**
```
Error: ENOENT: no such file or directory, open 'uploads/...'
```

**Solution:**
```bash
# Create uploads directory
mkdir -p uploads
chmod 755 uploads

# Restart server
npm run dev
```

---

## Railway/Cloud Deployment Issues

### Railway Build Fails

**Ensure Railway uses the correct build command:**

1. **Set Build Command:**
   ```
   npm ci --legacy-peer-deps && npm run build
   ```

2. **Set Start Command:**
   ```
   npm start
   ```

3. **Environment Variables:**
   - Set `NODE_ENV=production`
   - Set `DATABASE_URL` to Railway PostgreSQL URL
   - Set `OPENAI_API_KEY`

4. **Recommended Railway Configuration:**

   Create a `railway.json` (optional) or use Railway dashboard settings:
   ```json
   {
     "$schema": "https://railway.app/railway.schema.json",
     "build": {
       "builder": "NIXPACKS",
       "buildCommand": "npm ci --legacy-peer-deps && npm run build"
     },
     "deploy": {
       "startCommand": "npm start",
       "healthcheckPath": "/api/health",
       "healthcheckTimeout": 300
     }
   }
   ```

5. **Railway + PostgreSQL Setup:**
   - Add a PostgreSQL service in Railway
   - Link it to your application
   - Railway automatically provides `DATABASE_URL` variable
   - No manual configuration needed!

6. **Common Railway Issues:**

   **Build timeout:**
   - Railway has a 10-minute build timeout by default
   - The `npm ci --legacy-peer-deps` should complete within this time
   - If it times out, check Railway's builder logs for network issues

   **Prisma Client not generated:**
   - Ensure `npm run build` includes Prisma generation
   - Or add postinstall script in package.json:
     ```json
     "scripts": {
       "postinstall": "prisma generate"
     }
     ```

   **Environment variables not set:**
   - Check all required variables are set in Railway dashboard
   - Variables: `OPENAI_API_KEY`, `DATABASE_URL`, `NODE_ENV`, `PORT`
   - Railway automatically sets `PORT` - don't override unless needed

### Deploying to Railway - Step by Step

1. **Install Railway CLI** (optional):
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Deploy from GitHub** (recommended):
   - Connect your GitHub repository to Railway
   - Railway automatically detects Node.js project
   - Set build command: `npm ci --legacy-peer-deps && npm run build`
   - Set start command: `npm start`

3. **Deploy from CLI**:
   ```bash
   # In project directory
   railway init
   railway up
   ```

4. **Add PostgreSQL**:
   ```bash
   # Via CLI
   railway add postgresql
   
   # Or via dashboard: Add Service → PostgreSQL
   ```

5. **Set Environment Variables**:
   ```bash
   # Via CLI
   railway variables set OPENAI_API_KEY=sk-your-key
   railway variables set NODE_ENV=production
   
   # Or via dashboard: Variables tab
   ```

6. **Deploy**:
   ```bash
   # Railway auto-deploys on git push if connected to GitHub
   git push origin main
   
   # Or manually via CLI
   railway up
   ```

7. **View Logs**:
   ```bash
   railway logs
   ```

8. **Test Deployment**:
   ```bash
   # Get your Railway URL from dashboard
   curl https://your-app.railway.app/api/health
   ```

### Azure/Other Cloud Platforms

Update build commands in deployment configuration to use:
```bash
npm ci --legacy-peer-deps && npm run build
```

**Azure Web App:**
- Update `.github/workflows/main_maxbuild.yml` (already configured in this project)
- Ensure the workflow uses `npm ci --legacy-peer-deps`

**Heroku:**
Create a `Procfile`:
```
web: npm start
```

Add build script to `package.json`:
```json
{
  "scripts": {
    "heroku-postbuild": "npm run build"
  }
}
```

Set Heroku config:
```bash
heroku config:set NPM_CONFIG_LEGACY_PEER_DEPS=true
```

**Vercel/Netlify:**
These platforms are designed for frontend apps. For the MaxBuild backend API:
- Use Railway, Azure, or AWS instead
- Or containerize with Docker and deploy to any platform

---

## CI/CD Pipeline Issues

### GitHub Actions Fails

The workflow has been updated to use `npm ci --legacy-peer-deps`. If it still fails:

1. **Check workflow file** (`.github/workflows/main_maxbuild.yml`):
   ```yaml
   - name: npm install, build, and test
     run: |
       npm ci --legacy-peer-deps
       npm run build --if-present
   ```

2. **Clear GitHub Actions cache:**
   - Go to Actions tab
   - Click "Caches" in left sidebar
   - Delete all caches
   - Re-run workflow

---

## Quick Troubleshooting Checklist

Before opening an issue, verify:

- [ ] Node.js version 18+ installed (`node --version`)
- [ ] Using `npm ci --legacy-peer-deps` or `npm install` (not `npm ci` alone)
- [ ] All Node.js processes stopped on Windows
- [ ] `.env` file exists and has required variables
- [ ] PostgreSQL is running (for real endpoint)
- [ ] `node_modules` deleted and reinstalled if issues persist
- [ ] Docker build includes `--legacy-peer-deps` flag
- [ ] No antivirus blocking file operations (Windows)

---

## Getting Help

If none of these solutions work:

1. **Check existing issues:** [GitHub Issues](https://github.com/stewartDMS/MaxBuild/issues)
2. **Create a new issue** with:
   - Operating system and version
   - Node.js version (`node --version`)
   - npm version (`npm --version`)
   - Full error message
   - Steps to reproduce
   - What you've already tried

---

## Related Documentation

- [QUICKSTART.md](QUICKSTART.md) - Quick start guide
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Detailed setup instructions
- [README.md](README.md) - Project overview and API documentation
