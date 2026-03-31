"""
Quick visualization of time-series data
Optional script to preview the transformed data
"""

import pandas as pd
import matplotlib.pyplot as plt

def visualize_monthly_trends():
    """Visualize monthly revenue and order trends"""
    
    # Load monthly time series
    monthly_df = pd.read_csv('monthly_time_series.csv')
    
    print("="*60)
    print("MONTHLY TIME SERIES PREVIEW")
    print("="*60)
    print(monthly_df.to_string(index=False))
    print("\n")
    
    # Create figure with subplots
    fig, axes = plt.subplots(2, 1, figsize=(12, 8))
    
    # Plot 1: Monthly Revenue
    axes[0].plot(monthly_df['year_month'], monthly_df['total_revenue'], 
                 marker='o', linewidth=2, markersize=8, color='#2E86AB')
    axes[0].set_title('Monthly Revenue Trend', fontsize=14, fontweight='bold')
    axes[0].set_xlabel('Month', fontsize=12)
    axes[0].set_ylabel('Total Revenue ($)', fontsize=12)
    axes[0].grid(True, alpha=0.3)
    axes[0].tick_params(axis='x', rotation=45)
    
    # Plot 2: Monthly Orders
    axes[1].bar(monthly_df['year_month'], monthly_df['total_orders'], 
                color='#A23B72', alpha=0.7)
    axes[1].set_title('Monthly Order Volume', fontsize=14, fontweight='bold')
    axes[1].set_xlabel('Month', fontsize=12)
    axes[1].set_ylabel('Total Orders', fontsize=12)
    axes[1].grid(True, alpha=0.3, axis='y')
    axes[1].tick_params(axis='x', rotation=45)
    
    plt.tight_layout()
    plt.savefig('monthly_trends.png', dpi=300, bbox_inches='tight')
    print("✓ Monthly trends chart saved as 'monthly_trends.png'")
    
    return monthly_df

def show_summary_statistics():
    """Display summary statistics from transformed data"""
    
    # Load transformed data
    df = pd.read_csv('transformed_sales_orders.csv')
    
    print("\n" + "="*60)
    print("SUMMARY STATISTICS")
    print("="*60)
    
    print("\nRevenue by Category:")
    category_revenue = df.groupby('category')['revenue'].agg(['sum', 'count', 'mean'])
    category_revenue.columns = ['Total Revenue', 'Order Count', 'Avg Order Value']
    category_revenue = category_revenue.sort_values('Total Revenue', ascending=False)
    print(category_revenue.to_string())
    
    print("\n\nRevenue by Status:")
    status_revenue = df.groupby('status')['revenue'].agg(['sum', 'count'])
    status_revenue.columns = ['Total Revenue', 'Order Count']
    print(status_revenue.to_string())
    
    print("\n\nTop 5 Customers by Revenue:")
    top_customers = df.groupby('customer_name')['revenue'].sum().sort_values(ascending=False).head()
    print(top_customers.to_string())
    
    print("\n\nTop 5 Products by Revenue:")
    top_products = df.groupby('product_name')['revenue'].sum().sort_values(ascending=False).head()
    print(top_products.to_string())

if __name__ == "__main__":
    try:
        # Visualize monthly trends
        monthly_df = visualize_monthly_trends()
        
        # Show summary statistics
        show_summary_statistics()
        
        print("\n✓ Visualization and analysis complete!")
        
    except FileNotFoundError as e:
        print(f"✗ Error: Required file not found - {e}")
        print("  Please run feature_engineering.py first")
    except Exception as e:
        print(f"✗ Error: {e}")
