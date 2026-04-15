# EDOS - Features & Simulation Guide

**Version**: 3.0  
**Focus**: E-Commerce Behavioural Analytics & Features  
**Team**: Cyber Guard

---

## 🌟 1. Overview of New Features

The EDOS project has been substantially upgraded to move beyond static, synthetic data by incorporating real-time behavioral tracking, dynamic data generation, and advanced analytics KPIs.

### A. Behavioral Analytics Engine
- **Event Tracking**: Tracks user sessions and actions (e.g., `page_view_home`, `click_add_to_cart`, `cart_idle`).
- **Hesitation Scoring**: Evaluates the time spent and interactions to assign a "hesitation score".
- **Dynamic Interventions**: Based on behaviors, the backend identifies user intent (e.g., "Likely to LEAVE") and triggers real-time interventions such as:
  - Discount Popups ("Get 10% off if you purchase now!")
  - Urgency Banners ("Hurry! Only 2 items left in stock.")
  - Cart Reminders.

### B. Procedural Simulation Engine
An automated engine designed to test the dashboard KPIs by injecting realistic user behaviors and their corresponding outcomes into the databases (`behavioral_logs` and `orders`). It simulates 4 robust personas:
1. **Window Shopper** (30%): Browses home and product pages but leaves without adding to the cart.
2. **Cart Abandoner** (30%): Adds items to the cart, hesitates heavily, and abandons checkout (Registers as a **Cancelled Order**).
3. **Decisive Buyer** (25%): Navigates directly to products, adds to cart quickly, and purchases.
4. **Hesitant Buyer** (15%): Hesitates in the cart, receives an intervention, and subsequently completes the purchase.

### C. Dashboard KPI Upgrades
- **Cancelled Orders Percentage**: A dedicated dashboard card showing the percentage of cancelled orders `(Cancelled / Total)`, making it easy to track the impact of the *Cart Abandoner* simulated interactions.
- **Dynamic Granularity**: Revenue charts can now aggregate dynamically by Daily, Weekly, or Monthly periods to observe sales patterns and behavioral effects over time.

---

## 🚀 2. How to Start and Use the Simulated Data

We provide two main ways to generate simulation data to test the dashboard:

### Method 1: Bulk Data Simulation (Auto-Pilot)
This is the fastest method to populate the database with realistic time-scaled historical data. It quickly inserts 100 sessions spanning historic timestamps.

1. Ensure the **Backend API** is running (see *Getting Started*).
2. Open your web browser or use an API testing tool (like Postman or curl).
3. Navigate to: 
   ```text
   http://localhost:3001/api/behavior/generate-bulk
   ```
4. You should receive a JSON response confirming: `{"message": "Auto-pilot finished! Simulated 100 sessions..."}`
5. Open your Dashboard Frontend to immediately see the new generated data reflected in your **Revenue Charts** and **Cancelled Orders** KPI.

### Method 2: Real-time Interactive Simulator App
We have created a dedicated Vite+React application specifically for mimicking live, real-time user behaviors on a mock storefront.

1. Open a new terminal instance and navigate to the simulator project:
   ```bash
   cd simulator
   npm install
   npm run dev
   ```
2. Open the URL provided by Vite (e.g., `http://localhost:5174`).
3. As you navigate and click through the simulator UI, it will trigger real-time POST requests to the backend (`/api/behavior/track`), updating behavioral logs instantly.

---

## 💻 3. Getting Started (Core Application)

To run the full EDOS environment (Backend Server + Sales Dashboard):

### Step 1: Start the Backend Server
```bash
# Open Terminal 1
cd server
npm install

# Start the server (runs on Port 3001 by default)
npm run dev
```

### Step 2: Start the Dashboard Frontend
```bash
# Open Terminal 2
cd client
npm install

# Start the dashboard (runs on Port 5173 by default)
npm run dev
```

### Step 3: Populate Data & Review
1. Trigger the bulk simulation route (`http://localhost:3001/api/behavior/generate-bulk`).
2. Log into the local dashboard (`http://localhost:5173`) using default credentials (e.g., `admin@edos.com` / `admin123`).
3. Toggle between **Daily, Weekly, and Monthly** views on the revenue chart.
4. Observe the **Cancelled Orders** KPI percentage go up organically as the simulated Cart Abandoners pull their orders.
