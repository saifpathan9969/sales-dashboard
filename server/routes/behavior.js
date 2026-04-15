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

    // Purchase Prediction & Hesitation Detection
    let prediction = 'Unknown';
    let intervention = null;
    
    // Logic: If user is likely to BUY (low hesitation + intent driven)
    if ((action === 'click_add_to_cart' && hesitation_score < 3) || action === 'checkout_started') {
      prediction = 'Likely to BUY';
      intervention = {
        type: 'likely_to_buy',
        message: 'Hurry! Only 2 items left in stock.',
        fastCheckout: true,
        urgency: true
      };
    } 
    // Logic: If user is likely to LEAVE (high hesitation > 5, or idling)
    else if (hesitation_score > 5 || action === 'cart_idle') {
      prediction = 'Likely to LEAVE';
      intervention = {
        type: 'likely_to_leave',
        message: 'Wait! Don\'t miss out. Get 10% off your purchase right now.',
        discount: '10% OFF',
        trustBadges: ['⭐️⭐️⭐️⭐️⭐️ 4.9/5 Rating', '🔒 Secure SSL Checkout']
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
    const categoryReasons = {
      'Electronics': ['Found better specs elsewhere', 'Wait time too long for latest model', 'Product out of stock', 'Price too high'],
      'Furniture': ['Shipping costs too high', 'Dimensions do not fit', 'Delivery delayed', 'Fabric/Material concern'],
      'Accessories': ['Changed mind', 'Found a cheaper alternative', 'Not compatible with my device'],
      'Appliances': ['High installation cost', 'Found a higher capacity model', 'Payment failure', 'Changed mind']
    };
    const defaultReasons = ['Price change', 'Found cheaper product', 'Delivery delay', 'Payment failure', 'Changed mind', 'Product out of stock'];

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
           const specificReasons = categoryReasons[product.category] || defaultReasons;
           const reason = isCancel ? specificReasons[Math.floor(Math.random() * specificReasons.length)] : null;
           
           execute(
             `INSERT INTO orders (order_id, customer_name, product_name, category, order_value, order_date, payment_method, region, status, delivery_time, cancellation_reason, created_at, updated_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
             [
               'SIM-' + Math.floor(Math.random() * 1000000), 'Auto User ' + i, product.name, product.category, product.price,
               generateTimestamp(daysAgo, timeOffset), 'Credit Card', 'US', status, 
               Math.floor(Math.random()*7)+1, reason,
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

// GET /api/behavior/recommendations/:session_id
router.get('/recommendations/:session_id', (req, res) => {
  try {
    const { session_id } = req.params;
    
    // Parse the entire behavioral session to find highest hesitation logic
    const logs = queryAll(`SELECT action, hesitation_score, details FROM behavioral_logs WHERE session_id = ? ORDER BY created_at DESC LIMIT 50`, [session_id]);
    
    let lastViewedProduct = null;
    let maxHesitation = 0;
    
    // Iterate through behavior logs to find the product they hesitated on the most
    for (const log of logs) {
      if (!log.details) continue;
      const parsed = JSON.parse(log.details);
      
      let discoveredProduct = parsed.item;
      if (!discoveredProduct && parsed.path && parsed.path.includes('/product/')) {
         const idPart = parsed.path.split('/product/')[1];
         if (!isNaN(parseInt(idPart))) discoveredProduct = parseInt(idPart);
      }
      
      if (discoveredProduct) {
         if (!lastViewedProduct) lastViewedProduct = discoveredProduct;
         
         if (log.hesitation_score > maxHesitation) {
            maxHesitation = log.hesitation_score;
            lastViewedProduct = discoveredProduct; // Set the highest hesitated item as the anchor
         }
      }
    }
    
    const allProducts = [
      { id: 1, name: 'Wireless Noise-Canceling Headphones', category: 'Electronics', price: 299.99, image: '🎧' },
      { id: 2, name: 'Ergonomic Office Chair', category: 'Furniture', price: 199.99, image: '🪑' },
      { id: 3, name: 'Smart Fitness Watch', category: 'Electronics', price: 149.99, image: '⌚' },
      { id: 4, name: 'Mechanical Keyboard Pro', category: 'Accessories', price: 129.99, image: '⌨️' },
      { id: 5, name: 'Ultra HD 4K Monitor', category: 'Electronics', price: 349.99, image: '🖥️' },
      { id: 6, name: 'Premium Coffee Maker', category: 'Appliances', price: 89.99, image: '☕' }
    ];
    
    let recommended = [];
    if (lastViewedProduct) {
       const productObj = allProducts.find(p => p.name === lastViewedProduct || p.id === lastViewedProduct);
       
       if (productObj) {
           if (maxHesitation > 4) {
               // IF HIGH HESITATION: Recommend items that are cheaper (either in same category or overall)
               recommended = allProducts.filter(p => p.price < productObj.price && p.id !== productObj.id);
           } else {
               // IF LOW HESITATION: Recommend complementary items from the same category
               recommended = allProducts.filter(p => p.category === productObj.category && p.id !== productObj.id);
           }
       }
    }
    
    if (recommended.length === 0) {
        // Fallback trending generic items
        recommended = [allProducts[0], allProducts[2]]; 
    }
    
    res.json({ recommendations: recommended });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/behavior/active-sessions
router.get('/active-sessions', (req, res) => {
  try {
    const logs = queryAll(`SELECT * FROM behavioral_logs ORDER BY created_at DESC LIMIT 1000`);
    
    const sessionsMap = {};
    for (const log of logs) {
        if (!sessionsMap[log.session_id]) {
           sessionsMap[log.session_id] = {
               session_id: log.session_id,
               last_seen: log.created_at,
               first_seen: log.created_at,
               max_hesitation: log.hesitation_score || 0,
               actions_count: 0,
               cart_events: 0,
               latest_action: log.action
           };
        } else {
           sessionsMap[log.session_id].first_seen = log.created_at; 
        }
        
        sessionsMap[log.session_id].actions_count += 1;
        sessionsMap[log.session_id].max_hesitation = Math.max(sessionsMap[log.session_id].max_hesitation, log.hesitation_score || 0);
        
        if (log.action === 'click_add_to_cart' || log.action === 'checkout_started' || log.action === 'purchase_complete') {
           sessionsMap[log.session_id].cart_events += 1;
        }
    }
    
    const activeSessions = Object.values(sessionsMap).map(s => {
        let prediction = 'Window Shopper';
        if (s.cart_events > 0 && s.max_hesitation < 3) prediction = 'Likely to BUY';
        else if (s.max_hesitation > 5) prediction = 'Likely to LEAVE';
        
        let intervention = 'None Recommended';
        if (prediction === 'Likely to BUY') intervention = 'Urgency Banner (Fast Checkout)';
        if (prediction === 'Likely to LEAVE') intervention = '10% Discount Offer + Trust Badges';
        
        s.prediction = prediction;
        s.intervention = intervention;
        
        // Clean up some date math for lifetime
        const start = new Date(s.first_seen + 'Z').getTime();
        const end = new Date(s.last_seen + 'Z').getTime();
        s.lifetime_secs = isNaN(start) || isNaN(end) ? 0 : Math.max(0, Math.floor((end - start)/1000));
        
        return s;
    });
    
    // Sort logically
    activeSessions.sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen));

    res.json({ data: activeSessions });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;
