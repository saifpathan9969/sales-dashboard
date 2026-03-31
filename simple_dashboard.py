"""
Simple Sales Dashboard - Basic Version
Team: Cyber Guard | Mentor: Anwar Nizami
"""

import streamlit as st
import pandas as pd
import plotly.express as px
from database import SalesDatabase

st.title("Sales Performance Dashboard")

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

# Filters
st.sidebar.header("Filters")
categories = ['All'] + list(df['category'].unique())
selected_category = st.sidebar.selectbox("Category", categories)

statuses = ['All'] + list(df['status'].unique())
selected_status = st.sidebar.selectbox("Status", statuses)

# Apply filters
filtered_df = df.copy()
if selected_category != 'All':
    filtered_df = filtered_df[filtered_df['category'] == selected_category]
if selected_status != 'All':
    filtered_df = filtered_df[filtered_df['status'] == selected_status]

# KPIs
col1, col2, col3, col4 = st.columns(4)
col1.metric("Total Revenue", f"${filtered_df['order_value'].sum():,.2f}")
col2.metric("Total Orders", len(filtered_df))
col3.metric("Avg Order Value", f"${filtered_df['order_value'].mean():.2f}")
col4.metric("Completion Rate", f"{len(filtered_df[filtered_df['status']=='Completed'])/len(filtered_df)*100:.1f}%")

# Charts
st.subheader("Monthly Revenue")
monthly = filtered_df.groupby(filtered_df['order_date'].dt.to_period('M'))['order_value'].sum().reset_index()
monthly['order_date'] = monthly['order_date'].astype(str)
fig1 = px.line(monthly, x='order_date', y='order_value')
st.plotly_chart(fig1, use_container_width=True)

st.subheader("Revenue by Category")
category_data = filtered_df.groupby('category')['order_value'].sum().reset_index()
fig2 = px.bar(category_data, x='category', y='order_value')
st.plotly_chart(fig2, use_container_width=True)

# Orders table
st.subheader("Orders")
st.dataframe(filtered_df[['order_id', 'customer_name', 'product_name', 'category', 'order_value', 'order_date', 'status']])
