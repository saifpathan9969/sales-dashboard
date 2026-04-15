import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Diagnostics() {
  const { api } = useAuth();
  const [schemaResult, setSchemaResult] = useState(null);
  const [queryResult, setQueryResult] = useState(null);
  const [countResult, setCountResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkSchema = async () => {
    setLoading(true);
    try {
      const res = await api.get('/diagnostics/schema');
      setSchemaResult(res);
    } catch (err) {
      setSchemaResult({ error: err.message });
    }
    setLoading(false);
  };

  const testQuery = async () => {
    setLoading(true);
    try {
      const res = await api.get('/diagnostics/test-query');
      setQueryResult(res);
    } catch (err) {
      setQueryResult({ error: err.message });
    }
    setLoading(false);
  };

  const checkCounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/diagnostics/orders-count');
      setCountResult(res);
    } catch (err) {
      setCountResult({ error: err.message });
    }
    setLoading(false);
  };

  const runAllTests = async () => {
    await checkSchema();
    await testQuery();
    await checkCounts();
  };

  return (
    <div className="fade-in">
      <header className="page-header">
        <div>
          <h1 className="page-title">Database Diagnostics</h1>
          <p className="page-subtitle">Check database schema and test cancellation queries</p>
        </div>
      </header>

      <div style={{ marginBottom: '2rem' }}>
        <button onClick={runAllTests} className="btn btn-primary" disabled={loading} style={{ marginRight: '1rem' }}>
          {loading ? 'Running...' : 'Run All Tests'}
        </button>
        <button onClick={checkSchema} className="btn" disabled={loading} style={{ marginRight: '1rem' }}>
          Check Schema
        </button>
        <button onClick={testQuery} className="btn" disabled={loading} style={{ marginRight: '1rem' }}>
          Test Query
        </button>
        <button onClick={checkCounts} className="btn" disabled={loading}>
          Check Counts
        </button>
      </div>

      {/* Schema Result */}
      {schemaResult && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 600 }}>
            Schema Check
          </h2>
          {schemaResult.error ? (
            <div style={{ color: '#e56b6f' }}>
              <p>❌ Error: {schemaResult.error}</p>
            </div>
          ) : (
            <div>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Has cancellation_reason column:</strong>{' '}
                <span style={{ color: schemaResult.hasCancellationReason ? '#8ac926' : '#e56b6f' }}>
                  {schemaResult.hasCancellationReason ? '✅ YES' : '❌ NO'}
                </span>
              </p>
              <p style={{ marginBottom: '1rem' }}>
                <strong>All columns:</strong> {schemaResult.columns?.join(', ')}
              </p>
              <details>
                <summary style={{ cursor: 'pointer', color: '#fca311' }}>Show full schema</summary>
                <pre style={{ background: '#18191b', padding: '1rem', borderRadius: '8px', overflow: 'auto', marginTop: '0.5rem' }}>
                  {JSON.stringify(schemaResult.fullSchema, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      )}

      {/* Query Result */}
      {queryResult && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 600 }}>
            Query Test
          </h2>
          {queryResult.error ? (
            <div style={{ color: '#e56b6f' }}>
              <p>❌ Query Failed: {queryResult.error}</p>
              <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                This indicates the cancellation_reason column is missing or there's a SQL error.
              </p>
            </div>
          ) : (
            <div>
              <p style={{ color: '#8ac926', marginBottom: '1rem' }}>
                ✅ {queryResult.message}
              </p>
              <p style={{ marginBottom: '0.5rem' }}><strong>Cancellation Reasons Found:</strong></p>
              <pre style={{ background: '#18191b', padding: '1rem', borderRadius: '8px', overflow: 'auto' }}>
                {JSON.stringify(queryResult.results, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Count Result */}
      {countResult && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem', fontWeight: 600 }}>
            Order Statistics
          </h2>
          {countResult.error ? (
            <div style={{ color: '#e56b6f' }}>
              <p>❌ Error: {countResult.error}</p>
            </div>
          ) : (
            <div>
              <p><strong>Total Orders:</strong> {countResult.stats?.total_orders}</p>
              <p><strong>Cancelled Orders:</strong> {countResult.stats?.cancelled_orders}</p>
              <p><strong>Cancellation Rate:</strong> {countResult.stats?.total_orders > 0 
                ? ((countResult.stats.cancelled_orders / countResult.stats.total_orders) * 100).toFixed(1) 
                : 0}%</p>
            </div>
          )}
        </div>
      )}

      {!schemaResult && !queryResult && !countResult && (
        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ color: '#8e8e93' }}>Click "Run All Tests" to check the database status</p>
        </div>
      )}
    </div>
  );
}
