# Sales Performance Dashboard - Deployment Guide

**Team:** Cyber Guard  
**Mentor:** Anwar Nizami  
**Version:** 1.0

---

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Local Deployment](#local-deployment)
3. [Streamlit Cloud Deployment](#streamlit-cloud-deployment)
4. [Requirements File](#requirements-file)
5. [Environment Configuration](#environment-configuration)
6. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] All Python scripts are working locally
- [ ] Database is initialized with data
- [ ] All dependencies are documented
- [ ] README.md is complete
- [ ] Test suite passes (run `python test_dashboard.py`)
- [ ] Data files are in correct locations
- [ ] No hardcoded paths or credentials

---

## Local Deployment

### Step 1: Prepare Environment

```bash
# Create project directory
mkdir sales-dashboard
cd sales-dashboard

# Copy all project files to this directory
```

### Step 2: Install Dependencies

```bash
# Install required packages
pip install pandas numpy streamlit plotly matplotlib
```

### Step 3: Initialize Data

```bash
# Run data preparation scripts in order
python data_cleaning.py
python feature_engineering.py
python kpi_calculator.py
python database.py
```

### Step 4: Launch Dashboard

```bash
# Start the Streamlit server
streamlit run dashboard_with_crud.py
```

The dashboard will be available at: `http://localhost:8501`

### Step 5: Test Functionality

1. Open the dashboard in your browser
2. Verify KPIs are displaying correctly
3. Test filtering functionality
4. Create a test order
5. Update the test order
6. Delete the test order
7. Verify all charts are rendering

---

## Streamlit Cloud Deployment

### Prerequisites

- GitHub account
- Streamlit Cloud account (free at share.streamlit.io)
- Project pushed to GitHub repository

### Step 1: Prepare Repository

1. **Create requirements.txt**:
```txt
pandas==2.0.3
numpy==1.24.3
streamlit==1.28.0
plotly==5.17.0
matplotlib==3.7.2
```

2. **Create .streamlit/config.toml** (optional):
```toml
[theme]
primaryColor = "#2E86AB"
backgroundColor = "#FFFFFF"
secondaryBackgroundColor = "#F0F2F6"
textColor = "#262730"
font = "sans serif"

[server]
maxUploadSize = 200
```

3. **Ensure all data files are included**:
   - cleaned_sales_orders.csv
   - transformed_sales_orders.csv
   - monthly_time_series.csv
   - weekly_time_series.csv
   - daily_time_series.csv
   - kpi_summary.csv

4. **Create .gitignore**:
```
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.so
*.egg
*.egg-info/
dist/
build/
*.db
.DS_Store
.vscode/
.idea/
```

### Step 2: Push to GitHub

```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: Sales Performance Dashboard"

# Add remote repository
git remote add origin https://github.com/yourusername/sales-dashboard.git

# Push to GitHub
git push -u origin main
```

### Step 3: Deploy on Streamlit Cloud

1. Go to [share.streamlit.io](https://share.streamlit.io)
2. Sign in with GitHub
3. Click "New app"
4. Select your repository
5. Set main file path: `dashboard_with_crud.py`
6. Click "Deploy"

### Step 4: Configure App Settings

In Streamlit Cloud dashboard:
1. Go to app settings
2. Set Python version: 3.9 or higher
3. Add any secrets if needed
4. Save settings

### Step 5: Monitor Deployment

- Watch the deployment logs
- Wait for "Your app is live!" message
- Click the URL to view your deployed dashboard

---

## Requirements File

Create `requirements.txt` with exact versions:

```txt
# Core dependencies
pandas==2.0.3
numpy==1.24.3

# Dashboard framework
streamlit==1.28.0

# Visualization
plotly==5.17.0
matplotlib==3.7.2

# Optional: for better performance
pyarrow==13.0.0
```

Install from requirements file:
```bash
pip install -r requirements.txt
```

---

## Environment Configuration

### Database Configuration

For production deployment, consider:

1. **Use environment variables for database path**:
```python
import os
DB_PATH = os.getenv('DATABASE_PATH', 'sales_dashboard.db')
```

2. **Add database to .gitignore** if it contains sensitive data

3. **Initialize database on first run**:
```python
if not os.path.exists(DB_PATH):
    initialize_database()
```

### Data File Paths

Use relative paths that work in any environment:

```python
import os

# Get the directory of the current script
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Build paths relative to BASE_DIR
DATA_FILE = os.path.join(BASE_DIR, 'cleaned_sales_orders.csv')
```

### Streamlit Configuration

Create `.streamlit/config.toml`:

```toml
[server]
port = 8501
enableCORS = false
enableXsrfProtection = true
maxUploadSize = 200

[browser]
gatherUsageStats = false

[theme]
primaryColor = "#2E86AB"
backgroundColor = "#FFFFFF"
secondaryBackgroundColor = "#F0F2F6"
textColor = "#262730"
```

---

## Production Considerations

### Security

1. **Database Security**:
   - Use proper authentication
   - Implement access controls
   - Regular backups
   - Encrypt sensitive data

2. **Input Validation**:
   - Validate all user inputs
   - Sanitize data before database operations
   - Prevent SQL injection

3. **Session Management**:
   - Implement user authentication
   - Use session state properly
   - Set appropriate timeouts

### Performance Optimization

1. **Caching**:
```python
@st.cache_data(ttl=3600)  # Cache for 1 hour
def load_data():
    # Load data logic
    pass
```

2. **Database Indexing**:
```sql
CREATE INDEX idx_order_date ON orders(order_date);
CREATE INDEX idx_category ON orders(category);
CREATE INDEX idx_status ON orders(status);
```

3. **Lazy Loading**:
   - Load data only when needed
   - Use pagination for large datasets
   - Limit initial data load

### Monitoring

1. **Add logging**:
```python
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info("Dashboard started")
logger.error("Error occurred: %s", error)
```

2. **Track usage**:
   - Monitor page views
   - Track user actions
   - Log errors and exceptions

3. **Performance metrics**:
   - Response times
   - Database query times
   - Memory usage

---

## Troubleshooting

### Common Deployment Issues

#### Issue 1: Module Not Found

**Error**: `ModuleNotFoundError: No module named 'streamlit'`

**Solution**:
```bash
pip install -r requirements.txt
```

#### Issue 2: File Not Found

**Error**: `FileNotFoundError: cleaned_sales_orders.csv`

**Solution**:
- Ensure all data files are in the repository
- Check file paths are relative, not absolute
- Run data preparation scripts

#### Issue 3: Database Locked

**Error**: `sqlite3.OperationalError: database is locked`

**Solution**:
- Close other connections to database
- Use connection pooling
- Implement retry logic

#### Issue 4: Port Already in Use

**Error**: `OSError: [Errno 48] Address already in use`

**Solution**:
```bash
# Kill process on port 8501
lsof -ti:8501 | xargs kill -9

# Or use different port
streamlit run dashboard_with_crud.py --server.port 8502
```

#### Issue 5: Memory Error

**Error**: `MemoryError` or app crashes

**Solution**:
- Implement data pagination
- Use caching effectively
- Optimize data loading
- Increase server memory

### Streamlit Cloud Specific Issues

#### Issue 1: App Won't Deploy

**Solutions**:
- Check requirements.txt is correct
- Verify Python version compatibility
- Check deployment logs for errors
- Ensure main file path is correct

#### Issue 2: App Keeps Restarting

**Solutions**:
- Check for infinite loops
- Verify data files exist
- Review error logs
- Check memory usage

#### Issue 3: Slow Performance

**Solutions**:
- Implement caching
- Reduce data size
- Optimize queries
- Use st.cache_data decorator

---

## Maintenance

### Regular Tasks

1. **Daily**:
   - Monitor dashboard availability
   - Check error logs
   - Verify data updates

2. **Weekly**:
   - Review performance metrics
   - Check database size
   - Update documentation if needed

3. **Monthly**:
   - Update dependencies
   - Review and optimize queries
   - Backup database
   - Security audit

### Updating the Dashboard

1. **Make changes locally**:
```bash
# Edit files
# Test changes
python test_dashboard.py
```

2. **Commit and push**:
```bash
git add .
git commit -m "Description of changes"
git push origin main
```

3. **Streamlit Cloud auto-deploys** from GitHub

### Rollback Procedure

If deployment fails:

1. **Revert to previous version**:
```bash
git revert HEAD
git push origin main
```

2. **Or rollback to specific commit**:
```bash
git reset --hard <commit-hash>
git push -f origin main
```

---

## Scaling Considerations

### For Larger Datasets

1. **Use PostgreSQL instead of SQLite**:
```python
import psycopg2
# Connection to PostgreSQL
```

2. **Implement pagination**:
```python
page_size = 100
offset = (page_number - 1) * page_size
query = f"SELECT * FROM orders LIMIT {page_size} OFFSET {offset}"
```

3. **Use data warehousing**:
   - Pre-aggregate data
   - Use materialized views
   - Implement ETL pipeline

### For Multiple Users

1. **Add authentication**:
```python
import streamlit_authenticator as stauth
```

2. **Implement user roles**:
   - Admin: Full access
   - Manager: View and edit
   - Viewer: Read-only

3. **Use proper database**:
   - PostgreSQL
   - MySQL
   - Cloud database (AWS RDS, Azure SQL)

---

## Backup and Recovery

### Database Backup

```bash
# Backup SQLite database
cp sales_dashboard.db sales_dashboard_backup_$(date +%Y%m%d).db

# Automated backup script
#!/bin/bash
BACKUP_DIR="backups"
mkdir -p $BACKUP_DIR
cp sales_dashboard.db $BACKUP_DIR/sales_dashboard_$(date +%Y%m%d_%H%M%S).db
```

### Data Export

```python
# Export to CSV
import pandas as pd
from database import SalesDatabase

db = SalesDatabase()
db.connect()
df = db.get_all_orders()
df.to_csv('orders_export.csv', index=False)
db.close()
```

### Recovery

```bash
# Restore from backup
cp sales_dashboard_backup_20250101.db sales_dashboard.db

# Restart dashboard
streamlit run dashboard_with_crud.py
```

---

## Support and Resources

### Documentation
- [Streamlit Documentation](https://docs.streamlit.io)
- [Plotly Documentation](https://plotly.com/python/)
- [Pandas Documentation](https://pandas.pydata.org/docs/)

### Community
- [Streamlit Forum](https://discuss.streamlit.io)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/streamlit)

### Project Resources
- README.md - Project overview
- USER_MANUAL.md - User guide
- This file - Deployment guide

---

**End of Deployment Guide**

*For questions, contact Team Cyber Guard*  
*Mentor: Anwar Nizami*
