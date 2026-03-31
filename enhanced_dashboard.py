"""
Enhanced Sales Performance Dashboard - Advanced UI/UX
Team: Cyber Guard | Mentor: Anwar Nizami
"""

import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from database import SalesDatabase
from datetime import datetime, timedelta

# Page config with custom theme
st.set_page_config(
    page_title="Sales Analytics Dashboard",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for modern UI
st.markdown("""
<style>
    /* Main background */
    .stApp {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    /* Sidebar styling */
    [data-testid="stSidebar"] {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
    }
    
    /* Metric cards */
    [data-testid="stMetricValue"] {
        font-size: 2rem;
        font-weight: 700;
        color: #1e293b;
    }
    
    [data-testid="stMetricLabel"] {
        font-size: 0.9rem;
        color: #64748b;
        font-weight: 500;
    }
    
    /* Card styling */
    .metric-card {
        background: white;
        padding: 1.5rem;
        border-radius: 16px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        border-left: 4px solid #667eea;
        transition: transform 0.2s;
    }
    
    .metric-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    }
    
    /* Header styling */
    .dashboard-header {
        background: white;
        padding: 2rem;
        border-radius: 16px;
        margin-bottom: 2rem;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .dashboard-title {
        font-size: 2.5rem;
        font-weight: 800;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin: 0;
    }
    
    .dashboard-subtitle {
        color: #64748b;
        font-size: 1rem;
        margin-top: 0.5rem;
    }
    
    /* Chart container */
    .chart-container {
        background: white;
        padding: 1.5rem;
        border-radius: 16px;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        margin-bottom: 1.5rem;
    }
    
    /* Filter section */
    .filter-section {
        background: white;
        padding: 1.5rem;
        border-radius: 16px;
        margin-bottom: 1rem;
    }
    
    /* Buttons */
    .stButton>button {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.5rem 2rem;
        font-weight: 600;
        transition: all 0.3s;
    }
    
    .stButton>button:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
    
    /* Dataframe styling */
    .dataframe {
        border-radius: 8px;
        overflow: hidden;
    }
    
    /* Selectbox styling */
    .stSelectbox {
        background: white;
        border-radius: 8px;
    }
</style>
""", unsafe_allow_html=True)

# Load data
@st.cache_data
def load_data():
    db = SalesDatabase()
    db.connect()
    df = db.get_all_orders()
    db.close()
    df['order_date'] = pd.to_datetime(df['order_date'])
    return df

df = load_data()

# Header
st.markdown("""
<div class="dashboard-header">
    <h1 class="dashboard-title">📊 Sales Analytics Dashboard</h1>
    <p class="dashboard-subtitle">Real-time insights into your business performance</p>
</div>
""", unsafe_allow_html=True)

# Sidebar with modern filters
with st.sidebar:
    st.markdown("### 🎯 Filters")
    
    # Date range filter
    col1, col2 = st.columns(2)
    with col1:
        start_date = st.date_input("From", df['order_date'].min())
    with col2:
        end_date = st.date_input("To", df['order_date'].max())
    
    # Category filter
    categories = ['All'] + sorted(df['category'].unique().tolist())
    selected_category = st.selectbox("📦 Category", categories)
    
    # Status filter
    statuses = ['All'] + sorted(df['status'].unique().tolist())
    selected_status = st.selectbox("📋 Status", statuses)
    
    # Region filter
    regions = ['All'] + sorted(df['region'].unique().tolist())
    selected_region = st.selectbox("🌍 Region", regions)
    
    st.markdown("---")
    
    # Quick stats in sidebar
    st.markdown("### 📈 Quick Stats")
    st.metric("Total Customers", df['customer_name'].nunique())
    st.metric("Total Products", df['product_name'].nunique())
    st.metric("Avg Daily Orders", f"{len(df) / df['order_date'].nunique():.1f}")

# Apply filters
filtered_df = df.copy()
filtered_df = filtered_df[(filtered_df['order_date'].dt.date >= start_date) & 
                          (filtered_df['order_date'].dt.date <= end_date)]
if selected_category != 'All':
    filtered_df = filtered_df[filtered_df['category'] == selected_category]
if selected_status != 'All':
    filtered_df = filtered_df[filtered_df['status'] == selected_status]
if selected_region != 'All':
    filtered_df = filtered_df[filtered_df['region'] == selected_region]

# KPI Cards with icons and colors
col1, col2, col3, col4 = st.columns(4)

with col1:
    total_revenue = filtered_df['order_value'].sum()
    st.markdown(f"""
    <div class="metric-card" style="border-left-color: #10b981;">
        <div style="color: #10b981; font-size: 2rem;">💰</div>
        <div style="font-size: 2rem; font-weight: 700; color: #1e293b;">${total_revenue:,.0f}</div>
        <div style="color: #64748b; font-size: 0.9rem;">Total Revenue</div>
    </div>
    """, unsafe_allow_html=True)

with col2:
    total_orders = len(filtered_df)
    st.markdown(f"""
    <div class="metric-card" style="border-left-color: #3b82f6;">
        <div style="color: #3b82f6; font-size: 2rem;">📦</div>
        <div style="font-size: 2rem; font-weight: 700; color: #1e293b;">{total_orders:,}</div>
        <div style="color: #64748b; font-size: 0.9rem;">Total Orders</div>
    </div>
    """, unsafe_allow_html=True)

with col3:
    avg_order = filtered_df['order_value'].mean()
    st.markdown(f"""
    <div class="metric-card" style="border-left-color: #f59e0b;">
        <div style="color: #f59e0b; font-size: 2rem;">💳</div>
        <div style="font-size: 2rem; font-weight: 700; color: #1e293b;">${avg_order:.2f}</div>
        <div style="color: #64748b; font-size: 0.9rem;">Avg Order Value</div>
    </div>
    """, unsafe_allow_html=True)

with col4:
    completion_rate = len(filtered_df[filtered_df['status']=='Completed'])/len(filtered_df)*100 if len(filtered_df) > 0 else 0
    st.markdown(f"""
    <div class="metric-card" style="border-left-color: #8b5cf6;">
        <div style="color: #8b5cf6; font-size: 2rem;">✅</div>
        <div style="font-size: 2rem; font-weight: 700; color: #1e293b;">{completion_rate:.1f}%</div>
        <div style="color: #64748b; font-size: 0.9rem;">Completion Rate</div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<br>", unsafe_allow_html=True)

# Charts Row 1
col1, col2 = st.columns(2)

with col1:
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.markdown("#### 📈 Revenue Trend")
    
    monthly = filtered_df.groupby(filtered_df['order_date'].dt.to_period('M'))['order_value'].sum().reset_index()
    monthly['order_date'] = monthly['order_date'].astype(str)
    
    fig1 = go.Figure()
    fig1.add_trace(go.Scatter(
        x=monthly['order_date'],
        y=monthly['order_value'],
        mode='lines+markers',
        line=dict(color='#667eea', width=3),
        marker=dict(size=10, color='#764ba2'),
        fill='tozeroy',
        fillcolor='rgba(102, 126, 234, 0.1)'
    ))
    fig1.update_layout(
        height=350,
        margin=dict(l=0, r=0, t=0, b=0),
        xaxis_title="Month",
        yaxis_title="Revenue ($)",
        hovermode='x unified',
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)'
    )
    st.plotly_chart(fig1, use_container_width=True)
    st.markdown('</div>', unsafe_allow_html=True)

with col2:
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.markdown("#### 🎯 Category Performance")
    
    category_data = filtered_df.groupby('category')['order_value'].sum().sort_values(ascending=True)
    
    fig2 = go.Figure(go.Bar(
        x=category_data.values,
        y=category_data.index,
        orientation='h',
        marker=dict(
            color=category_data.values,
            colorscale='Viridis',
            showscale=False
        )
    ))
    fig2.update_layout(
        height=350,
        margin=dict(l=0, r=0, t=0, b=0),
        xaxis_title="Revenue ($)",
        yaxis_title="",
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)'
    )
    st.plotly_chart(fig2, use_container_width=True)
    st.markdown('</div>', unsafe_allow_html=True)

# Charts Row 2
col3, col4 = st.columns(2)

with col3:
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.markdown("#### 🏆 Top Products")
    
    top_products = filtered_df.groupby('product_name')['order_value'].sum().sort_values(ascending=False).head(5)
    
    fig3 = go.Figure(go.Bar(
        x=top_products.index,
        y=top_products.values,
        marker=dict(
            color=['#667eea', '#764ba2', '#f59e0b', '#10b981', '#3b82f6']
        )
    ))
    fig3.update_layout(
        height=350,
        margin=dict(l=0, r=0, t=0, b=0),
        xaxis_title="",
        yaxis_title="Revenue ($)",
        plot_bgcolor='rgba(0,0,0,0)',
        paper_bgcolor='rgba(0,0,0,0)'
    )
    st.plotly_chart(fig3, use_container_width=True)
    st.markdown('</div>', unsafe_allow_html=True)

with col4:
    st.markdown('<div class="chart-container">', unsafe_allow_html=True)
    st.markdown("#### 📊 Order Status Distribution")
    
    status_data = filtered_df['status'].value_counts()
    
    fig4 = go.Figure(go.Pie(
        labels=status_data.index,
        values=status_data.values,
        hole=0.4,
        marker=dict(colors=['#10b981', '#f59e0b', '#ef4444'])
    ))
    fig4.update_layout(
        height=350,
        margin=dict(l=0, r=0, t=0, b=0),
        showlegend=True,
        paper_bgcolor='rgba(0,0,0,0)'
    )
    st.plotly_chart(fig4, use_container_width=True)
    st.markdown('</div>', unsafe_allow_html=True)

# Regional Performance
st.markdown('<div class="chart-container">', unsafe_allow_html=True)
st.markdown("#### 🌍 Regional Performance")

regional_data = filtered_df.groupby('region').agg({
    'order_value': 'sum',
    'order_id': 'count'
}).reset_index()
regional_data.columns = ['Region', 'Revenue', 'Orders']

fig5 = go.Figure()
fig5.add_trace(go.Bar(
    name='Revenue',
    x=regional_data['Region'],
    y=regional_data['Revenue'],
    marker_color='#667eea'
))
fig5.add_trace(go.Bar(
    name='Orders',
    x=regional_data['Region'],
    y=regional_data['Orders'],
    marker_color='#764ba2',
    yaxis='y2'
))
fig5.update_layout(
    height=300,
    margin=dict(l=0, r=0, t=0, b=0),
    yaxis=dict(title='Revenue ($)'),
    yaxis2=dict(title='Orders', overlaying='y', side='right'),
    barmode='group',
    plot_bgcolor='rgba(0,0,0,0)',
    paper_bgcolor='rgba(0,0,0,0)'
)
st.plotly_chart(fig5, use_container_width=True)
st.markdown('</div>', unsafe_allow_html=True)

# Orders Table
st.markdown('<div class="chart-container">', unsafe_allow_html=True)
st.markdown("#### 📋 Recent Orders")

# Search
search = st.text_input("🔍 Search orders", placeholder="Search by order ID, customer, or product...")

display_df = filtered_df.copy()
if search:
    display_df = display_df[
        display_df['order_id'].str.contains(search, case=False, na=False) |
        display_df['customer_name'].str.contains(search, case=False, na=False) |
        display_df['product_name'].str.contains(search, case=False, na=False)
    ]

# Format display
display_df = display_df[['order_id', 'customer_name', 'product_name', 'category', 'order_value', 'order_date', 'status']].head(20)
display_df['order_date'] = display_df['order_date'].dt.strftime('%Y-%m-%d')
display_df['order_value'] = display_df['order_value'].apply(lambda x: f"${x:.2f}")

st.dataframe(display_df, use_container_width=True, hide_index=True)
st.markdown('</div>', unsafe_allow_html=True)

# Footer
st.markdown("---")
st.markdown("""
<div style="text-align: center; color: white; padding: 1rem;">
    <p>📊 Sales Performance Dashboard | Team: Cyber Guard | Mentor: Anwar Nizami</p>
</div>
""", unsafe_allow_html=True)
