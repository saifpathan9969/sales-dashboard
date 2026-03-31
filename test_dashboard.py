"""
Sales Performance Dashboard - Testing & Optimization
Day 13: Test dashboard functionality and optimize performance

Team: Cyber Guard
Mentor: Anwar Nizami
"""

import pandas as pd
import time
from database import SalesDatabase

def test_data_loading():
    """Test data loading performance"""
    print("\n" + "="*60)
    print("TEST 1: Data Loading Performance")
    print("="*60)
    
    start_time = time.time()
    
    db = SalesDatabase()
    db.connect()
    df = db.get_all_orders()
    db.close()
    
    load_time = time.time() - start_time
    
    print(f"✓ Loaded {len(df)} records in {load_time:.3f} seconds")
    print(f"✓ Memory usage: {df.memory_usage(deep=True).sum() / 1024:.2f} KB")
    
    return load_time < 1.0  # Should load in under 1 second

def test_kpi_calculations():
    """Test KPI calculation accuracy"""
    print("\n" + "="*60)
    print("TEST 2: KPI Calculation Accuracy")
    print("="*60)
    
    df = pd.read_csv('transformed_sales_orders.csv')
    
    # Test total revenue
    total_revenue = df['revenue'].sum()
    expected_revenue = 29020.07
    revenue_match = abs(total_revenue - expected_revenue) < 1.0
    
    print(f"{'✓' if revenue_match else '✗'} Total Revenue: ${total_revenue:.2f} (Expected: ${expected_revenue:.2f})")
    
    # Test total orders
    total_orders = len(df)
    expected_orders = 180
    orders_match = total_orders == expected_orders
    
    print(f"{'✓' if orders_match else '✗'} Total Orders: {total_orders} (Expected: {expected_orders})")
    
    # Test average order value
    avg_order_value = df['revenue'].mean()
    expected_aov = 161.22
    aov_match = abs(avg_order_value - expected_aov) < 1.0
    
    print(f"{'✓' if aov_match else '✗'} Avg Order Value: ${avg_order_value:.2f} (Expected: ${expected_aov:.2f})")
    
    return revenue_match and orders_match and aov_match

def test_filtering():
    """Test data filtering functionality"""
    print("\n" + "="*60)
    print("TEST 3: Data Filtering")
    print("="*60)
    
    db = SalesDatabase()
    db.connect()
    
    # Test category filter
    filters = {'category': 'Electronics'}
    filtered_df = db.filter_orders(filters)
    electronics_count = len(filtered_df)
    
    print(f"✓ Electronics orders: {electronics_count}")
    
    # Test status filter
    filters = {'status': 'Completed'}
    filtered_df = db.filter_orders(filters)
    completed_count = len(filtered_df)
    
    print(f"✓ Completed orders: {completed_count}")
    
    # Test combined filters
    filters = {'category': 'Fashion', 'status': 'Completed'}
    filtered_df = db.filter_orders(filters)
    combined_count = len(filtered_df)
    
    print(f"✓ Completed Fashion orders: {combined_count}")
    
    db.close()
    
    return electronics_count > 0 and completed_count > 0

def test_crud_operations():
    """Test CRUD operations"""
    print("\n" + "="*60)
    print("TEST 4: CRUD Operations")
    print("="*60)
    
    db = SalesDatabase()
    db.connect()
    
    test_order_id = 'ORD-TEST-999'
    
    # Test CREATE
    new_order = {
        'order_id': test_order_id,
        'customer_name': 'Test User',
        'product_name': 'Test Product',
        'category': 'Electronics',
        'order_value': 299.99,
        'order_date': '2025-12-31',
        'payment_method': 'Card',
        'region': 'North',
        'status': 'Pending',
        'created_by': 1
    }
    
    success, message = db.create_order(new_order)
    print(f"{'✓' if success else '✗'} CREATE: {message}")
    create_success = success
    
    # Test READ
    order = db.get_order_by_id(test_order_id)
    read_success = not order.empty
    print(f"{'✓' if read_success else '✗'} READ: Order retrieved")
    
    # Test UPDATE
    update_data = {'status': 'Completed', 'order_value': 349.99}
    success, message = db.update_order(test_order_id, update_data)
    print(f"{'✓' if success else '✗'} UPDATE: {message}")
    update_success = success
    
    # Test DELETE
    success, message = db.delete_order(test_order_id)
    print(f"{'✓' if success else '✗'} DELETE: {message}")
    delete_success = success
    
    db.close()
    
    return create_success and read_success and update_success and delete_success

def test_search_functionality():
    """Test search functionality"""
    print("\n" + "="*60)
    print("TEST 5: Search Functionality")
    print("="*60)
    
    db = SalesDatabase()
    db.connect()
    
    # Test search by customer
    results = db.search_orders('Emma')
    print(f"✓ Search 'Emma': {len(results)} results")
    
    # Test search by product
    results = db.search_orders('Backpack')
    print(f"✓ Search 'Backpack': {len(results)} results")
    
    # Test search by order ID
    results = db.search_orders('ORD-1001')
    print(f"✓ Search 'ORD-1001': {len(results)} results")
    
    db.close()
    
    return True

def test_analytics_queries():
    """Test analytics queries"""
    print("\n" + "="*60)
    print("TEST 6: Analytics Queries")
    print("="*60)
    
    db = SalesDatabase()
    db.connect()
    
    # Test revenue by category
    category_revenue = db.get_revenue_by_category()
    print(f"✓ Revenue by category: {len(category_revenue)} categories")
    
    # Test monthly revenue
    monthly_revenue = db.get_monthly_revenue()
    print(f"✓ Monthly revenue: {len(monthly_revenue)} months")
    
    # Test top customers
    top_customers = db.get_top_customers(5)
    print(f"✓ Top customers: {len(top_customers)} customers")
    
    # Test statistics
    stats = db.get_order_statistics()
    print(f"✓ Statistics calculated: {len(stats.columns)} metrics")
    
    db.close()
    
    return True

def run_all_tests():
    """Run all tests and generate report"""
    print("="*60)
    print("SALES PERFORMANCE DASHBOARD")
    print("Testing & Optimization - Day 13")
    print("Team: Cyber Guard | Mentor: Anwar Nizami")
    print("="*60)
    
    tests = [
        ("Data Loading Performance", test_data_loading),
        ("KPI Calculation Accuracy", test_kpi_calculations),
        ("Data Filtering", test_filtering),
        ("CRUD Operations", test_crud_operations),
        ("Search Functionality", test_search_functionality),
        ("Analytics Queries", test_analytics_queries)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n✗ Error in {test_name}: {str(e)}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "="*60)
    print("TEST SUMMARY")
    print("="*60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed ({passed/total*100:.1f}%)")
    
    if passed == total:
        print("\n🎉 All tests passed! Dashboard is ready for deployment.")
    else:
        print("\n⚠️ Some tests failed. Please review and fix issues.")

if __name__ == "__main__":
    run_all_tests()
