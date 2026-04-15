# Bugfix Requirements Document

## Introduction

The CancelInsights page at `/cancel-insights` displays a "Failed to load data" error when users navigate to it. The page attempts to fetch cancellation analytics from the `/api/dashboard/cancellation-rates` endpoint, but the API call fails because the database schema is missing the `cancellation_reason` column in the orders table. This prevents users from viewing behavioral analytics about order cancellations, including cancellation rates, revenue loss, and cancellation reasons breakdown.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN a user navigates to the CancelInsights page (`/cancel-insights`) THEN the page displays a loading spinner briefly followed by "Failed to load data" error message

1.2 WHEN the frontend calls `api.get('/dashboard/cancellation-rates')` THEN the backend query fails because the `cancellation_reason` column does not exist in the orders table schema

1.3 WHEN the `/api/dashboard/cancellation-rates` endpoint executes the SQL query `SELECT COALESCE(cancellation_reason, 'Unspecified') as reason, COUNT(*) as count FROM orders WHERE status = 'Cancelled' GROUP BY reason` THEN the database throws an error due to the missing column

1.4 WHEN the API returns an error response THEN the frontend's `data` state remains `null` and triggers the error UI state

### Expected Behavior (Correct)

2.1 WHEN a user navigates to the CancelInsights page (`/cancel-insights`) THEN the page SHALL successfully load and display cancellation analytics including KPI cards and charts

2.2 WHEN the frontend calls `api.get('/dashboard/cancellation-rates')` THEN the backend SHALL successfully query the orders table and return cancellation data in the expected format: `{ total_orders, cancelled_orders, revenue_loss, cancellation_rate, categories: [], reasons: [] }`

2.3 WHEN the `/api/dashboard/cancellation-rates` endpoint executes queries involving `cancellation_reason` THEN the database SHALL successfully access the column and return aggregated cancellation reason data

2.4 WHEN cancelled orders exist in the database with `cancellation_reason` values THEN the API SHALL return a populated `reasons` array with objects containing `{ reason, count }` for the pie chart

2.5 WHEN cancelled orders exist in the database THEN the API SHALL return a populated `categories` array with objects containing `{ category, cancelled_count }` for the bar chart

2.6 WHEN no cancelled orders exist in the database THEN the API SHALL return empty arrays for `reasons` and `categories` with zero values for KPIs, and the frontend SHALL display "No cancellation data available" messages

### Unchanged Behavior (Regression Prevention)

3.1 WHEN the `/api/dashboard/cancellation-rates` endpoint is called with valid authentication THEN the system SHALL CONTINUE TO require authentication via the `authenticate` middleware

3.2 WHEN the `/api/dashboard/cancellation-rates` endpoint is called with optional `date_from` and `date_to` query parameters THEN the system SHALL CONTINUE TO filter results by the specified date range

3.3 WHEN other dashboard endpoints (`/kpis`, `/revenue-over-time`, `/sales-by-category`, `/top-customers`) query the orders table THEN the system SHALL CONTINUE TO function correctly without being affected by the schema change

3.4 WHEN the orders table is queried for non-cancelled orders THEN the system SHALL CONTINUE TO return correct results with `cancellation_reason` being `NULL` for non-cancelled orders

3.5 WHEN the behavior tracking system (`/api/behavior/generate-bulk`) creates cancelled orders THEN the system SHALL CONTINUE TO populate the `cancellation_reason` field with appropriate values from the predefined reasons list

3.6 WHEN existing orders in the database are queried THEN the system SHALL CONTINUE TO return all existing order data with the `cancellation_reason` field being `NULL` for orders that existed before the schema migration
