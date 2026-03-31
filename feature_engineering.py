"""
Sales Performance Dashboard - Feature Engineering & Data Transformation
Day 3 Task: Create derived fields and prepare data for analytics

Team: Cyber Guard
Mentor: Anwar Nizami
"""

import pandas as pd
import numpy as np
from datetime import datetime
import os

class FeatureEngineer:
    """Handle feature engineering and data transformation operations"""
    
    def __init__(self, input_file):
        self.input_file = input_file
        self.df = None
        self.feature_report = {
            'original_columns': 0,
            'new_features_added': 0,
            'time_features': [],
            'business_features': [],
            'aggregation_features': []
        }
    
    def load_data(self):
        """Load the cleaned dataset"""
        print(f"Loading cleaned data from {self.input_file}...")
        self.df = pd.read_csv(self.input_file)
        
        # Convert date column to datetime if not already
        if 'order_date' in self.df.columns:
            self.df['order_date'] = pd.to_datetime(self.df['order_date'])
        
        self.feature_report['original_columns'] = len(self.df.columns)
        print(f"✓ Loaded {len(self.df)} records with {len(self.df.columns)} columns")
        return self
    
    def calculate_revenue(self):
        """Calculate revenue per order (Revenue = order_value in this dataset)"""
        print("\n--- Calculating Revenue per Order ---")
        
        # In this dataset, order_value already represents the revenue
        # But we'll create a dedicated revenue column for clarity
        if 'order_value' in self.df.columns:
            self.df['revenue'] = self.df['order_value']
            self.feature_report['business_features'].append('revenue')
            self.feature_report['new_features_added'] += 1
            
            print(f"  ✓ Revenue column created")
            print(f"    - Total Revenue: ${self.df['revenue'].sum():,.2f}")
            print(f"    - Average Revenue per Order: ${self.df['revenue'].mean():.2f}")
            print(f"    - Min Revenue: ${self.df['revenue'].min():.2f}")
            print(f"    - Max Revenue: ${self.df['revenue'].max():.2f}")
        
        return self
    
    def extract_time_features(self):
        """Extract comprehensive time-based features"""
        print("\n--- Extracting Time Features ---")
        
        if 'order_date' not in self.df.columns:
            print("  ✗ Error: order_date column not found")
            return self
        
        # Year
        self.df['year'] = self.df['order_date'].dt.year
        self.feature_report['time_features'].append('year')
        print(f"  ✓ Extracted year")
        
        # Month (numeric)
        self.df['month'] = self.df['order_date'].dt.month
        self.feature_report['time_features'].append('month')
        print(f"  ✓ Extracted month (numeric)")
        
        # Month name
        self.df['month_name'] = self.df['order_date'].dt.strftime('%B')
        self.feature_report['time_features'].append('month_name')
        print(f"  ✓ Extracted month name")
        
        # Week number
        self.df['week_number'] = self.df['order_date'].dt.isocalendar().week
        self.feature_report['time_features'].append('week_number')
        print(f"  ✓ Extracted week number (1-52)")
        
        # Quarter
        self.df['quarter'] = self.df['order_date'].dt.quarter
        self.feature_report['time_features'].append('quarter')
        print(f"  ✓ Extracted quarter (Q1-Q4)")
        
        # Day of week
        self.df['day_of_week'] = self.df['order_date'].dt.day_name()
        self.feature_report['time_features'].append('day_of_week')
        print(f"  ✓ Extracted day of week")
        
        # Day of week number (0=Monday, 6=Sunday)
        self.df['day_of_week_num'] = self.df['order_date'].dt.dayofweek
        self.feature_report['time_features'].append('day_of_week_num')
        print(f"  ✓ Extracted day of week number")
        
        # Day of month
        self.df['day_of_month'] = self.df['order_date'].dt.day
        self.feature_report['time_features'].append('day_of_month')
        print(f"  ✓ Extracted day of month")
        
        # Is weekend flag
        self.df['is_weekend'] = self.df['day_of_week_num'].isin([5, 6]).astype(int)
        self.feature_report['time_features'].append('is_weekend')
        print(f"  ✓ Created weekend flag")
        
        # Year-Month for time series
        self.df['year_month'] = self.df['order_date'].dt.to_period('M').astype(str)
        self.feature_report['time_features'].append('year_month')
        print(f"  ✓ Created year-month period")
        
        # Year-Week for weekly analysis
        self.df['year_week'] = self.df['order_date'].dt.strftime('%Y-W%U')
        self.feature_report['time_features'].append('year_week')
        print(f"  ✓ Created year-week identifier")
        
        self.feature_report['new_features_added'] += len(self.feature_report['time_features'])
        
        return self
    
    def create_business_features(self):
        """Create business-specific derived features"""
        print("\n--- Creating Business Features ---")
        
        # Revenue bins (categorize orders by value)
        self.df['revenue_category'] = pd.cut(
            self.df['revenue'],
            bins=[0, 50, 100, 200, float('inf')],
            labels=['Low (<$50)', 'Medium ($50-$100)', 'High ($100-$200)', 'Premium (>$200)']
        )
        self.feature_report['business_features'].append('revenue_category')
        print(f"  ✓ Created revenue category bins")
        
        # Order status binary flags
        self.df['is_completed'] = (self.df['status'] == 'Completed').astype(int)
        self.df['is_pending'] = (self.df['status'] == 'Pending').astype(int)
        self.df['is_cancelled'] = (self.df['status'] == 'Cancelled').astype(int)
        self.feature_report['business_features'].extend(['is_completed', 'is_pending', 'is_cancelled'])
        print(f"  ✓ Created order status flags")
        
        # Payment method flags
        payment_methods = self.df['payment_method'].unique()
        for method in payment_methods:
            col_name = f'payment_{method.lower().replace(" ", "_")}'
            self.df[col_name] = (self.df['payment_method'] == method).astype(int)
            self.feature_report['business_features'].append(col_name)
        print(f"  ✓ Created payment method flags")
        
        # Region flags
        regions = self.df['region'].unique()
        for region in regions:
            col_name = f'region_{region.lower()}'
            self.df[col_name] = (self.df['region'] == region).astype(int)
            self.feature_report['business_features'].append(col_name)
        print(f"  ✓ Created region flags")
        
        self.feature_report['new_features_added'] += len(self.feature_report['business_features'])
        
        return self
    
    def create_aggregation_features(self):
        """Create customer and product aggregation features"""
        print("\n--- Creating Aggregation Features ---")
        
        # Customer-level aggregations
        customer_stats = self.df.groupby('customer_name').agg({
            'order_id': 'count',
            'revenue': 'sum'
        }).rename(columns={
            'order_id': 'customer_order_count',
            'revenue': 'customer_total_revenue'
        })
        
        self.df = self.df.merge(customer_stats, on='customer_name', how='left')
        self.feature_report['aggregation_features'].extend(['customer_order_count', 'customer_total_revenue'])
        print(f"  ✓ Added customer aggregation features")
        
        # Product-level aggregations
        product_stats = self.df.groupby('product_name').agg({
            'order_id': 'count',
            'revenue': 'sum'
        }).rename(columns={
            'order_id': 'product_order_count',
            'revenue': 'product_total_revenue'
        })
        
        self.df = self.df.merge(product_stats, on='product_name', how='left')
        self.feature_report['aggregation_features'].extend(['product_order_count', 'product_total_revenue'])
        print(f"  ✓ Added product aggregation features")
        
        # Category-level aggregations
        category_stats = self.df.groupby('category').agg({
            'order_id': 'count',
            'revenue': 'sum'
        }).rename(columns={
            'order_id': 'category_order_count',
            'revenue': 'category_total_revenue'
        })
        
        self.df = self.df.merge(category_stats, on='category', how='left')
        self.feature_report['aggregation_features'].extend(['category_order_count', 'category_total_revenue'])
        print(f"  ✓ Added category aggregation features")
        
        self.feature_report['new_features_added'] += len(self.feature_report['aggregation_features'])
        
        return self
    
    def prepare_time_series_data(self):
        """Prepare aggregated data for time-series analysis"""
        print("\n--- Preparing Time-Series Data ---")
        
        # Monthly aggregation
        monthly_data = self.df.groupby('year_month').agg({
            'order_id': 'count',
            'revenue': 'sum'
        }).rename(columns={
            'order_id': 'total_orders',
            'revenue': 'total_revenue'
        }).reset_index()
        
        monthly_data['avg_order_value'] = monthly_data['total_revenue'] / monthly_data['total_orders']
        
        # Save monthly time series
        monthly_data.to_csv('monthly_time_series.csv', index=False)
        print(f"  ✓ Created monthly time series ({len(monthly_data)} periods)")
        
        # Weekly aggregation
        weekly_data = self.df.groupby('year_week').agg({
            'order_id': 'count',
            'revenue': 'sum'
        }).rename(columns={
            'order_id': 'total_orders',
            'revenue': 'total_revenue'
        }).reset_index()
        
        weekly_data['avg_order_value'] = weekly_data['total_revenue'] / weekly_data['total_orders']
        
        # Save weekly time series
        weekly_data.to_csv('weekly_time_series.csv', index=False)
        print(f"  ✓ Created weekly time series ({len(weekly_data)} periods)")
        
        # Daily aggregation
        daily_data = self.df.groupby('order_date').agg({
            'order_id': 'count',
            'revenue': 'sum'
        }).rename(columns={
            'order_id': 'total_orders',
            'revenue': 'total_revenue'
        }).reset_index()
        
        daily_data['avg_order_value'] = daily_data['total_revenue'] / daily_data['total_orders']
        
        # Save daily time series
        daily_data.to_csv('daily_time_series.csv', index=False)
        print(f"  ✓ Created daily time series ({len(daily_data)} periods)")
        
        return self
    
    def generate_feature_report(self):
        """Generate and display feature engineering report"""
        print("\n" + "="*60)
        print("FEATURE ENGINEERING REPORT")
        print("="*60)
        print(f"Original Columns: {self.feature_report['original_columns']}")
        print(f"Final Columns: {len(self.df.columns)}")
        print(f"New Features Added: {self.feature_report['new_features_added']}")
        
        print(f"\nTime Features ({len(self.feature_report['time_features'])}):")
        for feature in self.feature_report['time_features']:
            print(f"  - {feature}")
        
        print(f"\nBusiness Features ({len(self.feature_report['business_features'])}):")
        for feature in self.feature_report['business_features']:
            print(f"  - {feature}")
        
        print(f"\nAggregation Features ({len(self.feature_report['aggregation_features'])}):")
        for feature in self.feature_report['aggregation_features']:
            print(f"  - {feature}")
        
        print("\nDataset Shape:", self.df.shape)
        print("="*60)
    
    def save_transformed_data(self, output_file):
        """Save the transformed dataset"""
        print(f"\nSaving transformed data to {output_file}...")
        self.df.to_csv(output_file, index=False)
        print(f"✓ Transformed dataset saved successfully")
        return self
    
    def get_dataframe(self):
        """Return the transformed dataframe"""
        return self.df


def main():
    """Main execution function"""
    print("="*60)
    print("SALES PERFORMANCE DASHBOARD")
    print("Feature Engineering & Data Transformation - Day 3")
    print("Team: Cyber Guard | Mentor: Anwar Nizami")
    print("="*60)
    
    # File paths
    input_file = 'cleaned_sales_orders.csv'
    output_file = 'transformed_sales_orders.csv'
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"✗ Error: Input file '{input_file}' not found")
        print("  Please run data_cleaning.py first (Day 2)")
        return
    
    # Initialize feature engineer and run transformation pipeline
    engineer = FeatureEngineer(input_file)
    
    # Execute feature engineering pipeline
    engineer.load_data() \
            .calculate_revenue() \
            .extract_time_features() \
            .create_business_features() \
            .create_aggregation_features() \
            .prepare_time_series_data() \
            .save_transformed_data(output_file)
    
    # Generate final report
    engineer.generate_feature_report()
    
    # Display sample of transformed data
    print("\n--- Sample of Transformed Data (First 3 Records) ---")
    print(engineer.get_dataframe().head(3).T)
    
    print("\n✓ Feature engineering completed successfully!")
    print(f"✓ Transformed dataset available at: {output_file}")
    print(f"✓ Time-series data files created:")
    print(f"  - monthly_time_series.csv")
    print(f"  - weekly_time_series.csv")
    print(f"  - daily_time_series.csv")


if __name__ == "__main__":
    main()
