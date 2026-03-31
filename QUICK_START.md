# Sales Performance Dashboard - Quick Start Guide

**Get up and running in 5 minutes!**

---

## Prerequisites

- Python 3.8 or higher installed
- Terminal/Command Prompt access

---

## Installation (3 steps)

### Step 1: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 2: Prepare Data
```bash
python data_cleaning.py
python feature_engineering.py
python kpi_calculator.py
python database.py
```

### Step 3: Launch Dashboard
```bash
streamlit run dashboard_with_crud.py
```

**That's it!** The dashboard will open in your browser at `http://localhost:8501`

---

## First Time Usage

### View Dashboard
1. Dashboard opens automatically
2. See KPIs at the top
3. Explore charts below
4. Use filters in sidebar

### Create Your First Order
1. Click "Create Order" in sidebar
2. Fill in the form:
   - Order ID: `ORD-2001`
   - Customer Name: `Your Name`
   - Product Name: `Test Product`
   - Category: Select any
   - Order Value: `100.00`
   - Fill remaining fields
3. Click "Create Order"
4. See your order in the dashboard!

### Manage Orders
1. Go to "Orders Management"
2. Find your order
3. Click "Edit" to update
4. Click "Delete" to remove

---

## Troubleshooting

### Dashboard won't start?
```bash
# Check if Streamlit is installed
pip install streamlit

# Try again
streamlit run dashboard_with_crud.py
```

### No data showing?
```bash
# Re-run data preparation
python database.py
```

### Port already in use?
```bash
# Use different port
streamlit run dashboard_with_crud.py --server.port 8502
```

---

## What's Included

✅ **180 sample orders** from 2025  
✅ **6 product categories** (Accessories, Electronics, Fashion, Fitness, Home, Stationery)  
✅ **10 customers** with order history  
✅ **$29,020 in revenue** to analyze  
✅ **Full CRUD operations** for order management  
✅ **Interactive charts** and visualizations  
✅ **Advanced filtering** by date, category, status  

---

## Key Features to Try

1. **Filter by Date Range** - See specific time periods
2. **Filter by Category** - Focus on product types
3. **Search Orders** - Find specific orders quickly
4. **View Charts** - Analyze trends and patterns
5. **Create Orders** - Add new sales data
6. **Edit Orders** - Update order details
7. **Delete Orders** - Remove test data

---

## Next Steps

- Read `USER_MANUAL.md` for detailed instructions
- Check `README.md` for full documentation
- See `DEPLOYMENT_GUIDE.md` to deploy online

---

## Quick Commands Reference

```bash
# Install dependencies
pip install -r requirements.txt

# Prepare data (run once)
python data_cleaning.py
python feature_engineering.py
python kpi_calculator.py
python database.py

# Run tests
python test_dashboard.py

# Start dashboard
streamlit run dashboard_with_crud.py

# Start on different port
streamlit run dashboard_with_crud.py --server.port 8502

# Stop dashboard
# Press Ctrl+C in terminal
```

---

## Support

Need help? Check these resources:
- `USER_MANUAL.md` - Comprehensive user guide
- `README.md` - Full project documentation
- `DEPLOYMENT_GUIDE.md` - Deployment help

---

**Team:** Cyber Guard | **Mentor:** Anwar Nizami

**🚀 Happy Analyzing!**
