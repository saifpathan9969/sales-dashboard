const express = require('express');
const { execute, queryAll } = require('../db');

const router = express.Router();

// POST /api/behavior/track
router.post('/track', (req, res) => {
  try {
    // Expected: { session_id, action, hesitation_score, details }
    const { session_id, action, hesitation_score, details } = req.body;
    
    if (!session_id || !action) {
      return res.status(400).json({ error: 'session_id and action are required' });
    }

    // Insert into behavioral_logs
    execute(
      `INSERT INTO behavioral_logs (session_id, action, hesitation_score, details) VALUES (?, ?, ?, ?)`,
      [session_id, action, hesitation_score || 0, JSON.stringify(details || {})]
    );

    // Predict if user will buy or leave based on rule
    // Hesitation Detection: hesitation_score > 5
    let prediction = 'Unknown';
    let intervention = null;
    
    if (hesitation_score > 5) {
      prediction = 'Likely to LEAVE';
      intervention = {
        type: 'discount_popup',
        message: 'Get 10% off if you purchase now!',
        badge: 'Trusted Seller'
      };
    } else if (action === 'click_add_to_cart' && hesitation_score < 2) {
      prediction = 'Likely to BUY';
      intervention = {
        type: 'urgency_banner',
        message: 'Hurry! Only 2 items left in stock.'
      };
    } else if (action === 'cart_idle') {
      prediction = 'Cart Abandoner';
      intervention = {
        type: 'reminder',
        message: 'Your items are waiting for you...'
      };
    }

    res.json({ success: true, prediction, intervention });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

// GET /api/behavior/logs
router.get('/logs', (req, res) => {
  try {
    const logs = queryAll(`SELECT * FROM behavioral_logs ORDER BY created_at DESC LIMIT 100`);
    res.json({ data: logs });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/behavior/generate-bulk
router.get('/generate-bulk', (req, res) => {
  try {
    const reasons = ['Price change', 'Found cheaper product', 'Delivery delay', 'Payment failure', 'Changed mind', 'Product out of stock'];
    const products = [
      { name: 'Wireless Noise-Canceling Headphones', category: 'Electronics', price: 299.99 },
      { name: 'Ergonomic Office Chair', category: 'Furniture', price: 199.99 },
      { name: 'Smart Fitness Watch', category: 'Electronics', price: 149.99 },
      { name: 'Mechanical Keyboard Pro', category: 'Accessories', price: 129.99 },
      { name: 'Ultra HD 4K Monitor', category: 'Electronics', price: 349.99 },
      { name: 'Premium Coffee Maker', category: 'Appliances', price: 89.99 }
    ];

    const generateTimestamp = (daysAgo, extraMinutes = 0) => {
      const d = new Date();
      d.setDate(d.getDate() - daysAgo);
      d.setMinutes(d.getMinutes() + extraMinutes);
      return d.toISOString().replace('T', ' ').slice(0, 19);
    };

    let generatedSessions = 0;
    
    // Simulate 100 sessions
    for (let i = 0; i < 100; i++) {
        const sessionId = 'SESSION-AUTO-' + Math.floor(Math.random() * 10000000);
        const daysAgo = Math.floor(Math.random() * 30);
        
        let randPersona = Math.random();
        // Persona: Window Shopper (30%), Cart Abandoner (30%), Decisive Buyer (25%), Hesitant Buyer (15%)
        let persona = '';
        if(randPersona < 0.3) persona = 'window_shopper';
        else if (randPersona < 0.6) persona = 'cart_abandoner';
        else if (randPersona < 0.85) persona = 'decisive_buyer';
        else persona = 'hesitant_buyer';

        const product = products[Math.floor(Math.random() * products.length)];
        let timeOffset = 0;

        const logBehavior = (action, score, details) => {
          const timestamp = generateTimestamp(daysAgo, timeOffset);
          execute(
            `INSERT INTO behavioral_logs (session_id, action, hesitation_score, details, created_at) VALUES (?, ?, ?, ?, ?)`,
            [sessionId, action, score, JSON.stringify(details), timestamp]
          );
        };

        const createOrder = (status, isCancel) => {
           execute(
             `INSERT INTO orders (order_id, customer_name, product_name, category, order_value, order_date, payment_method, region, status, delivery_time, cancellation_reason, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
             [
               'SIM-' + Math.floor(Math.random() * 1000000), 'Auto User ' + i, product.name, product.category, product.price,
               generateTimestamp(daysAgo, timeOffset), 'Credit Card', 'US', status, 
               Math.floor(Math.random()*7)+1, isCancel ? reasons[Math.floor(Math.random()*reasons.length)] : null,
               generateTimestamp(daysAgo, timeOffset), generateTimestamp(daysAgo, timeOffset)
             ]
           );
        };

        if (persona === 'window_shopper') {
            logBehavior('page_view_home', 3, { path: '/' }); timeOffset += 2;
            logBehavior('page_view_products', 8, { path: '/products' }); timeOffset += 5;
            logBehavior('page_view_product_detail', 12, { path: `/product/${product.name}` });
            // Leaves without adding to cart
        } 
        else if (persona === 'cart_abandoner') {
            logBehavior('page_view_home', 1, { path: '/' }); timeOffset += 1;
            logBehavior('page_view_product_detail', 2, { path: `/product/${product.name}` }); timeOffset += 1;
            logBehavior('click_add_to_cart', 1, { item: product.name }); timeOffset += 2;
            logBehavior('cart_idle', 15, { time_spent: 150 }); timeOffset += 3;
            logBehavior('cancel_checkout', 4, { reason: 'Unknown' });
            createOrder('Cancelled', true);
        }
        else if (persona === 'decisive_buyer') {
            logBehavior('page_view_home', 0.5, { path: '/' }); timeOffset += 0.5;
            logBehavior('page_view_product_detail', 1, { path: `/product/${product.name}` }); timeOffset += 0.5;
            logBehavior('click_add_to_cart', 0.5, { item: product.name }); timeOffset += 1;
            logBehavior('purchase_complete', 0.5, { item: product.name });
            createOrder('Completed', false);
        }
        else if (persona === 'hesitant_buyer') {
            logBehavior('page_view_home', 2, { path: '/' }); timeOffset += 1;
            logBehavior('page_view_product_detail', 8, { path: `/product/${product.name}` }); timeOffset += 3;
            logBehavior('click_add_to_cart', 2, { item: product.name }); timeOffset += 2;
            logBehavior('cart_idle', 12, { time_spent: 120 }); timeOffset += 2;
            // Intervention is theoretically shown here, then user proceeds
            logBehavior('purchase_complete', 3, { item: product.name, discount_used: true });
            createOrder('Completed', false);
        }

        generatedSessions++;
    }
    
    res.json({ message: `Auto-pilot finished! Simulated ${generatedSessions} sessions with diverse personas.` });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
