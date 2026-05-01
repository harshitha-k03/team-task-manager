# Team Task Manager - Railway Deployment Guide

This guide walks you through deploying the Team Task Manager application on Railway.

---

## 📋 Pre-Deployment Checklist

- [ ] MongoDB Atlas account (free tier works)
- [ ] Railway account
- [ ] GitHub account (for connecting to Railway)

---

## � Part 1: Backend Configuration

### 1.1 Environment Variables

The backend uses these environment variables:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Secret key for JWT tokens (min 32 chars) |
| `PORT` | No | Server port (default: 5000) |
| `CLIENT_URL` | Yes | Frontend URL for CORS |
| `NODE_ENV` | No | Set to "production" for production |

### 1.2 Update Server Code (Already Done ✓)

The backend is already configured to use environment variables:

- ✅ `process.env.MONGODB_URI` - MongoDB connection
- ✅ `process.env.JWT_SECRET` - JWT authentication
- ✅ `process.env.PORT` - Server port
- ✅ `process.env.CLIENT_URL` - CORS configuration
- ✅ `process.env.NODE_ENV` - Production mode

### 1.3 Verify package.json Scripts

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  }
}
```

The server package.json already has the `"start"` script ✓

---

## 🎨 Part 2: Frontend Configuration

### 2.1 Environment Variables

The frontend uses this environment variable:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API URL (e.g., https://your-api.railway.app) |

### 2.2 The API Client (Already Configured ✓)

Open `client/src/services/api.js`:

```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  // ...
})
```

This is already using `import.meta.env.VITE_API_URL` ✓

### 2.3 Verify vite.config.js

```javascript
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    },
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || '')
    }
  }
})
```

The vite.config.js already properly configures VITE_API_URL ✓

---

## 🚀 Part 3: Railway Deployment Steps

### Step 1: Prepare MongoDB Atlas

1. Go to https://www.mongodb.com/cloud/atlas
2. Create a free account
3. Create a free cluster (M0)
4. Create a database user:
   - Username: `admin` (or any username)
   - Password: Generate a strong password and save it!
5. Network Access: Allow All IPs (0.0.0.0/0)
6. Get connection string:
   ```
   mongodb+srv://admin:<PASSWORD>@cluster.mongodb.net/teamtaskmanager?retryWrites=true&w=majority
   ```
7. Replace `<PASSWORD>` with your database user password

### Step 2: Deploy Backend

1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your repository
6. Select the `server` folder as root
7. Add Environment Variables:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://admin:<PASSWORD>@cluster.mongodb.net/teamtaskmanager?retryWrites=true&w=majority` |
| `JWT_SECRET` | Generate a strong random string (min 32 chars) |
| `CLIENT_URL` | Your frontend URL (get this after deploying frontend) |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |

8. Click "Deploy"

**Note:** After deployment, Railway will give you a URL like `https://your-project-name.up.railway.app`. Copy this URL for the next step.

### Step 3: Deploy Frontend

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Keep root as `/` (frontend is in `client` folder)
6. Click "Configure" and set:
   - Build Command: `cd client && npm install && npm run build`
   - Output Directory: `client/dist`
7. Add Environment Variables:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://your-backend-project.up.railway.app` |

8. Click "Deploy"

### Step 4: Update Backend CORS

After deploying the frontend, go back to your backend Railway project:

1. Go to Variables
2. Update `CLIENT_URL` to your frontend URL (e.g., `https://your-frontend.up.railway.app`)
3. Redeploy the backend

---

## 📋 Example Environment Variables

### Backend (.env)

```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://admin:your_password@cluster.mongodb.net/teamtaskmanager?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-key-min-32-characters-long!

# Server Configuration
PORT=5000
NODE_ENV=production

# Frontend URL (update after frontend deployment)
CLIENT_URL=https://your-frontend.up.railway.app
```

### Frontend Environment

```bash
VITE_API_URL=https://your-backend.up.railway.app
```

---

## 🔧 Troubleshooting

### Common Issues

#### 1. CORS Errors

**Problem:** Requests fail with CORS error

**Solution:**
1. Go to Railway backend project
2. Update `CLIENT_URL` environment variable to your frontend URL
3. Redeploy backend

#### 2. Database Connection Failed

**Problem:** MongoDB connection error

**Solution:**
1. Check `MONGODB_URI` is correct
2. Verify database user credentials
3. Check Network Access in Atlas (allow all IPs)
4. Check cluster is not paused

#### 3. API Not Found (404)

**Problem:** Frontend can't reach backend

**Solution:**
1. Verify `VITE_API_URL` is set correctly in frontend
2. Make sure backend URL doesn't have trailing slash
3. Check backend deployed successfully

#### 4. Token/Auth Issues

**Problem:** Can't login or auth errors

**Solution:**
1. Verify `JWT_SECRET` is the same in backend
2. Check `NODE_ENV` is set to `production`
3. Clear browser localStorage and try again

#### 5. Build Failed (Frontend)

**Problem:** Frontend build fails on Railway

**Solution:**
1. Make sure build command is correct:
   ```
   cd client && npm install && npm run build
   ```
2. Output directory should be: `client/dist`

#### 6. App Not Loading

**Problem:** White screen or app not loading

**Solution:**
1. Open browser console (F12)
2. Check for errors
3. Verify `VITE_API_URL` is correct
4. Check Network tab for failed requests

### Verify Deployment Checklist

Run through these checks:

- [ ] Backend URL returns JSON response
- [ ] Can register a new user
- [ ] Can login
- [ ] Can create a project
- [ ] Can add tasks
- [ ] Can view dashboard
- [ ] Can drag and drop tasks between columns

---

## 🔗 Integration Flow

```
┌─────────────────┐        ┌─────────────────┐
│   Frontend       │───────▶│   Backend       │
│  (Railway)      │◀───────│  (Railway)      │
│                │  API   │               │
│ VITE_API_URL   │        │ MONGODB_URI   │
│               │        │ JWT_SECRET   │
└─────────────────┘        └─────────────────┘
                                      │
                                      ▼
                               ┌─────────────────┐
                               │  MongoDB Atlas  │
                               │   (Cluster)   │
                               └─────────────────┘
```

---

## 📞 Quick Fix Commands

If something goes wrong, try these:

```bash
# Backend - Restart server
railway up --restart

# View logs
railway logs

# Redeploy
railway deploy
```

---

## ✅ Done!

After completing these steps, your Team Task Manager should be fully functional on Railway.

**Test your deployment:**
1. Visit your frontend URL
2. Register a new account
3. Create a project
4. Add tasks
5. Test drag and drop
6. Test the member dashboard
