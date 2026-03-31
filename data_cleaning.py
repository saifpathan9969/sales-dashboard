"""
Sales Performance Dashboard - Data Cleaning & Preprocessing Script
Day 2 Task: Clean and prepare the sales orders dataset for analysis

Team: Cyber Guard
Mentor: Anwar Nizami
"""

import pandas as pd
import numpy as np
from datetime import datetime
import os

class DataCleaner:
    """Handle data cleaning and preprocessing operations"""
    
    def __init__(self, input_file):
        self.input_file = input_file
        self.df = None
        self.cleaning_report = {
            'original_rows': 0,
            'missing_values': {},
            'duplicates_removed': 0,
            'date_conversions': 0,
            'category_normalizations': 0,
            'invalid_numeric_values': 0
        }
    
    def load_data(self):
        """Load the dataset from CSV"""
        print(f"Loading data from {self.input_file}...")
        self.df = pd.read_csv(self.input_file)
        self.cleaning_report['original_rows'] = len(self.df)
        print(f"✓ Loaded {len(self.df)} records")
        return self
    
    def identify_missing_values(self):
        """Identify and report missing values"""
        print("\n--- Identifying Missing Values ---")
        missing = self.df.isnull().sum()
        missing_pct = (missing / len(self.df)) * 100
        
        for col in self.df.columns:
            if missing[col] > 0:
                print(f"  {col}: {missing[col]} missing ({missing_pct[col]:.2f}%)")
                self.cleaning_report['missing_values'][col] = int(missing[col])
        
        if missing.sum() == 0:
            print("  ✓ No missing values found")
        
        return self
    
    def handle_missing_values(self):
        """Handle missing values based on column type"""
        print("\n--- Handling Missing Values ---")
        
        # For numeric columns, fill with median
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        for col in numeric_cols:
            if self.df[col].isnull().sum() > 0:
                median_val = self.df[col].median()
                self.df[col].fillna(median_val, inplace=True)
                print(f"  ✓ Filled {col} with median: {median_val:.2f}")
        
        # For categorical columns, fill with mode or 'Unknown'
        categorical_cols = self.df.select_dtypes(include=['object']).columns
        for col in categorical_cols:
            if self.df[col].isnull().sum() > 0:
                if len(self.df[col].mode()) > 0:
                    mode_val = self.df[col].mode()[0]
                    self.df[col].fillna(mode_val, inplace=True)
                    print(f"  ✓ Filled {col} with mode: {mode_val}")
                else:
                    self.df[col].fillna('Unknown', inplace=True)
                    print(f"  ✓ Filled {col} with 'Unknown'")
        
        return self
    
    def remove_duplicates(self):
        """Identify and remove duplicate records"""
        print("\n--- Removing Duplicate Records ---")
        initial_count = len(self.df)
        
        # Check for duplicate order_ids
        if 'order_id' in self.df.columns:
            duplicates = self.df.duplicated(subset=['order_id'], keep='first')
            self.df = self.df[~duplicates]
            removed = initial_count - len(self.df)
            self.cleaning_report['duplicates_removed'] = removed
            
            if removed > 0:
                print(f"  ✓ Removed {removed} duplicate order(s)")
            else:
                print("  ✓ No duplicates found")
        
        return self
    
    def convert_date_fields(self):
        """Convert date fields to proper datetime format"""
        print("\n--- Converting Date Fields ---")
        
        date_columns = ['order_date']
        for col in date_columns:
            if col in self.df.columns:
                try:
                    self.df[col] = pd.to_datetime(self.df[col], errors='coerce')
                    self.cleaning_report['date_conversions'] += 1
                    print(f"  ✓ Converted {col} to datetime format")
                    
                    # Check for invalid dates
                    invalid_dates = self.df[col].isnull().sum()
                    if invalid_dates > 0:
                        print(f"    ⚠ Warning: {invalid_dates} invalid dates found")
                except Exception as e:
                    print(f"    ✗ Error converting {col}: {str(e)}")
        
        return self
    
    def normalize_categories(self):
        """Normalize and standardize category labels"""
        print("\n--- Normalizing Product Categories ---")
        
        if 'category' in self.df.columns:
            # Convert to title case and strip whitespace
            original_categories = self.df['category'].unique()
            self.df['category'] = self.df['category'].str.strip().str.title()
            normalized_categories = self.df['category'].unique()
            
            self.cleaning_report['category_normalizations'] = len(original_categories)
            
            print(f"  ✓ Normalized {len(normalized_categories)} categories:")
            for cat in sorted(normalized_categories):
                count = len(self.df[self.df['category'] == cat])
                print(f"    - {cat}: {count} orders")
        
        # Normalize other categorical fields
        categorical_fields = ['payment_method', 'region', 'status']
        for field in categorical_fields:
            if field in self.df.columns:
                self.df[field] = self.df[field].str.strip().str.title()
        
        return self
    
    def validate_numeric_fields(self):
        """Validate numeric fields (price, quantity)"""
        print("\n--- Validating Numeric Fields ---")
        
        numeric_fields = ['order_value']
        for field in numeric_fields:
            if field in self.df.columns:
                # Check for negative values
                negative_count = (self.df[field] < 0).sum()
                if negative_count > 0:
                    print(f"  ⚠ Warning: {negative_count} negative values in {field}")
                    # Replace negative values with absolute value
                    self.df[field] = self.df[field].abs()
                    self.cleaning_report['invalid_numeric_values'] += negative_count
                
                # Check for zero values
                zero_count = (self.df[field] == 0).sum()
                if zero_count > 0:
                    print(f"  ⚠ Warning: {zero_count} zero values in {field}")
                
                # Summary statistics
                print(f"  ✓ {field} statistics:")
                print(f"    - Min: ${self.df[field].min():.2f}")
                print(f"    - Max: ${self.df[field].max():.2f}")
                print(f"    - Mean: ${self.df[field].mean():.2f}")
                print(f"    - Median: ${self.df[field].median():.2f}")
        
        return self
    
    def add_derived_columns(self):
        """Add useful derived columns for analysis"""
        print("\n--- Adding Derived Columns ---")
        
        # Extract date components
        if 'order_date' in self.df.columns:
            self.df['year'] = self.df['order_date'].dt.year
            self.df['month'] = self.df['order_date'].dt.month
            self.df['month_name'] = self.df['order_date'].dt.strftime('%B')
            self.df['day_of_week'] = self.df['order_date'].dt.day_name()
            self.df['quarter'] = self.df['order_date'].dt.quarter
            print("  ✓ Added date components: year, month, month_name, day_of_week, quarter")
        
        # Add revenue column (in this dataset, order_value is already the revenue)
        if 'order_value' in self.df.columns:
            self.df['revenue'] = self.df['order_value']
            print("  ✓ Added revenue column")
        
        return self
    
    def generate_cleaning_report(self):
        """Generate and display cleaning report"""
        print("\n" + "="*60)
        print("DATA CLEANING REPORT")
        print("="*60)
        print(f"Original Records: {self.cleaning_report['original_rows']}")
        print(f"Final Records: {len(self.df)}")
        print(f"Duplicates Removed: {self.cleaning_report['duplicates_removed']}")
        print(f"Date Conversions: {self.cleaning_report['date_conversions']}")
        print(f"Invalid Numeric Values Fixed: {self.cleaning_report['invalid_numeric_values']}")
        
        if self.cleaning_report['missing_values']:
            print("\nMissing Values Found:")
            for col, count in self.cleaning_report['missing_values'].items():
                print(f"  - {col}: {count}")
        else:
            print("\n✓ No missing values found")
        
        print("\nDataset Shape:", self.df.shape)
        print("Columns:", list(self.df.columns))
        print("="*60)
    
    def save_cleaned_data(self, output_file):
        """Save the cleaned dataset"""
        print(f"\nSaving cleaned data to {output_file}...")
        self.df.to_csv(output_file, index=False)
        print(f"✓ Cleaned dataset saved successfully")
        return self
    
    def get_dataframe(self):
        """Return the cleaned dataframe"""
        return self.df


def main():
    """Main execution function"""
    print("="*60)
    print("SALES PERFORMANCE DASHBOARD")
    print("Data Cleaning & Preprocessing - Day 2")
    print("Team: Cyber Guard | Mentor: Anwar Nizami")
    print("="*60)
    
    # File paths
    input_file = 'synthetic_dashboard_datasets/01_sales_orders.csv'
    output_file = 'cleaned_sales_orders.csv'
    
    # Check if input file exists
    if not os.path.exists(input_file):
        print(f"✗ Error: Input file '{input_file}' not found")
        return
    
    # Initialize cleaner and run cleaning pipeline
    cleaner = DataCleaner(input_file)
    
    # Execute cleaning pipeline
    cleaner.load_data() \
           .identify_missing_values() \
           .handle_missing_values() \
           .remove_duplicates() \
           .convert_date_fields() \
           .normalize_categories() \
           .validate_numeric_fields() \
           .add_derived_columns() \
           .save_cleaned_data(output_file)
    
    # Generate final report
    cleaner.generate_cleaning_report()
    
    # Display sample of cleaned data
    print("\n--- Sample of Cleaned Data (First 5 Records) ---")
    print(cleaner.get_dataframe().head())
    
    print("\n✓ Data cleaning completed successfully!")
    print(f"✓ Cleaned dataset available at: {output_file}")


if __name__ == "__main__":
    main()
