import { useState } from 'react';
import { api } from '../api';

export default function Simulator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const runSimulation = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const response = await fetch('/api/behavior/generate-bulk');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '2rem', marginBottom: 8 }}>🎭 Behavioral Simulation Engine</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Generate realistic e-commerce user behavior data to test dashboard analytics
        </p>
      </div>

      {/* Info Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <div className="kpi-label">Window Shoppers</div>
          <div className="kpi-value">30%</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Browse but don't buy</div>
        </div>
        
        <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
          <div className="kpi-label">Cart Abandoners</div>
          <div className="kpi-value">30%</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Add to cart, then cancel</div>
        </div>
        
        <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
          <div className="kpi-label">Decisive Buyers</div>
          <div className="kpi-value">25%</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Quick purchases</div>
        </div>
        
        <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
          <div className="kpi-label">Hesitant Buyers</div>
          <div className="kpi-value">15%</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Hesitate but buy</div>
        </div>
      </div>

      {/* Simulation Details */}
      <div className="chart-card" style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 16 }}>📊 What Gets Generated</h3>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'rgba(100, 116, 139, 0.1)', borderRadius: 8 }}>
            <span>Total Sessions</span>
            <strong>100</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'rgba(100, 116, 139, 0.1)', borderRadius: 8 }}>
            <span>Behavioral Log Entries</span>
            <strong>~415</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'rgba(100, 116, 139, 0.1)', borderRadius: 8 }}>
            <span>Orders Created</span>
            <strong>~70 (40 completed, 30 cancelled)</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'rgba(100, 116, 139, 0.1)', borderRadius: 8 }}>
            <span>Revenue Generated</span>
            <strong>~$10,000 - $15,000</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: 12, background: 'rgba(100, 116, 139, 0.1)', borderRadius: 8 }}>
            <span>Time Period</span>
            <strong>Last 30 days</strong>
          </div>
        </div>
      </div>

      {/* Run Button */}
      <div className="chart-card" style={{ textAlign: 'center', padding: 40 }}>
        <button 
          className="btn btn-primary" 
          onClick={runSimulation}
          disabled={loading}
          style={{ 
            fontSize: '1.1rem', 
            padding: '16px 48px',
            minWidth: 200
          }}
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: 16, height: 16, marginRight: 8 }} />
              Generating...
            </>
          ) : (
            <>🚀 Run Simulation</>
          )}
        </button>
        <p style={{ marginTop: 16, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          This will generate 100 simulated user sessions with realistic behavior patterns
        </p>
      </div>

      {/* Result */}
      {result && (
        <div className="chart-card" style={{ marginTop: 24, background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(5, 150, 105, 0.1) 100%)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{ fontSize: '2rem' }}>✅</div>
            <div>
              <h3 style={{ margin: 0, color: 'rgb(16, 185, 129)' }}>Simulation Complete!</h3>
              <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>{result.message}</p>
            </div>
          </div>
          <div style={{ marginTop: 16, padding: 16, background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              ✨ Your dashboard has been updated with new data. Refresh the Dashboard page to see:
            </p>
            <ul style={{ marginTop: 12, paddingLeft: 20 }}>
              <li>Updated Cancelled Orders % (should be ~40-45%)</li>
              <li>Increased Total Revenue and Orders</li>
              <li>New data points in Revenue Over Time chart</li>
              <li>Fresh behavioral analytics data</li>
            </ul>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="chart-card" style={{ marginTop: 24, background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: '2rem' }}>❌</div>
            <div>
              <h3 style={{ margin: 0, color: 'rgb(239, 68, 68)' }}>Simulation Failed</h3>
              <p style={{ margin: '4px 0 0 0' }}>{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="chart-card" style={{ marginTop: 32 }}>
        <h3 style={{ marginBottom: 16 }}>🔍 How It Works</h3>
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <h4 style={{ color: 'var(--accent-cyan)', marginBottom: 8 }}>1. Persona Assignment</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Each session is randomly assigned one of 4 personas based on probability distribution
            </p>
          </div>
          <div>
            <h4 style={{ color: 'var(--accent-purple)', marginBottom: 8 }}>2. Behavior Generation</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              System generates realistic event sequences (page views, cart actions, purchases/cancellations)
            </p>
          </div>
          <div>
            <h4 style={{ color: 'var(--accent-emerald)', marginBottom: 8 }}>3. Hesitation Scoring</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Each action gets a hesitation score (0-15) indicating user uncertainty
            </p>
          </div>
          <div>
            <h4 style={{ color: 'var(--accent-amber)', marginBottom: 8 }}>4. Database Insertion</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Data is inserted into behavioral_logs and orders tables with realistic timestamps
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
