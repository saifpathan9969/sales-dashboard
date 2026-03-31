"""
Sales Performance Dashboard - KPI Calculator
Day 4 Task: Compute and validate Key Performance Indicators

Team: Cyber Guard
Mentor: Anwar Nizami
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta

class KPICalculator:
    """Calculate and validate Key Performance Indicators"""
    
    def __init__(self, data_file):
        self.data_file = data_file
        self.df = None
        self.kpis = {}
        
    def load_data(self):
        """Load transformed dataset"""
        print(f"Loading data from {self.data_file}...")
        self.df = pd.read_csv(self.data_file)
        self.df['order_date'] = pd.to_datetime(self.df['order_date'])
        print(f"✓ Loaded {len(self.df)} records")
        return self
    
    def calculate_total_revenue(self):
        """Calculate total revenue from all orders"""
        print("\n--- Calculating Total Revenue ---")
        
        # Total revenue (all orders)
        total_revenue = self.df['revenue'].sum()
        self.kpis['total_revenue'] = total_revenue
        
        # Revenue by status
        completed_revenue = self.df[self.df['status'] == 'Completed']['revenue'].sum()
        pending_revenue = self.df[self.df['status'] == 'Pending']['revenue'].sum()
        cancelled_revenue = self.df[self.df['status'] == 'Cancelled']['revenue'].sum()
        
        self.kpis['completed_revenue'] = completed_revenue
        self.kpis['pending_revenue'] = pending_revenue
        self.kpis['cancelled_revenue'] = cancelled_revenue
        
        print(f"  Total Revenue (All): ${total_revenue:,.2f}")
        print(f"  Completed Orders: ${completed_revenue:,.2f}")
        print(f"  Pending Orders: ${pending_revenue:,.2f}")
        print(f"  Cancelled Orders: ${cancelled_revenue:,.2f}")
        
        return self
    
    def calculate_total_orders(self):
        """Calculate total number of orders"""
        print("\n--- Calculating Total Orders ---")
        
        total_orders = len(self.df)
        self.kpis['total_orders'] = total_orders
        
        # Orders by status
        completed_orders = len(self.df[self.df['status'] == 'Completed'])
        pending_orders = len(self.df[self.df['status'] == 'Pending'])
        cancelled_orders = len(self.df[self.df['status'] == 'Cancelled'])
        
        self.kpis['completed_orders'] = completed_orders
        self.kpis['pending_orders'] = pending_orders
        self.kpis['cancelled_orders'] = cancelled_orders
        
        print(f"  Total Orders: {total_orders}")
        print(f"  Completed: {completed_orders} ({completed_orders/total_orders*100:.1f}%)")
        print(f"  Pending: {pending_orders} ({pending_orders/total_orders*100:.1f}%)")
        print(f"  Cancelled: {cancelled_orders} ({cancelled_orders/total_orders*100:.1f}%)")
        
        return self
    
    def calculate_average_order_value(self):
        """Calculate average order value"""
        print("\n--- Calculating Average Order Value ---")
        
        avg_order_value = self.df['revenue'].mean()
        self.kpis['avg_order_value'] = avg_order_value
        
        # AOV by status
        completed_aov = self.df[self.df['status'] == 'Completed']['revenue'].mean()
        pending_aov = self.df[self.df['status'] == 'Pending']['revenue'].mean()
        
        self.kpis['completed_aov'] = completed_aov
        self.kpis['pending_aov'] = pending_aov
        
        print(f"  Average Order Value (All): ${avg_order_value:.2f}")
        print(f"  Completed Orders AOV: ${completed_aov:.2f}")
        print(f"  Pending Orders AOV: ${pending_aov:.2f}")
        
        return self
    
    def calculate_sales_growth_rate(self):
        """Calculate sales growth rate (month-over-month)"""
        print("\n--- Calculating Sales Growth Rate ---")
        
        # Load monthly time series
        monthly_df = pd.read_csv('monthly_time_series.csv')
        monthly_df = monthly_df.sort_values('year_month')
        
        if len(monthly_df) < 2:
            print("  ⚠ Not enough data for growth calculation")
            self.kpis['sales_growth_rate'] = 0
            return self
        
        # Calculate month-over-month growth
        monthly_df['revenue_growth'] = monthly_df['total_revenue'].pct_change() * 100
        
        # Latest month growth
        latest_growth = monthly_df['revenue_growth'].iloc[-1]
        avg_growth = monthly_df['revenue_growth'].mean()
        
        self.kpis['latest_month_growth'] = latest_growth
        self.kpis['avg_monthly_growth'] = avg_growth
        
        print(f"  Latest Month Growth: {latest_growth:.2f}%")
        print(f"  Average Monthly Growth: {avg_growth:.2f}%")
        
        # Year-over-year (if applicable)
        first_month_revenue = monthly_df['total_revenue'].iloc[0]
        last_month_revenue = monthly_df['total_revenue'].iloc[-1]
        period_growth = ((last_month_revenue - first_month_revenue) / first_month_revenue) * 100
        
        self.kpis['period_growth'] = period_growth
        print(f"  Period Growth (First to Last): {period_growth:.2f}%")
        
        return self
    
    def calculate_additional_kpis(self):
        """Calculate additional business KPIs"""
        print("\n--- Calculating Additional KPIs ---")
        
        # Completion rate
        completion_rate = (self.kpis['completed_orders'] / self.kpis['total_orders']) * 100
        self.kpis['completion_rate'] = completion_rate
        print(f"  Order Completion Rate: {completion_rate:.2f}%")
        
        # Cancellation rate
        cancellation_rate = (self.kpis['cancelled_orders'] / self.kpis['total_orders']) * 100
        self.kpis['cancellation_rate'] = cancellation_rate
        print(f"  Order Cancellation Rate: {cancellation_rate:.2f}%")
        
        # Revenue per day
        date_range = (self.df['order_date'].max() - self.df['order_date'].min()).days + 1
        revenue_per_day = self.kpis['total_revenue'] / date_range
        self.kpis['revenue_per_day'] = revenue_per_day
        print(f"  Average Revenue per Day: ${revenue_per_day:.2f}")
        
        # Orders per day
        orders_per_day = self.kpis['total_orders'] / date_range
        self.kpis['orders_per_day'] = orders_per_day
        print(f"  Average Orders per Day: {orders_per_day:.2f}")
        
        # Unique customers
        unique_customers = self.df['customer_name'].nunique()
        self.kpis['unique_customers'] = unique_customers
        print(f"  Unique Customers: {unique_customers}")
        
        # Customer lifetime value
        customer_ltv = self.kpis['total_revenue'] / unique_customers
        self.kpis['customer_ltv'] = customer_ltv
        print(f"  Average Customer Lifetime Value: ${customer_ltv:.2f}")
        
        return self
    
    def validate_kpis(self):
        """Validate KPI calculations"""
        print("\n--- Validating KPI Calculations ---")
        
        # Validation 1: Revenue sum check
        manual_revenue = self.df['order_value'].sum()
        calculated_revenue = self.kpis['total_revenue']
        revenue_match = abs(manual_revenue - calculated_revenue) < 0.01
        
        print(f"  Revenue Validation: {'✓ PASS' if revenue_match else '✗ FAIL'}")
        print(f"    Manual: ${manual_revenue:.2f}, Calculated: ${calculated_revenue:.2f}")
        
        # Validation 2: Order count check
        manual_count = len(self.df)
        calculated_count = self.kpis['total_orders']
        count_match = manual_count == calculated_count
        
        print(f"  Order Count Validation: {'✓ PASS' if count_match else '✗ FAIL'}")
        print(f"    Manual: {manual_count}, Calculated: {calculated_count}")
        
        # Validation 3: AOV check
        manual_aov = self.df['revenue'].mean()
        calculated_aov = self.kpis['avg_order_value']
        aov_match = abs(manual_aov - calculated_aov) < 0.01
        
        print(f"  AOV Validation: {'✓ PASS' if aov_match else '✗ FAIL'}")
        print(f"    Manual: ${manual_aov:.2f}, Calculated: ${calculated_aov:.2f}")
        
        # Validation 4: Status totals
        status_total = (self.kpis['completed_orders'] + 
                       self.kpis['pending_orders'] + 
                       self.kpis['cancelled_orders'])
        status_match = status_total == self.kpis['total_orders']
        
        print(f"  Status Totals Validation: {'✓ PASS' if status_match else '✗ FAIL'}")
        print(f"    Sum: {status_total}, Total: {self.kpis['total_orders']}")
        
        return self
    
    def generate_kpi_report(self):
        """Generate comprehensive KPI report"""
        print("\n" + "="*60)
        print("KEY PERFORMANCE INDICATORS REPORT")
        print("="*60)
        
        print("\n📊 CORE KPIs")
        print(f"  Total Revenue: ${self.kpis['total_revenue']:,.2f}")
        print(f"  Total Orders: {self.kpis['total_orders']:,}")
        print(f"  Average Order Value: ${self.kpis['avg_order_value']:.2f}")
        print(f"  Sales Growth Rate: {self.kpis.get('latest_month_growth', 0):.2f}%")
        
        print("\n📈 REVENUE BREAKDOWN")
        print(f"  Completed: ${self.kpis['completed_revenue']:,.2f}")
        print(f"  Pending: ${self.kpis['pending_revenue']:,.2f}")
        print(f"  Cancelled: ${self.kpis['cancelled_revenue']:,.2f}")
        
        print("\n📦 ORDER METRICS")
        print(f"  Completed: {self.kpis['completed_orders']} ({self.kpis['completion_rate']:.1f}%)")
        print(f"  Pending: {self.kpis['pending_orders']}")
        print(f"  Cancelled: {self.kpis['cancelled_orders']} ({self.kpis['cancellation_rate']:.1f}%)")
        
        print("\n👥 CUSTOMER METRICS")
        print(f"  Unique Customers: {self.kpis['unique_customers']}")
        print(f"  Customer Lifetime Value: ${self.kpis['customer_ltv']:.2f}")
        print(f"  Orders per Customer: {self.kpis['total_orders']/self.kpis['unique_customers']:.1f}")
        
        print("\n📅 DAILY AVERAGES")
        print(f"  Revenue per Day: ${self.kpis['revenue_per_day']:.2f}")
        print(f"  Orders per Day: {self.kpis['orders_per_day']:.2f}")
        
        print("\n📊 GROWTH METRICS")
        print(f"  Latest Month Growth: {self.kpis.get('latest_month_growth', 0):.2f}%")
        print(f"  Average Monthly Growth: {self.kpis.get('avg_monthly_growth', 0):.2f}%")
        print(f"  Period Growth: {self.kpis.get('period_growth', 0):.2f}%")
        
        print("="*60)
        
        return self
    
    def save_kpi_summary(self, output_file='kpi_summary.csv'):
        """Save KPI summary to CSV"""
        kpi_df = pd.DataFrame([self.kpis])
        kpi_df.to_csv(output_file, index=False)
        print(f"\n✓ KPI summary saved to {output_file}")
        return self
    
    def get_kpis(self):
        """Return KPIs dictionary"""
        return self.kpis


def main():
    """Main execution function"""
    print("="*60)
    print("SALES PERFORMANCE DASHBOARD")
    print("KPI Calculation & Validation - Day 4")
    print("Team: Cyber Guard | Mentor: Anwar Nizami")
    print("="*60)
    
    # Initialize calculator
    calculator = KPICalculator('transformed_sales_orders.csv')
    
    # Execute KPI calculation pipeline
    calculator.load_data() \
              .calculate_total_revenue() \
              .calculate_total_orders() \
              .calculate_average_order_value() \
              .calculate_sales_growth_rate() \
              .calculate_additional_kpis() \
              .validate_kpis() \
              .generate_kpi_report() \
              .save_kpi_summary()
    
    print("\n✓ KPI calculation completed successfully!")


if __name__ == "__main__":
    main()
