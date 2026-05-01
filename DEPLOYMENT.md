# 🚀 Railway Deployment Guide - Team Task Manager

## 📋 Overview

This guide covers deploying the Team Task Manager application (React + Node.js + Express + MongoDB) on Railway.

---

## Part 1: Backend Deployment Preparation

### 1.1 Environment Configuration ✅ ALREADY DONE
The backend is configured to use environment variables:
- `MONGODB_URI` - MongoDB Atlas connection string
- `JWT_SECRET` - JWT signing secret
- `PORT` - Server port (defaults to 5000)
- `CLIENT_URL` - Whitelisted frontend URL for CORS
- `NODE_ENV` - Environment mode

### 1.2 Verify package.json Scripts ✅ ALREADY DONE
```json
"scripts": {
  "start": "node index.js",
  "dev": "nodemon index.js"
}
```

### 1.3 Deploy Backend to Railway

**Steps:**
1. Go to [Railway Dashboard](https://railway.app)
2. Click "New Project" → "Deploy a backend service"
3. Connect your GitHub repository
4. Set root directory to `server`
5. Add environment variables:
   ```
   MONGODB_URI=mongodb+srv://...
   JWT_SECRET=your-super-secret-key
   JWT_EXPIRE=7d
   CLIENT_URL=https://yourfrontend.up.railway.app
   NODE_ENV=production
   ```
6. Set start command: `node index.js`
7. Click "Deploy"

---

## Part 2: Frontend Deployment Preparation

### 2.1 Create .env file for Frontend
Create `client/.env` file (do NOT commit to Git):
```
VITE_API_URL=https://your-backend.up.railway.app/api
```

### 2.2 Verify API Configuration ✅ ALREADY DONE
The client already uses:
```javascript
baseURL: import.meta.env.VITE_API_URL || ''
```

### 2.3 Deploy Frontend to Railway

**Steps:**
1. Go to [Railway Dashboard](https://railway.app)
2. Click "New Project" → "Deploy a frontend service"
3. Connect your GitHub repository
4. Set root directory to `client`
5. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.up.railway.app/api
   ```
6. Set build command: `npm run build`
7. Set output directory: `dist`
8. Click "Deploy"

---

## 📦 Example Environment Variables

### Backend (.env)
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
JWT_EXPIRE=7d
CLIENT_URL=https://teamtaskmanager.up.railway.app
NODE_ENV=production
PORT=5000
```

### Frontend (.env)
```
VITE_API_URL=https://teamtaskmanager-api.up.railway.app/api
```

---

## 🔗 Integration Checklist

After deployment, verify:

- [ ] Backend is running at `https://your-backend.up.railway.app`
- [ ] Frontend is running at `https://your-frontend.up.railway.app`
- [ ] CORS is configured correctly (CLIENT_URL matches frontend URL)
- [ ] VITE_API_URL points to backend API

### Testing Commands:
```bash
# Test backend health
curl https://your-backend.up.railway.app/

# Test login
curl -X POST https://your-backend.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

## 🛠️ Troubleshooting Guide

### Common Issues:

#### 1. CORS Errors
**Symptom:** Request blocked by CORS policy
**Fix:** Update `CLIENT_URL` in backend environment variables to match your frontend URL exactly

#### 2. 404 Not Found
**Symptom:** API routes return 404
**Fix:** Ensure `VITE_API_URL` includes `/api` suffix (e.g., `https://.../api`)

#### 3. MongoDB Connection Failed
**Symptom:** Cannot connect to database
**Fix:** 
- Verify `MONGODB_URI` is correct
- Check Atlas network access settings (allow access from anywhere: 0.0.0.0/0)

#### 4. JWT Errors
**Symptom:** Authentication not working
**Fix:** Ensure `JWT_SECRET` is set and matches in backend config

#### 5. Build Failed (Frontend)
**Symptom:** Railway build fails
**Fix:** 
- Ensure node version is 18+ in package.json
- Add engines field: `"engines": {"node": ">=18.0.0"}`

---

## 📱 Testing End-to-End

After deployment, test these features:

1. **Auth:**
   - [ ] Sign up new user
   - [ ] Login with existing user
   
2. **Projects:**
   - [ ] Create new project
   - [ ] View projects list
   - [ ] Add members to project

3. **Tasks:**
   - [ ] Create new task
   - [ ] Assign task to member
   - [ ] Update task status
   - [ ] View "my-tasks" dashboard

4. **Roles:**
   - [ ] Admin can create/manage projects
   - [ ] Member can view assigned tasks
   - [ ] Member can update their task status

---

## 📝 Quick Deploy Commands (Railway CLI)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy backend
cd server
railway init
railway up

# Deploy frontend  
cd client
railway init
railway up

# Check status
railway status

# View logs
railway logs
```

---

## ✅ DONE - Ready to Deploy!

Your application is now configured for Railway deployment. Follow the steps above to deploy both backend and frontend.
