const { initDb, getDb, execute, queryAll } = require('./server/db');

async function patchData() {
  await initDb();
  
  const reasons = [
    'Price change', 'Found cheaper product', 'Delivery delay', 
    'Payment failure', 'Changed mind', 'Product out of stock', 
    'Shipping cost too high', 'Poor product reviews', 
    'Technical checkout issue', 'Long processing time'
  ];
  
  const behaviorTypes = [
    'Price-sensitive buyer', 'Impulse buyer', 'Comparison shopper',
    'Delayed buyer', 'Discount seeker', 'High-value buyer',
    'Cart abandoner', 'Payment cautious buyer', 'Seasonal shopper'
  ];

  const db = getDb();

  // Populate customers table from unique customer_name in orders
  const uniqueCustomers = queryAll('SELECT DISTINCT customer_name, region FROM orders');
  let insertedCustomers = 0;
  for (const c of uniqueCustomers) {
     const bType = behaviorTypes[Math.floor(Math.random() * behaviorTypes.length)];
     try {
       execute('INSERT INTO customers (customer_name, user_behavior_type, region) VALUES (?, ?, ?)', [c.customer_name, bType, c.region]);
       insertedCustomers++;
     } catch(e) {}
  }
  console.log(`Inserted ${insertedCustomers} customers.`);

  // Patch cancelled orders with a random reason and delivery time
  const orders = queryAll('SELECT order_id, status FROM orders');
  let updatedOrders = 0;
  for (const o of orders) {
    // If status is not cancelled, maybe make 15% cancelled just for synthetic data? No, let's keep original status but give cancellation reason to all 'Cancelled' 
    let newStatus = o.status;
    let reason = null;
    if (newStatus === 'Cancelled') {
       reason = reasons[Math.floor(Math.random() * reasons.length)];
    }
    const deliveryTime = Math.floor(Math.random() * 10) + 1; // 1-10 days
    
    execute('UPDATE orders SET delivery_time = ?, cancellation_reason = ? WHERE order_id = ?', [deliveryTime, reason, o.order_id]);
    updatedOrders++;
  }
  console.log(`Updated ${updatedOrders} orders.`);
}

patchData().catch(console.error);
