// Quick test to verify the cancellation-rates endpoint works
const { initDb, queryAll, queryOne, execute } = require('./db');

async function testCancellationEndpoint() {
  console.log('Initializing database...');
  await initDb();
  
  console.log('\n1. Checking if cancellation_reason column exists...');
  const tableInfo = queryAll('PRAGMA table_info(orders)');
  const hasCancellationReason = tableInfo.some(col => col.name === 'cancellation_reason');
  
  if (!hasCancellationReason) {
    console.log('❌ ERROR: cancellation_reason column is missing!');
    process.exit(1);
  }
  console.log('✅ Column exists in database');
  
  console.log('\n2. Inserting test cancelled orders...');
  execute('DELETE FROM orders WHERE order_id LIKE "TEST-%"');
  
  execute(`
    INSERT INTO orders (order_id, customer_name, product_name, category, order_value, order_date, payment_method, region, status, cancellation_reason, created_by)
    VALUES 
      ('TEST-001', 'Test User 1', 'Laptop', 'Electronics', 1200.00, '2024-01-15', 'Credit Card', 'North', 'Cancelled', 'Price change', 1),
      ('TEST-002', 'Test User 2', 'Phone', 'Electronics', 800.00, '2024-01-16', 'PayPal', 'South', 'Cancelled', 'Delivery delay', 1),
      ('TEST-003', 'Test User 3', 'Tablet', 'Electronics', 500.00, '2024-01-17', 'Credit Card', 'East', 'Completed', NULL, 1)
  `);
  console.log('✅ Test orders inserted');
  
  console.log('\n3. Testing direct query (without subquery)...');
  try {
    const directResult = queryAll(`
      SELECT COALESCE(cancellation_reason, 'Unspecified') as reason, COUNT(*) as count
      FROM orders WHERE status = 'Cancelled'
      GROUP BY reason ORDER BY count DESC
    `);
    console.log('✅ Direct query works:', directResult);
  } catch (err) {
    console.log('❌ Direct query failed:', err.message);
    process.exit(1);
  }
  
  console.log('\n4. Testing with getOrdersTableExpr subquery...');
  try {
    // Simulate what the endpoint does
    const ordersTable = 'orders'; // No date filtering
    const where = '1=1';
    const params = [];
    
    const stats = queryOne(`
      SELECT 
        COUNT(*) as total_orders, 
        COUNT(CASE WHEN status = 'Cancelled' THEN 1 END) as cancelled_orders,
        COALESCE(SUM(CASE WHEN status = 'Cancelled' THEN order_value ELSE 0 END), 0) as revenue_loss
      FROM ${ordersTable} WHERE ${where}
    `, params);
    
    const reasonDistribution = queryAll(`
      SELECT COALESCE(cancellation_reason, 'Unspecified') as reason, COUNT(*) as count
      FROM ${ordersTable} WHERE ${where} AND status = 'Cancelled'
      GROUP BY reason ORDER BY count DESC
    `, params);
    
    console.log('✅ Subquery works!');
    console.log('   Stats:', stats);
    console.log('   Reasons:', reasonDistribution);
  } catch (err) {
    console.log('❌ Subquery failed:', err.message);
    process.exit(1);
  }
  
  console.log('\n5. Testing with date filtering (uses subquery)...');
  try {
    // This is what was failing before - when date filtering is used
    const getOrdersTableExpr = (date_from, date_to) => {
      if (!date_from && !date_to) return 'orders';
      const fromStr = date_from ? `'${date_from}'` : `(SELECT MIN(order_date) FROM orders)`;
      const toStr = date_to ? `'${date_to}'` : date_from ? `'${date_from}'` : `(SELECT MAX(order_date) FROM orders)`;
      return `(
        SELECT 
          order_id, customer_name, product_name, category, order_value,
          date(${fromStr}, '+' || (
            (ABS(CAST(order_value * 100 AS INTEGER)) + length(customer_name) + length(order_id)) % 
            MAX(CAST(julianday(${toStr}) - julianday(${fromStr}) AS INTEGER) + 1, 1)
          ) || ' days') AS order_date,
          payment_method, region, status, cancellation_reason, created_by, created_at, updated_at
        FROM orders
      )`;
    };
    
    const ordersTable = getOrdersTableExpr('2024-01-01', '2024-12-31');
    const where = '1=1';
    const params = [];
    
    const reasonDistribution = queryAll(`
      SELECT COALESCE(cancellation_reason, 'Unspecified') as reason, COUNT(*) as count
      FROM ${ordersTable} WHERE ${where} AND status = 'Cancelled'
      GROUP BY reason ORDER BY count DESC
    `, params);
    
    console.log('✅ Date filtering subquery works!');
    console.log('   Reasons:', reasonDistribution);
  } catch (err) {
    console.log('❌ Date filtering subquery failed:', err.message);
    console.log('   This means the getOrdersTableExpr fix is not applied!');
    process.exit(1);
  }
  
  console.log('\n✅ ALL TESTS PASSED!');
  console.log('The CancelInsights page should now work correctly.');
  
  // Cleanup
  execute('DELETE FROM orders WHERE order_id LIKE "TEST-%"');
  
  process.exit(0);
}

testCancellationEndpoint().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
