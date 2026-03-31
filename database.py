"""
Sales Performance Dashboard - Database Management
Days 8-11: SQLite Integration and CRUD Operations

Team: Cyber Guard
Mentor: Anwar Nizami
"""

import sqlite3
import pandas as pd
from datetime import datetime

class SalesDatabase:
    """Handle SQLite database operations for sales orders"""
    
    def __init__(self, db_name='sales_dashboard.db'):
        self.db_name = db_name
        self.conn = None
        self.cursor = None
    
    def connect(self):
        """Establish database connection"""
        self.conn = sqlite3.connect(self.db_name)
        self.cursor = self.conn.cursor()
        return self
    
    def close(self):
        """Close database connection"""
        if self.conn:
            self.conn.close()
    
    def create_tables(self):
        """Create database tables"""
        print("Creating database tables...")
        
        # Orders table
        self.cursor.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            order_id TEXT PRIMARY KEY,
            customer_name TEXT NOT NULL,
            product_name TEXT NOT NULL,
            category TEXT NOT NULL,
            order_value REAL NOT NULL,
            order_date TEXT NOT NULL,
            payment_method TEXT NOT NULL,
            region TEXT NOT NULL,
            status TEXT NOT NULL,
            created_by INTEGER,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
        ''')
        
        self.conn.commit()
        print("✓ Tables created successfully")
        return self
    
    def import_data_from_csv(self, csv_file='cleaned_sales_orders.csv'):
        """Import data from CSV to database"""
        print(f"Importing data from {csv_file}...")
        
        df = pd.read_csv(csv_file)
        
        # Select relevant columns
        columns = ['order_id', 'customer_name', 'product_name', 'category',
                  'order_value', 'order_date', 'payment_method', 'region',
                  'status', 'created_by']
        
        df = df[columns]
        
        # Import to database
        df.to_sql('orders', self.conn, if_exists='replace', index=False)
        
        print(f"✓ Imported {len(df)} records")
        return self
    
    # CREATE operation
    def create_order(self, order_data):
        """Create a new order"""
        try:
            self.cursor.execute('''
            INSERT INTO orders (
                order_id, customer_name, product_name, category,
                order_value, order_date, payment_method, region,
                status, created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                order_data['order_id'],
                order_data['customer_name'],
                order_data['product_name'],
                order_data['category'],
                order_data['order_value'],
                order_data['order_date'],
                order_data['payment_method'],
                order_data['region'],
                order_data['status'],
                order_data.get('created_by', 1)
            ))
            
            self.conn.commit()
            return True, "Order created successfully"
        except sqlite3.IntegrityError:
            return False, "Order ID already exists"
        except Exception as e:
            return False, f"Error: {str(e)}"
    
    # READ operations
    def get_all_orders(self):
        """Retrieve all orders"""
        query = "SELECT * FROM orders ORDER BY order_date DESC"
        df = pd.read_sql_query(query, self.conn)
        return df
    
    def get_order_by_id(self, order_id):
        """Retrieve a specific order by ID"""
        query = "SELECT * FROM orders WHERE order_id = ?"
        df = pd.read_sql_query(query, self.conn, params=(order_id,))
        return df
    
    def search_orders(self, search_term):
        """Search orders by customer name, product, or order ID"""
        query = '''
        SELECT * FROM orders 
        WHERE order_id LIKE ? 
           OR customer_name LIKE ? 
           OR product_name LIKE ?
        ORDER BY order_date DESC
        '''
        search_pattern = f"%{search_term}%"
        df = pd.read_sql_query(query, self.conn, 
                               params=(search_pattern, search_pattern, search_pattern))
        return df
    
    def filter_orders(self, filters):
        """Filter orders based on criteria"""
        query = "SELECT * FROM orders WHERE 1=1"
        params = []
        
        if 'category' in filters and filters['category']:
            query += " AND category = ?"
            params.append(filters['category'])
        
        if 'status' in filters and filters['status']:
            query += " AND status = ?"
            params.append(filters['status'])
        
        if 'date_from' in filters and filters['date_from']:
            query += " AND order_date >= ?"
            params.append(filters['date_from'])
        
        if 'date_to' in filters and filters['date_to']:
            query += " AND order_date <= ?"
            params.append(filters['date_to'])
        
        query += " ORDER BY order_date DESC"
        
        df = pd.read_sql_query(query, self.conn, params=params)
        return df
    
    # UPDATE operation
    def update_order(self, order_id, update_data):
        """Update an existing order"""
        try:
            # Build dynamic update query
            set_clause = ", ".join([f"{key} = ?" for key in update_data.keys()])
            set_clause += ", updated_at = CURRENT_TIMESTAMP"
            
            query = f"UPDATE orders SET {set_clause} WHERE order_id = ?"
            params = list(update_data.values()) + [order_id]
            
            self.cursor.execute(query, params)
            self.conn.commit()
            
            if self.cursor.rowcount > 0:
                return True, "Order updated successfully"
            else:
                return False, "Order not found"
        except Exception as e:
            return False, f"Error: {str(e)}"
    
    # DELETE operation
    def delete_order(self, order_id):
        """Delete an order"""
        try:
            self.cursor.execute("DELETE FROM orders WHERE order_id = ?", (order_id,))
            self.conn.commit()
            
            if self.cursor.rowcount > 0:
                return True, "Order deleted successfully"
            else:
                return False, "Order not found"
        except Exception as e:
            return False, f"Error: {str(e)}"
    
    # Analytics queries
    def get_revenue_by_category(self):
        """Get revenue grouped by category"""
        query = '''
        SELECT category, 
               SUM(order_value) as total_revenue,
               COUNT(*) as order_count,
               AVG(order_value) as avg_order_value
        FROM orders
        GROUP BY category
        ORDER BY total_revenue DESC
        '''
        df = pd.read_sql_query(query, self.conn)
        return df
    
    def get_monthly_revenue(self):
        """Get monthly revenue trends"""
        query = '''
        SELECT strftime('%Y-%m', order_date) as month,
               SUM(order_value) as total_revenue,
               COUNT(*) as order_count
        FROM orders
        GROUP BY month
        ORDER BY month
        '''
        df = pd.read_sql_query(query, self.conn)
        return df
    
    def get_top_customers(self, limit=10):
        """Get top customers by revenue"""
        query = '''
        SELECT customer_name,
               SUM(order_value) as total_revenue,
               COUNT(*) as order_count
        FROM orders
        GROUP BY customer_name
        ORDER BY total_revenue DESC
        LIMIT ?
        '''
        df = pd.read_sql_query(query, self.conn, params=(limit,))
        return df
    
    def get_order_statistics(self):
        """Get overall order statistics"""
        query = '''
        SELECT 
            COUNT(*) as total_orders,
            SUM(order_value) as total_revenue,
            AVG(order_value) as avg_order_value,
            MIN(order_value) as min_order_value,
            MAX(order_value) as max_order_value,
            COUNT(DISTINCT customer_name) as unique_customers,
            COUNT(DISTINCT product_name) as unique_products
        FROM orders
        '''
        df = pd.read_sql_query(query, self.conn)
        return df


def initialize_database():
    """Initialize database with data"""
    print("="*60)
    print("SALES PERFORMANCE DASHBOARD")
    print("Database Initialization - Days 8-9")
    print("Team: Cyber Guard | Mentor: Anwar Nizami")
    print("="*60)
    
    db = SalesDatabase()
    db.connect()
    db.create_tables()
    db.import_data_from_csv()
    
    # Display statistics
    stats = db.get_order_statistics()
    print("\n📊 Database Statistics:")
    print(f"  Total Orders: {stats['total_orders'].values[0]}")
    print(f"  Total Revenue: ${stats['total_revenue'].values[0]:,.2f}")
    print(f"  Unique Customers: {stats['unique_customers'].values[0]}")
    print(f"  Unique Products: {stats['unique_products'].values[0]}")
    
    db.close()
    print("\n✓ Database initialized successfully!")


def test_crud_operations():
    """Test CRUD operations"""
    print("\n" + "="*60)
    print("Testing CRUD Operations - Days 10-11")
    print("="*60)
    
    db = SalesDatabase()
    db.connect()
    
    # Test CREATE
    print("\n1. Testing CREATE operation...")
    new_order = {
        'order_id': 'ORD-TEST-001',
        'customer_name': 'Test Customer',
        'product_name': 'Test Product',
        'category': 'Electronics',
        'order_value': 199.99,
        'order_date': '2025-12-31',
        'payment_method': 'Card',
        'region': 'North',
        'status': 'Pending',
        'created_by': 1
    }
    
    success, message = db.create_order(new_order)
    print(f"  {'✓' if success else '✗'} {message}")
    
    # Test READ
    print("\n2. Testing READ operation...")
    order = db.get_order_by_id('ORD-TEST-001')
    if not order.empty:
        print(f"  ✓ Order retrieved: {order['order_id'].values[0]}")
    else:
        print("  ✗ Order not found")
    
    # Test UPDATE
    print("\n3. Testing UPDATE operation...")
    update_data = {
        'status': 'Completed',
        'order_value': 249.99
    }
    success, message = db.update_order('ORD-TEST-001', update_data)
    print(f"  {'✓' if success else '✗'} {message}")
    
    # Verify update
    order = db.get_order_by_id('ORD-TEST-001')
    if not order.empty:
        print(f"  ✓ Updated status: {order['status'].values[0]}")
        print(f"  ✓ Updated value: ${order['order_value'].values[0]:.2f}")
    
    # Test DELETE
    print("\n4. Testing DELETE operation...")
    success, message = db.delete_order('ORD-TEST-001')
    print(f"  {'✓' if success else '✗'} {message}")
    
    # Verify deletion
    order = db.get_order_by_id('ORD-TEST-001')
    if order.empty:
        print("  ✓ Order successfully deleted")
    else:
        print("  ✗ Order still exists")
    
    db.close()
    print("\n✓ CRUD operations test completed!")


if __name__ == "__main__":
    initialize_database()
    test_crud_operations()
