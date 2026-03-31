# Sales Performance Dashboard - User Manual

**Team:** Cyber Guard  
**Mentor:** Anwar Nizami  
**Version:** 1.0

---

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Using the Dashboard](#using-the-dashboard)
4. [Order Management](#order-management)
5. [Filtering and Search](#filtering-and-search)
6. [Understanding KPIs](#understanding-kpis)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### Launching the Dashboard

1. Open your terminal or command prompt
2. Navigate to the project directory
3. Run the command:
   ```bash
   streamlit run dashboard_with_crud.py
   ```
4. The dashboard will automatically open in your web browser
5. If it doesn't open automatically, go to: `http://localhost:8501`

### First Time Setup

Before using the dashboard for the first time, ensure you've run:
```bash
python data_cleaning.py
python feature_engineering.py
python kpi_calculator.py
python database.py
```

---

## Dashboard Overview

### Main Components

The dashboard consists of three main pages:

1. **Dashboard** - View KPIs, charts, and analytics
2. **Orders Management** - View, edit, and delete orders
3. **Create Order** - Add new orders to the system

### Navigation

Use the sidebar on the left to:
- Switch between pages
- Apply filters (on Dashboard page)
- View filtered record counts

---

## Using the Dashboard

### 1. Viewing Key Performance Indicators (KPIs)

At the top of the Dashboard page, you'll see four KPI cards:

- **Total Revenue**: Sum of all order values
- **Total Orders**: Count of all orders
- **Avg Order Value**: Average revenue per order
- **Sales Growth**: Percentage change in sales

These KPIs update automatically based on your selected filters.

### 2. Analyzing Charts

#### Monthly Revenue Trend
- **Location**: Top left
- **Purpose**: Shows revenue over time
- **How to use**: Hover over points to see exact values
- **Insight**: Identify seasonal patterns and growth trends

#### Revenue by Category
- **Location**: Top right
- **Purpose**: Compares revenue across product categories
- **How to use**: Hover over bars to see exact amounts
- **Insight**: Identify best-performing categories

#### Top 5 Products
- **Location**: Bottom left
- **Purpose**: Shows highest revenue products
- **How to use**: Hover to see product revenue
- **Insight**: Focus on top performers

#### Order Status Distribution
- **Location**: Bottom right
- **Purpose**: Shows breakdown of order statuses
- **How to use**: Click legend to show/hide categories
- **Insight**: Monitor completion and cancellation rates

### 3. Viewing the Orders Table

At the bottom of the Dashboard page:
- View all orders matching your filters
- See key information: Order ID, Customer, Product, Revenue, Date, Status
- Use the search box to find specific orders
- Adjust rows per page using the dropdown

---

## Order Management

### Viewing Orders

1. Click **"Orders Management"** in the sidebar
2. Browse through the list of orders
3. Click on any order to expand and see details
4. Use the search box to find specific orders

### Creating a New Order

1. Click **"Create Order"** in the sidebar
2. Fill in all required fields:
   - **Order ID**: Unique identifier (e.g., ORD-1234)
   - **Customer Name**: Full name of customer
   - **Product Name**: Name of product
   - **Category**: Select from dropdown
   - **Order Value**: Amount in dollars
   - **Order Date**: Date of order
   - **Payment Method**: Card, Bank Transfer, or PayPal
   - **Region**: North, South, East, or West
   - **Status**: Pending, Completed, or Cancelled
   - **Created By**: User ID (default: 1)
3. Click **"Create Order"** button
4. You'll see a success message if the order was created
5. The dashboard will refresh automatically

### Editing an Order

1. Go to **"Orders Management"**
2. Find the order you want to edit
3. Click the **"✏️ Edit"** button
4. Modify the fields you want to change
5. Click **"Update Order"** button
6. The order will be updated immediately

### Deleting an Order

1. Go to **"Orders Management"**
2. Find the order you want to delete
3. Click the **"🗑️ Delete"** button
4. Click again to confirm deletion
5. The order will be permanently removed

**⚠️ Warning**: Deletion is permanent and cannot be undone!

---

## Filtering and Search

### Date Range Filter

1. In the sidebar, find **"Date Range"**
2. Click on the date field
3. Select start and end dates
4. The dashboard updates automatically
5. To reset, select the full date range

### Category Filter

1. In the sidebar, find **"Category"**
2. Select a category from the dropdown
3. Choose **"All"** to see all categories
4. The dashboard updates automatically

### Status Filter

1. In the sidebar, find **"Status"**
2. Select a status from the dropdown:
   - **Completed**: Successfully fulfilled orders
   - **Pending**: Orders awaiting fulfillment
   - **Cancelled**: Orders that were cancelled
3. Choose **"All"** to see all statuses

### Search Functionality

On the Orders Management page:
1. Type in the search box
2. Search works for:
   - Order IDs (e.g., "ORD-1001")
   - Customer names (e.g., "Emma")
   - Product names (e.g., "Backpack")
3. Results update as you type
4. Clear the search box to see all orders

### Combining Filters

You can use multiple filters together:
- Date range + Category
- Date range + Status
- Category + Status
- All three filters

The filtered record count shows in the sidebar.

---

## Understanding KPIs

### Total Revenue
- **What it is**: Sum of all order values
- **Formula**: Sum of order_value column
- **Use case**: Track overall business performance
- **Good to know**: Includes all orders (completed, pending, cancelled)

### Total Orders
- **What it is**: Count of all orders
- **Formula**: Count of order records
- **Use case**: Monitor order volume
- **Good to know**: Higher volume may indicate growth

### Average Order Value (AOV)
- **What it is**: Average revenue per order
- **Formula**: Total Revenue ÷ Total Orders
- **Use case**: Understand typical order size
- **Good to know**: Higher AOV means more revenue per transaction

### Sales Growth
- **What it is**: Percentage change in sales
- **Formula**: ((Current Period - Previous Period) / Previous Period) × 100
- **Use case**: Track business growth or decline
- **Good to know**: 
  - Positive = Growth (green)
  - Negative = Decline (red)

### Completion Rate
- **What it is**: Percentage of completed orders
- **Formula**: (Completed Orders / Total Orders) × 100
- **Use case**: Monitor order fulfillment efficiency
- **Good to know**: Higher is better (target: >80%)

### Customer Lifetime Value (CLV)
- **What it is**: Average revenue per customer
- **Formula**: Total Revenue / Unique Customers
- **Use case**: Understand customer value
- **Good to know**: Higher CLV indicates loyal customers

---

## Troubleshooting

### Dashboard Won't Load

**Problem**: Browser shows error or blank page

**Solutions**:
1. Check if Streamlit is running in terminal
2. Verify you're using the correct URL: `http://localhost:8501`
3. Try refreshing the browser (F5 or Ctrl+R)
4. Restart Streamlit:
   - Press Ctrl+C in terminal
   - Run `streamlit run dashboard_with_crud.py` again

### No Data Showing

**Problem**: Dashboard loads but shows no data

**Solutions**:
1. Verify database exists: Check for `sales_dashboard.db` file
2. Re-run database initialization: `python database.py`
3. Check if filters are too restrictive
4. Reset filters to "All"

### Can't Create Order

**Problem**: Error when creating new order

**Solutions**:
1. Ensure Order ID is unique (not already used)
2. Fill in all required fields
3. Check Order ID format (e.g., ORD-XXXX)
4. Verify order value is a positive number
5. Ensure date is in correct format

### Charts Not Displaying

**Problem**: Charts show as blank or error

**Solutions**:
1. Check if data exists for selected filters
2. Try resetting filters
3. Refresh the browser
4. Check terminal for error messages

### Slow Performance

**Problem**: Dashboard is slow to respond

**Solutions**:
1. Reduce date range filter
2. Use specific category/status filters
3. Limit rows displayed in table
4. Close other browser tabs
5. Restart Streamlit

### Search Not Working

**Problem**: Search returns no results

**Solutions**:
1. Check spelling of search term
2. Try partial search (e.g., "Emma" instead of "Emma Wilson")
3. Search is case-insensitive
4. Clear search and try again
5. Verify data exists in database

---

## Tips and Best Practices

### For Daily Use

1. **Start with Dashboard page** to get overview
2. **Use filters** to focus on specific data
3. **Check KPIs regularly** to monitor performance
4. **Review charts** for trends and patterns
5. **Use search** for quick order lookup

### For Order Management

1. **Use consistent Order ID format** (e.g., ORD-XXXX)
2. **Double-check before deleting** orders
3. **Update status** as orders progress
4. **Keep customer names consistent** for better analytics
5. **Use correct categories** for accurate reporting

### For Analysis

1. **Compare time periods** using date filters
2. **Analyze by category** to identify opportunities
3. **Monitor completion rate** for operational efficiency
4. **Track top products** for inventory planning
5. **Review growth trends** for strategic planning

---

## Keyboard Shortcuts

- **Ctrl + R** or **F5**: Refresh dashboard
- **Ctrl + F**: Find in page (browser search)
- **Ctrl + +**: Zoom in
- **Ctrl + -**: Zoom out
- **Ctrl + 0**: Reset zoom

---

## Getting Help

### Common Questions

**Q: How often does data update?**  
A: Data updates immediately after any create, update, or delete operation.

**Q: Can I export data?**  
A: Currently, data is stored in the database. You can query it using the database.py script.

**Q: How far back does data go?**  
A: The current dataset covers the year 2025.

**Q: Can multiple users access the dashboard?**  
A: Yes, but be aware that changes made by one user will affect all users.

**Q: Is my data secure?**  
A: Data is stored locally in SQLite database. For production use, implement proper security measures.

### Contact Support

For additional help or to report issues:
- Contact: Team Cyber Guard
- Mentor: Anwar Nizami

---

## Appendix

### Order Status Definitions

- **Completed**: Order has been successfully fulfilled and delivered
- **Pending**: Order is awaiting processing or fulfillment
- **Cancelled**: Order was cancelled before completion

### Category Definitions

- **Accessories**: Bags, sunglasses, and similar items
- **Electronics**: Headphones, smartwatches, and tech products
- **Fashion**: Clothing items like jackets and shoes
- **Fitness**: Yoga mats, water bottles, and fitness gear
- **Home**: Desk lamps and home items
- **Stationery**: Notebooks and office supplies

### Payment Methods

- **Card**: Credit or debit card payments
- **Bank Transfer**: Direct bank transfers
- **PayPal**: PayPal payments

### Regions

- **North**: Northern region
- **South**: Southern region
- **East**: Eastern region
- **West**: Western region

---

**End of User Manual**

*For technical documentation, see README.md*  
*For deployment instructions, see DEPLOYMENT_GUIDE.md*
