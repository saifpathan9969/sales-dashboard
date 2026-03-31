"""
Sales Performance Dashboard - Main Application
Days 5-7: Dashboard Interface, Charts, and Visualizations

Team: Cyber Guard
Mentor: Anwar Nizami
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime
import sqlite3

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
def load_data():
    """Load all required datasets"""
    df = pd.read_csv('transformed_sales_orders.csv')
    df['order_date'] = pd.to_datetime(df['order_date'])
    
    monthly_df = pd.read_csv('monthly_time_series.csv')
    kpi_df = pd.read_csv('kpi_summary.csv')
    
    return df, monthly_df, kpi_df

def display_kpi_cards(kpis):
    """Display KPI cards in columns"""
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown(f"""
        <div class="kpi-card">
            <div class="kpi-value">${kpis['total_revenue'].values[0]:,.0f}</div>
            <div class="kpi-label">Total Revenue</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown(f"""
        <div class="kpi-card">
            <div class="kpi-value">{int(kpis['total_orders'].values[0]):,}</div>
            <div class="kpi-label">Total Orders</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown(f"""
        <div class="kpi-card">
            <div class="kpi-value">${kpis['avg_order_value'].values[0]:.2f}</div>
            <div class="kpi-label">Avg Order Value</div>
        </div>
        """, unsafe_allow_html=True)
    
    with col4:
        growth = kpis['latest_month_growth'].values[0]
        growth_color = "#28a745" if growth >= 0 else "#dc3545"
        st.markdown(f"""
        <div class="kpi-card">
            <div class="kpi-value" style="color: {growth_color};">{growth:.1f}%</div>
            <div class="kpi-label">Sales Growth</div>
        </div>
        """, unsafe_allow_html=True)

def plot_revenue_trend(monthly_df):
    """Create revenue trend line chart"""
    fig = go.Figure()
    
    fig.add_trace(go.Scatter(
        x=monthly_df['year_month'],
        y=monthly_df['total_revenue'],
        mode='lines+markers',
        name='Revenue',
        line=dict(color='#2E86AB', width=3),
        marker=dict(size=10)
    ))
    
    fig.update_layout(
        title='Monthly Revenue Trend',
        xaxis_title='Month',
        yaxis_title='Revenue ($)',
        hovermode='x unified',
        height=400
    )
    
    return fig

def plot_category_performance(df):
    """Create category performance bar chart"""
    category_data = df.groupby('category')['revenue'].sum().sort_values(ascending=True)
    
    fig = go.Figure(go.Bar(
        x=category_data.values,
        y=category_data.index,
        orientation='h',
        marker=dict(color='#A23B72')
    ))
    
    fig.update_layout(
        title='Revenue by Product Category',
        xaxis_title='Revenue ($)',
        yaxis_title='Category',
        height=400
    )
    
    return fig

def plot_top_products(df, n=5):
    """Display top products by revenue"""
    top_products = df.groupby('product_name')['revenue'].sum().sort_values(ascending=False).head(n)
    
    fig = px.bar(
        x=top_products.values,
        y=top_products.index,
        orientation='h',
        labels={'x': 'Revenue ($)', 'y': 'Product'},
        title=f'Top {n} Products by Revenue',
        color=top_products.values,
        color_continuous_scale='Blues'
    )
    
    fig.update_layout(height=350, showlegend=False)
    
    return fig

def plot_order_status_distribution(df):
    """Create order status pie chart"""
    status_counts = df['status'].value_counts()
    
    fig = px.pie(
        values=status_counts.values,
        names=status_counts.index,
        title='Order Status Distribution',
        color_discrete_sequence=['#28a745', '#ffc107', '#dc3545']
    )
    
    fig.update_layout(height=350)
    
    return fig

def plot_regional_performance(df):
    """Create regional performance chart"""
    regional_data = df.groupby('region')['revenue'].sum().sort_values(ascending=False)
    
    fig = px.bar(
        x=regional_data.index,
        y=regional_data.values,
        labels={'x': 'Region', 'y': 'Revenue ($)'},
        title='Revenue by Region',
        color=regional_data.values,
        color_continuous_scale='Viridis'
    )
    
    fig.update_layout(height=350, showlegend=False)
    
    return fig

def main():
    """Main dashboard application"""
    
    # Header
    st.markdown('<div class="main-header">📊 Sales Performance Dashboard</div>', unsafe_allow_html=True)
    st.markdown("**Team:** Cyber Guard | **Mentor:** Anwar Nizami")
    st.markdown("---")
    
    # Load data
    df, monthly_df, kpi_df = load_data()
    
    # Sidebar filters
    st.sidebar.header("🔍 Filters")
    
    # Date range filter
    min_date = df['order_date'].min().date()
    max_date = df['order_date'].max().date()
    
    date_range = st.sidebar.date_input(
        "Select Date Range",
        value=(min_date, max_date),
        min_value=min_date,
        max_value=max_date
    )
    
    # Category filter
    categories = ['All'] + sorted(df['category'].unique().tolist())
    selected_category = st.sidebar.selectbox("Select Category", categories)
    
    # Status filter
    statuses = ['All'] + sorted(df['status'].unique().tolist())
    selected_status = st.sidebar.selectbox("Select Order Status", statuses)
    
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
    
    # Display filtered record count
    st.sidebar.markdown(f"**Showing {len(filtered_df)} of {len(df)} orders**")
    
    # KPI Cards
    st.subheader("📈 Key Performance Indicators")
    display_kpi_cards(kpi_df)
    
    st.markdown("---")
    
    # Charts Row 1
    col1, col2 = st.columns(2)
    
    with col1:
        st.plotly_chart(plot_revenue_trend(monthly_df), use_container_width=True)
    
    with col2:
        st.plotly_chart(plot_category_performance(filtered_df), use_container_width=True)
    
    # Charts Row 2
    col3, col4 = st.columns(2)
    
    with col3:
        st.plotly_chart(plot_top_products(filtered_df), use_container_width=True)
    
    with col4:
        st.plotly_chart(plot_order_status_distribution(filtered_df), use_container_width=True)
    
    # Charts Row 3
    st.plotly_chart(plot_regional_performance(filtered_df), use_container_width=True)
    
    st.markdown("---")
    
    # Orders Table
    st.subheader("📦 Orders Management")
    
    # Display options
    col_display1, col_display2 = st.columns([3, 1])
    with col_display1:
        search_term = st.text_input("🔍 Search orders", placeholder="Search by order ID, customer, or product...")
    with col_display2:
        rows_to_show = st.selectbox("Rows per page", [10, 25, 50, 100], index=1)
    
    # Apply search filter
    display_df = filtered_df.copy()
    if search_term:
        display_df = display_df[
            display_df['order_id'].str.contains(search_term, case=False, na=False) |
            display_df['customer_name'].str.contains(search_term, case=False, na=False) |
            display_df['product_name'].str.contains(search_term, case=False, na=False)
        ]
    
    # Select columns to display
    display_columns = [
        'order_id', 'customer_name', 'product_name', 'category',
        'revenue', 'order_date', 'payment_method', 'region', 'status'
    ]
    
    # Format and display table
    table_df = display_df[display_columns].head(rows_to_show).copy()
    table_df['order_date'] = table_df['order_date'].dt.strftime('%Y-%m-%d')
    table_df['revenue'] = table_df['revenue'].apply(lambda x: f"${x:.2f}")
    
    st.dataframe(
        table_df,
        use_container_width=True,
        hide_index=True
    )
    
    # Summary statistics
    st.markdown("---")
    st.subheader("📊 Summary Statistics")
    
    col_stat1, col_stat2, col_stat3, col_stat4 = st.columns(4)
    
    with col_stat1:
        st.metric("Filtered Orders", len(filtered_df))
    
    with col_stat2:
        st.metric("Filtered Revenue", f"${filtered_df['revenue'].sum():,.2f}")
    
    with col_stat3:
        st.metric("Avg Order Value", f"${filtered_df['revenue'].mean():.2f}")
    
    with col_stat4:
        completion_rate = (len(filtered_df[filtered_df['status'] == 'Completed']) / len(filtered_df) * 100) if len(filtered_df) > 0 else 0
        st.metric("Completion Rate", f"{completion_rate:.1f}%")

if __name__ == "__main__":
    main()
