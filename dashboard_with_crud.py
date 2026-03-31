"""
Sales Performance Dashboard - Full Application with CRUD
Days 5-11: Complete Dashboard with Database Integration

Team: Cyber Guard
Mentor: Anwar Nizami
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime
from database import SalesDatabase

# Page configuration
st.set_page_config(
    page_title="Sales Performance Dashboard",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #2E86AB;
        text-align: center;
        margin-bottom: 1rem;
    }
    .kpi-card {
        background-color: #f0f2f6;
        padding: 1.5rem;
        border-radius: 0.5rem;
        text-align: center;
    }
    .kpi-value {
        font-size: 2rem;
        font-weight: bold;
        color: #2E86AB;
    }
    .kpi-label {
        font-size: 1rem;
        color: #666;
    }
</style>
""", unsafe_allow_html=True)

@st.cache_data
def load_data_from_db():
    """Load data from database"""
    db = SalesDatabase()
    db.connect()
    df = db.get_all_orders()
    db.close()
    
    df['order_date'] = pd.to_datetime(df['order_date'])
    return df

def calculate_kpis(df):
    """Calculate KPIs from dataframe"""
    kpis = {
        'total_revenue': df['order_value'].sum(),
        'total_orders': len(df),
        'avg_order_value': df['order_value'].mean(),
        'completion_rate': (len(df[df['status'] == 'Completed']) / len(df) * 100) if len(df) > 0 else 0
    }
    
    # Calculate growth (simplified)
    df_sorted = df.sort_values('order_date')
    if len(df_sorted) >= 2:
        mid_point = len(df_sorted) // 2
        first_half_revenue = df_sorted.iloc[:mid_point]['order_value'].sum()
        second_half_revenue = df_sorted.iloc[mid_point:]['order_value'].sum()
        
        if first_half_revenue > 0:
            kpis['growth_rate'] = ((second_half_revenue - first_half_revenue) / first_half_revenue) * 100
        else:
            kpis['growth_rate'] = 0
    else:
        kpis['growth_rate'] = 0
    
    return kpis

def display_kpi_cards(kpis):
    """Display KPI cards"""
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown(f"""
        <div class="kpi-card">
            <div class="kpi-value">${kpis['total_revenue']:,.0f}</div>
            <div class="kpi-label">Total Revenue</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div class="kpi-card">
            <div class="kpi-value">{int(kpis['total_orders']):,}</div>
            <div class="kpi-label">Total Orders</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown(f"""
        <div class="kpi-card">
            <div class="kpi-value">${kpis['avg_order_value']:.2f}</div>
            <div class="kpi-label">Avg Order Value</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col4:
        growth = kpis['growth_rate']
        growth_color = "#28a745" if growth >= 0 else "#dc3545"
        st.markdown(f"""
        <div class="kpi-card">
            <div class="kpi-value" style="color: {growth_color};">{growth:.1f}%</div>
            <div class="kpi-label">Sales Growth</div>
        </div>
        """, unsafe_allow_html=True)

def create_order_form():
    """Display form to create new order"""
    st.subheader("➕ Create New Order")
    
    with st.form("create_order_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            order_id = st.text_input("Order ID", placeholder="ORD-XXXX")
            customer_name = st.text_input("Customer Name")
            product_name = st.text_input("Product Name")
            category = st.selectbox("Category", 
                ['Accessories', 'Electronics', 'Fashion', 'Fitness', 'Home', 'Stationery'])
            order_value = st.number_input("Order Value ($)", min_value=0.0, step=0.01)
        
        with col2:
            order_date = st.date_input("Order Date")
            payment_method = st.selectbox("Payment Method", 
                ['Card', 'Bank Transfer', 'PayPal'])
            region = st.selectbox("Region", ['North', 'South', 'East', 'West'])
            status = st.selectbox("Status", ['Pending', 'Completed', 'Cancelled'])
            created_by = st.number_input("Created By (User ID)", min_value=1, value=1)
        
        submitted = st.form_submit_button("Create Order")
        
        if submitted:
            if not order_id or not customer_name or not product_name:
                st.error("Please fill in all required fields")
            else:
                order_data = {
                    'order_id': order_id,
                    'customer_name': customer_name,
                    'product_name': product_name,
                    'category': category,
                    'order_value': order_value,
                    'order_date': str(order_date),
                    'payment_method': payment_method,
                    'region': region,
                    'status': status,
                    'created_by': created_by
                }
                
                db = SalesDatabase()
                db.connect()
                success, message = db.create_order(order_data)
                db.close()
                
                if success:
                    st.success(message)
                    st.cache_data.clear()
                    st.rerun()
                else:
                    st.error(message)

def update_order_form(order_id):
    """Display form to update existing order"""
    db = SalesDatabase()
    db.connect()
    order_df = db.get_order_by_id(order_id)
    
    if order_df.empty:
        st.error("Order not found")
        db.close()
        return
    
    order = order_df.iloc[0]
    
    st.subheader(f"✏️ Update Order: {order_id}")
    
    with st.form("update_order_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            customer_name = st.text_input("Customer Name", value=order['customer_name'])
            product_name = st.text_input("Product Name", value=order['product_name'])
            category = st.selectbox("Category", 
                ['Accessories', 'Electronics', 'Fashion', 'Fitness', 'Home', 'Stationery'],
                index=['Accessories', 'Electronics', 'Fashion', 'Fitness', 'Home', 'Stationery'].index(order['category']))
            order_value = st.number_input("Order Value ($)", value=float(order['order_value']), step=0.01)
        
        with col2:
            order_date = st.date_input("Order Date", value=pd.to_datetime(order['order_date']))
            payment_method = st.selectbox("Payment Method", 
                ['Card', 'Bank Transfer', 'PayPal'],
                index=['Card', 'Bank Transfer', 'PayPal'].index(order['payment_method']))
            region = st.selectbox("Region", ['North', 'South', 'East', 'West'],
                index=['North', 'South', 'East', 'West'].index(order['region']))
            status = st.selectbox("Status", ['Pending', 'Completed', 'Cancelled'],
                index=['Pending', 'Completed', 'Cancelled'].index(order['status']))
        
        submitted = st.form_submit_button("Update Order")
        
        if submitted:
            update_data = {
                'customer_name': customer_name,
                'product_name': product_name,
                'category': category,
                'order_value': order_value,
                'order_date': str(order_date),
                'payment_method': payment_method,
                'region': region,
                'status': status
            }
            
            success, message = db.update_order(order_id, update_data)
            
            if success:
                st.success(message)
                st.cache_data.clear()
                st.rerun()
            else:
                st.error(message)
    
    db.close()

def delete_order_action(order_id):
    """Delete an order"""
    db = SalesDatabase()
    db.connect()
    success, message = db.delete_order(order_id)
    db.close()
    
    if success:
        st.success(message)
        st.cache_data.clear()
        st.rerun()
    else:
        st.error(message)

def main():
    """Main dashboard application"""
    
    # Header
    st.markdown('<div class="main-header">📊 Sales Performance Dashboard</div>', unsafe_allow_html=True)
    st.markdown("**Team:** Cyber Guard | **Mentor:** Anwar Nizami")
    st.markdown("---")
    
    # Sidebar navigation
    st.sidebar.header("📋 Navigation")
    page = st.sidebar.radio("Go to", ["Dashboard", "Orders Management", "Create Order"])
    
    # Load data
    df = load_data_from_db()
    
    if page == "Dashboard":
        # Sidebar filters
        st.sidebar.header("🔍 Filters")
        
        min_date = df['order_date'].min().date()
        max_date = df['order_date'].max().date()
        
        date_range = st.sidebar.date_input(
            "Date Range",
            value=(min_date, max_date),
            min_value=min_date,
            max_value=max_date
        )
        
        categories = ['All'] + sorted(df['category'].unique().tolist())
        selected_category = st.sidebar.selectbox("Category", categories)
        
        statuses = ['All'] + sorted(df['status'].unique().tolist())
        selected_status = st.sidebar.selectbox("Status", statuses)
        
        # Apply filters
        filtered_df = df.copy()
        
        if len(date_range) == 2:
            filtered_df = filtered_df[
                (filtered_df['order_date'].dt.date >= date_range[0]) &
                (filtered_df['order_date'].dt.date <= date_range[1])
            ]
        
        if selected_category != 'All':
            filtered_df = filtered_df[filtered_df['category'] == selected_category]
        
        if selected_status != 'All':
            filtered_df = filtered_df[filtered_df['status'] == selected_status]
        
        st.sidebar.markdown(f"**Showing {len(filtered_df)} of {len(df)} orders**")
        
        # Calculate KPIs
        kpis = calculate_kpis(filtered_df)
        
        # Display KPIs
        st.subheader("📈 Key Performance Indicators")
        display_kpi_cards(kpis)
        
        st.markdown("---")
        
        # Visualizations
        col1, col2 = st.columns(2)
        
        with col1:
            # Revenue trend
            monthly_data = filtered_df.groupby(filtered_df['order_date'].dt.to_period('M')).agg({
                'order_value': 'sum'
            }).reset_index()
            monthly_data['order_date'] = monthly_data['order_date'].astype(str)
            
            fig1 = go.Figure()
            fig1.add_trace(go.Scatter(
                x=monthly_data['order_date'],
                y=monthly_data['order_value'],
                mode='lines+markers',
                line=dict(color='#2E86AB', width=3),
                marker=dict(size=10)
            ))
            fig1.update_layout(title='Monthly Revenue Trend', xaxis_title='Month', yaxis_title='Revenue ($)', height=400)
            st.plotly_chart(fig1, use_container_width=True)
        
        with col2:
            # Category performance
            category_data = filtered_df.groupby('category')['order_value'].sum().sort_values()
            fig2 = go.Figure(go.Bar(
                x=category_data.values,
                y=category_data.index,
                orientation='h',
                marker=dict(color='#A23B72')
            ))
            fig2.update_layout(title='Revenue by Category', xaxis_title='Revenue ($)', yaxis_title='Category', height=400)
            st.plotly_chart(fig2, use_container_width=True)
        
        col3, col4 = st.columns(2)
        
        with col3:
            # Top products
            top_products = filtered_df.groupby('product_name')['order_value'].sum().sort_values(ascending=False).head(5)
            fig3 = px.bar(x=top_products.values, y=top_products.index, orientation='h',
                         labels={'x': 'Revenue ($)', 'y': 'Product'}, title='Top 5 Products')
            fig3.update_layout(height=350)
            st.plotly_chart(fig3, use_container_width=True)
        
        with col4:
            # Order status
            status_counts = filtered_df['status'].value_counts()
            fig4 = px.pie(values=status_counts.values, names=status_counts.index,
                         title='Order Status Distribution')
            fig4.update_layout(height=350)
            st.plotly_chart(fig4, use_container_width=True)
    
    elif page == "Orders Management":
        st.subheader("📦 Orders Management")
        
        # Search and filter
        col_search, col_filter = st.columns([3, 1])
        with col_search:
            search_term = st.text_input("🔍 Search", placeholder="Search by order ID, customer, or product...")
        with col_filter:
            rows_to_show = st.selectbox("Rows", [10, 25, 50, 100], index=1)
        
        # Apply search
        display_df = df.copy()
        if search_term:
            display_df = display_df[
                display_df['order_id'].str.contains(search_term, case=False, na=False) |
                display_df['customer_name'].str.contains(search_term, case=False, na=False) |
                display_df['product_name'].str.contains(search_term, case=False, na=False)
            ]
        
        # Display table with actions
        for idx, row in display_df.head(rows_to_show).iterrows():
            with st.expander(f"📄 {row['order_id']} - {row['customer_name']} - ${row['order_value']:.2f}"):
                col_info, col_actions = st.columns([3, 1])
                
                with col_info:
                    st.write(f"**Product:** {row['product_name']}")
                    st.write(f"**Category:** {row['category']}")
                    st.write(f"**Date:** {pd.to_datetime(row['order_date']).strftime('%Y-%m-%d')}")
                    st.write(f"**Payment:** {row['payment_method']}")
                    st.write(f"**Region:** {row['region']}")
                    st.write(f"**Status:** {row['status']}")
                
                with col_actions:
                    if st.button("✏️ Edit", key=f"edit_{row['order_id']}"):
                        st.session_state['edit_order_id'] = row['order_id']
                        st.rerun()
                    
                    if st.button("🗑️ Delete", key=f"delete_{row['order_id']}"):
                        if st.session_state.get(f"confirm_delete_{row['order_id']}", False):
                            delete_order_action(row['order_id'])
                        else:
                            st.session_state[f"confirm_delete_{row['order_id']}"] = True
                            st.warning("Click again to confirm deletion")
        
        # Handle edit mode
        if 'edit_order_id' in st.session_state:
            st.markdown("---")
            update_order_form(st.session_state['edit_order_id'])
            if st.button("Cancel Edit"):
                del st.session_state['edit_order_id']
                st.rerun()
    
    elif page == "Create Order":
        create_order_form()

if __name__ == "__main__":
    main()
