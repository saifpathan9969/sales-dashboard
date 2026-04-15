// Quick verification script to check if the cancellation_reason column exists
const { initDb, queryAll } = require('./db');

async function verifyFix() {
  console.log('Initializing database...');
  await initDb();
  
  console.log('\nChecking orders table schema...');
  const tableInfo = queryAll('PRAGMA table_info(orders)');
  
  console.log('\nOrders table columns:');
  tableInfo.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });
  
  const hasCancellationReason = tableInfo.some(col => col.name === 'cancellation_reason');
  
  if (hasCancellationReason) {
    console.log('\n✅ SUCCESS: cancellation_reason column exists!');
    console.log('The CancelInsights page should now load correctly.');
  } else {
    console.log('\n❌ ERROR: cancellation_reason column is missing!');
  }
  
  process.exit(0);
}

verifyFix().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
