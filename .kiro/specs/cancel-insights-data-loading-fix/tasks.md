# Implementation Plan

- [x] 1. Write bug condition exploration test
  - **Property 1: Bug Condition** - Missing Cancellation Reason Column
  - **CRITICAL**: This test MUST FAIL on unfixed code - failure confirms the bug exists
  - **DO NOT attempt to fix the test or the code when it fails**
  - **NOTE**: This test encodes the expected behavior - it will validate the fix when it passes after implementation
  - **GOAL**: Surface counterexamples that demonstrate the bug exists
  - **Scoped PBT Approach**: Scope the property to databases where the orders table exists but the cancellation_reason column does not
  - Test that calling `/api/dashboard/cancellation-rates` on a database without the `cancellation_reason` column fails with SQL error
  - Test that the SQL query `SELECT COALESCE(cancellation_reason, 'Unspecified') as reason, COUNT(*) as count FROM orders WHERE status = 'Cancelled' GROUP BY reason` throws "no such column: cancellation_reason" error
  - Test that the CancelInsights page displays "Failed to load data" when the column is missing
  - The test assertions should match the Expected Behavior Properties from design (column exists, queries succeed)
  - Run test on UNFIXED code
  - **EXPECTED OUTCOME**: Test FAILS (this is correct - it proves the bug exists)
  - Document counterexamples found to understand root cause (e.g., "API returns 500 error with 'no such column' message")
  - Mark task complete when test is written, run, and failure is documented
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Write preservation property tests (BEFORE implementing fix)
  - **Property 2: Preservation** - Existing Data and Endpoint Integrity
  - **IMPORTANT**: Follow observation-first methodology
  - Observe behavior on UNFIXED code for non-cancellation queries
  - Observe that `/api/dashboard/kpis` returns correct KPI data on unfixed code
  - Observe that `/api/dashboard/revenue-over-time` returns correct revenue data on unfixed code
  - Observe that existing order records maintain all their field values on unfixed code
  - Write property-based tests capturing observed behavior patterns from Preservation Requirements
  - Test that all existing dashboard endpoints continue to function correctly after schema change
  - Test that existing order data remains intact with no data loss after migration
  - Test that non-cancelled orders have `cancellation_reason` as NULL after migration
  - Test that order creation and updates continue to work after migration
  - Property-based testing generates many test cases for stronger guarantees
  - Run tests on UNFIXED code
  - **EXPECTED OUTCOME**: Tests PASS (this confirms baseline behavior to preserve)
  - Mark task complete when tests are written, run, and passing on unfixed code
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

- [x] 3. Fix for missing cancellation_reason column in orders table

  - [x] 3.1 Implement the database migration in server/db.js
    - Add ALTER TABLE statement after orders table creation in `initDb()` function
    - Wrap ALTER TABLE in try-catch to handle "duplicate column name" error (idempotency)
    - Add migration: `ALTER TABLE orders ADD COLUMN cancellation_reason TEXT`
    - Place migration immediately after orders table CREATE TABLE IF NOT EXISTS statement
    - Add comment explaining backward compatibility purpose
    - Ensure migration runs before `saveDb()` is called
    - _Bug_Condition: isBugCondition(input) where input.database_instance has orders table without cancellation_reason column AND input.api_endpoint queries this column_
    - _Expected_Behavior: For all database instances where orders table exists, the column SHALL exist after initDb() runs, allowing queries to succeed_
    - _Preservation: All existing order data SHALL be preserved with cancellation_reason as NULL for pre-existing orders; all non-cancellation endpoints SHALL continue functioning_
    - _Requirements: 2.1, 2.2, 2.3, 3.3, 3.4, 3.6_

  - [x] 3.2 Verify bug condition exploration test now passes
    - **Property 1: Expected Behavior** - Cancellation Reason Column Exists
    - **IMPORTANT**: Re-run the SAME test from task 1 - do NOT write a new test
    - The test from task 1 encodes the expected behavior
    - When this test passes, it confirms the expected behavior is satisfied
    - Run bug condition exploration test from step 1
    - Verify that `/api/dashboard/cancellation-rates` now succeeds on databases that previously lacked the column
    - Verify that the SQL query executes without "no such column" errors
    - Verify that the CancelInsights page loads successfully
    - **EXPECTED OUTCOME**: Test PASSES (confirms bug is fixed)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  - [x] 3.3 Verify preservation tests still pass
    - **Property 2: Preservation** - Existing Data and Endpoint Integrity
    - **IMPORTANT**: Re-run the SAME tests from task 2 - do NOT write new tests
    - Run preservation property tests from step 2
    - Verify all existing dashboard endpoints still return correct data
    - Verify existing order records maintain all field values
    - Verify non-cancelled orders have NULL for cancellation_reason
    - Verify order creation and updates still work correctly
    - **EXPECTED OUTCOME**: Tests PASS (confirms no regressions)
    - Confirm all tests still pass after fix (no regressions)

- [x] 4. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
