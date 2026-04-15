import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function BehavioralInsights() {
  const { api } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/behavior/active-sessions');
      setSessions(res.data || []);
    } catch (err) {
      console.error('Error fetching behavioral insights', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 5000); // Live poll every 5s
    return () => clearInterval(interval);
  }, []);

  if (loading && sessions.length === 0) {
     return <div className="state-container"><div className="spinner"></div><p className="state-title">Aggregating Live Sessions...</p></div>;
  }

  const activeCount = sessions.length;
  const leaveRiskCount = sessions.filter(s => s.prediction === 'Likely to LEAVE').length;
  const riskPct = activeCount === 0 ? 0 : Math.round((leaveRiskCount / activeCount) * 100);
  const interventionsDeployments = sessions.filter(s => s.intervention !== 'None Recommended').length;

  return (
    <div>
      <div className="page-header">
        <div>
           <h1 style={{fontSize: '2rem', marginBottom: 5}}>Live Behavioral Insights</h1>
           <p style={{color: 'var(--text-muted)'}}>Real-time aggregation of active simulator sessions and purchase intent predictions.</p>
        </div>
      </div>
      
      <div className="kpi-grid" style={{marginTop: 30}}>
        <div className="kpi-card">
          <div className="kpi-title">Active Tracked Sessions</div>
          <div className="kpi-value" style={{color: 'var(--theme-color)'}}>{activeCount}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Abandonment Risk</div>
          <div className="kpi-value" style={{color: riskPct > 30 ? '#e56b6f' : '#8ac926'}}>{riskPct}%</div>
          <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 5}}>Users predicted likely to leave</p>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Interventions Deployed</div>
          <div className="kpi-value" style={{color: '#fca311'}}>{interventionsDeployments}</div>
        </div>
      </div>

      <div className="glass-card table-container" style={{marginTop: 30}}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Session ID</th>
              <th>Status Prediction</th>
              <th>Max Hesitation</th>
              <th>Total Actions</th>
              <th>Recommended Intervention</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session, idx) => (
              <tr key={idx}>
                <td style={{fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--text-secondary)'}}>{session.session_id}</td>
                <td>
                    <span className="badge" style={{
                       background: session.prediction === 'Likely to BUY' ? '#8ac92620' : session.prediction === 'Likely to LEAVE' ? '#e56b6f20' : 'var(--bg)',
                       color: session.prediction === 'Likely to BUY' ? '#8ac926' : session.prediction === 'Likely to LEAVE' ? '#e56b6f' : 'var(--text-muted)',
                       border: `1px solid ${session.prediction === 'Likely to BUY' ? '#8ac926' : session.prediction === 'Likely to LEAVE' ? '#e56b6f' : 'var(--border)'}`
                    }}>
                      {session.prediction}
                    </span>
                </td>
                <td>
                   <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                      <div style={{width: 80, background: 'var(--bg)', height: 6, borderRadius: 3, overflow: 'hidden'}}>
                         <div style={{width: `${Math.min(100, session.max_hesitation * 10)}%`, background: session.max_hesitation > 5 ? '#e56b6f' : '#fca311', height: '100%'}} />
                      </div>
                      <span style={{fontSize: '0.8rem', fontWeight: 'bold'}}>{session.max_hesitation.toFixed(1)}</span>
                   </div>
                </td>
                <td style={{textAlign: 'center'}}>{session.actions_count}</td>
                <td style={{color: session.intervention !== 'None Recommended' ? 'var(--theme-color)' : 'var(--text-muted)', fontWeight: session.intervention !== 'None Recommended' ? 'bold' : 'normal'}}>
                  {session.intervention}
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
               <tr><td colSpan="5" style={{textAlign: 'center', padding: '40px', color: 'var(--text-muted)'}}>No live sessions tracked yet. Start browsing the simulator!</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
