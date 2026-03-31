# GitHub & Render Deployment Guide

## Step 1: Push to GitHub

### Initialize Git (if not already done)
```bash
git init
git add .
git commit -m "Initial commit: Sales Dashboard with React frontend and Node.js backend"
```

### Connect to GitHub Repository
```bash
# Replace YOUR_USERNAME and YOUR_REPO with your actual GitHub username and repository name
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

### If you need to create a new repository on GitHub:
1. Go to https://github.com/new
2. Create a new repository (e.g., "sales-dashboard")
3. Don't initialize with README (since you already have files)
4. Copy the repository URL
5. Use the commands above with your repository URL

## Step 2: Deploy on Render

### Option A: Deploy via Render Dashboard (Recommended)

1. **Go to Render**: https://render.com
2. **Sign in** with your GitHub account
3. **Click "New +"** → Select "Web Service"
4. **Connect your GitHub repository**:
   - Click "Connect account" if not connected
   - Select your repository from the list
5. **Configure the service**:
   - **Name**: `sales-dashboard` (or your preferred name)
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Plan**: Select "Free" tier
6. **Add Environment Variables** (if needed):
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
7. **Click "Create Web Service"**
8. Wait for deployment (5-10 minutes)
9. Your app will be live at: `https://your-app-name.onrender.com`

### Option B: Deploy via render.yaml (Automatic)

Since you already have `render.yaml`, Render will automatically detect it:

1. Go to https://render.com/dashboard
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically read `render.yaml`
5. Click "Apply" to deploy

## Step 3: Verify Deployment

1. Visit your Render dashboard
2. Check the deployment logs
3. Once deployed, click the URL to view your dashboard
4. Test all features:
   - KPI cards
   - Charts and visualizations
   - Filters
   - CRUD operations

## Troubleshooting

### Build Fails
- Check Render logs for errors
- Ensure all dependencies are in package.json
- Verify build command is correct

### App Doesn't Start
- Check start command in render.yaml
- Verify PORT environment variable
- Check server logs

### Database Issues
- Ensure database file is included or use environment-based DB
- Check file permissions

## Project Structure

```
sales-dashboard/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── context/       # Context providers
│   │   └── api.js         # API calls
│   ├── package.json
│   └── vite.config.js
├── server/                # Node.js backend
│   ├── routes/           # API routes
│   │   ├── auth.js
│   │   ├── dashboard.js
│   │   ├── orders.js
│   │   └── admin.js
│   ├── middleware/       # Auth middleware
│   ├── db.js            # Database config
│   ├── index.js         # Server entry
│   └── package.json
├── render.yaml          # Render deployment config
├── package.json         # Root package.json
└── README.md
```

## Features Deployed

✅ **Frontend (React)**:
- Modern UI with responsive design
- Interactive charts (Recharts)
- Real-time data updates
- User authentication
- Order management interface

✅ **Backend (Node.js/Express)**:
- RESTful API
- SQLite database
- JWT authentication
- CRUD operations
- Dashboard analytics

## Post-Deployment

### Update Your App
```bash
git add .
git commit -m "Update: description of changes"
git push origin main
```

Render will automatically redeploy on push!

### Monitor Your App
- Check Render dashboard for logs
- Monitor performance metrics
- Set up alerts (optional)

## Support

- Render Docs: https://render.com/docs
- GitHub Docs: https://docs.github.com

---

**Your dashboard is ready to deploy! 🚀**
