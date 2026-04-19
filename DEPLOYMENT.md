# Deployment Guide

This guide walks you through deploying the Doctor Appointment System to GitHub, Vercel (frontend), and Railway (backend).

## Step 1: Push to GitHub

### 1.1 Create GitHub Repository
1. Go to [GitHub](https://github.com/new)
2. Create a new repository named `doctor-appointment-system`
3. Do **NOT** initialize with README (we already have one)
4. Click "Create repository"

### 1.2 Connect Local Repo to GitHub
```bash
cd "c:\Users\Aryan Sinha\doctor-appointment-system"

# Add remote origin
git remote add origin https://github.com/aryansinha21/doctor-appointment-system.git

# Rename branch to main (if still on master)
git branch -M main

# Push to GitHub
git push -u origin main
```

Your code is now on GitHub! ✅

---

## Step 2: Deploy Frontend to Vercel

### 2.1 Connect Vercel to GitHub
1. Go to [Vercel](https://vercel.com)
2. Sign in with GitHub account
3. Click "New Project"
4. Select "Continue with GitHub"
5. Authorize Vercel to access your GitHub account
6. Find and select `doctor-appointment-system` repository
7. Click "Import"

### 2.2 Configure Vercel Settings
1. **Framework Preset**: Select "Vite" 
2. **Root Directory**: Select `client`
3. **Build Command**: `npm run build`
4. **Output Directory**: `dist`
5. **Environment Variables**: 
   - Add `VITE_API_URL=https://your-railway-backend-url.railway.app`
   - (Replace with actual Railway URL after backend deployment)
6. Click "Deploy"

### 2.3 Wait for Deployment
Vercel will automatically build and deploy. Once complete, you'll get a URL like:
`https://doctor-appointment-system.vercel.app`

---

## Step 3: Deploy Backend to Railway

### 3.1 Create Railway Account & Project
1. Go to [Railway](https://railway.app)
2. Sign up with GitHub
3. Click "Create a new project"
4. Select "Deploy from GitHub repo"
5. Authorize Railway to access your GitHub
6. Select `doctor-appointment-system` repository

### 3.2 Configure Railway Project
1. After project is created, click on "Add Service"
2. Select "GitHub Repo"
3. Choose your `doctor-appointment-system` repo
4. Click "Add"

### 3.3 Set Environment Variables
1. In Railway dashboard, go to the project
2. Click on the service you just added
3. Go to "Variables" tab
4. Add these environment variables:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/doctor-appointment
   JWT_SECRET=your-super-secret-jwt-key-change-this
   PORT=5000
   ADMIN_KEY=adminsecret123
   NODE_ENV=production
   ```
5. For `MONGO_URI`, use your MongoDB Atlas connection string
6. Save variables

### 3.4 Configure Root Directory (if needed)
1. In Railway, go to "Settings" → "Root Directory"
2. Set to: `server`
3. Save

### 3.5 Deploy
Railway will automatically detect `Nixpacks` and install dependencies.
- It will run: `npm install` in the `/server` directory
- Start command: `npm start` (from your package.json)

Once deployed, you'll get a URL like:
`https://yourapp-production.railway.app`

Copy this URL for the next step!

---

## Step 4: Update Frontend API Configuration

After Railway deployment, update your Vercel frontend to use the correct backend URL:

### 4.1 Update Environment Variable
1. Go to Vercel dashboard
2. Select your project
3. Go to "Settings" → "Environment Variables"
4. Update/Add:
   ```
   VITE_API_URL=https://your-railway-backend-url.railway.app
   ```
   (Use the actual Railway URL from the previous step)
5. Click "Save"

### 4.2 Redeploy Frontend
1. Go to "Deployments"
2. Click the three dots on the latest deployment
3. Select "Redeploy"
4. Confirm

Your frontend will now connect to your live backend! ✅

---

## Step 5: Update API Calls in Code (if needed)

If the frontend still doesn't auto-connect, manually update `client/src/App.jsx`:

Find all API calls and update the base URL:

```javascript
// Before:
const response = await fetch('/api/doctors');

// After (if using environment variable):
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const response = await fetch(`${API_URL}/api/doctors`);
```

Push this change to GitHub, and Vercel will auto-redeploy.

---

## Step 6: Seed Production Database (Optional)

To seed 41 doctors to production MongoDB:

### 6.1 Via Railway Terminal
1. In Railway dashboard, click on your backend service
2. Go to "Logs" or "Terminal" tab
3. Run: `cd server && node seed.js`

OR

### 6.2 Locally with Production Database
```bash
cd server
# Temporarily update .env with production MONGO_URI
npm install
node seed.js
```

---

## Verification

### Test Frontend (Vercel)
1. Open `https://your-domain.vercel.app`
2. Try registering a new account
3. Verify doctors display (if seeded)

### Test Backend (Railway)
1. Test API: `https://your-railway-url.railway.app/api/doctors`
2. Should return JSON array of doctors

### Test Full Flow
1. Register on frontend
2. Login
3. Book an appointment
4. Check admin dashboard

---

## Troubleshooting

### Frontend shows "Cannot reach backend"
- Check Railway deployment status
- Verify `VITE_API_URL` environment variable is set correctly
- Check CORS settings in backend `server.js`

### Backend won't start on Railway
- Check "Build Logs" in Railway for errors
- Verify all environment variables are set
- Check that `.env.example` → `.env` conversion worked
- Ensure MongoDB URI is correct

### Seeding fails
- Verify MongoDB connection string is valid
- Check MongoDB user has appropriate permissions
- Ensure database name matches in MONGO_URI

### CORS Issues
Add this to `server.js` if needed:
```javascript
const cors = require('cors');
app.use(cors({
  origin: ['https://your-domain.vercel.app', 'http://localhost:5173'],
  credentials: true
}));
```

---

## Live URLs (After Successful Deployment)

- **Frontend**: `https://your-domain.vercel.app`
- **Backend**: `https://your-railway-project.railway.app`
- **GitHub**: `https://github.com/aryansinha21/doctor-appointment-system`

---

## Next Steps

1. Configure custom domain (optional)
   - Vercel: Settings → Domains
   - Railway: Settings → Public Networking

2. Set up automated deployments
   - Both Vercel and Railway auto-deploy on GitHub push
   - Monitor deployments in dashboard

3. Monitor logs
   - Vercel: Deployments → Logs
   - Railway: Service → Logs

---

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://railway.app/docs)
- [MongoDB Atlas Connection String](https://docs.mongodb.com/manual/reference/connection-string/)

Good luck! 🚀
