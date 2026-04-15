import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const generateSessionId = () => Math.random().toString(36).substr(2, 9);
const sessionId = generateSessionId();

export default function BehaviorTracker({ onIntervention }) {
  const location = useLocation();
  const [hesitationScore, setHesitationScore] = useState(0);
  const idleTimer = useRef(null);
  
  useEffect(() => {
    const handleMouseMove = () => {
      // Reduce score on movement, meaning active
      setHesitationScore(s => Math.max(0, s - 0.1));
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    // Increase hesitation score every second of 'idleness'
    const timer = setInterval(() => {
      setHesitationScore(s => {
        const newScore = s + 1;
        // If score is high on a critical page (like cart), track it
        if (newScore === 6 && (location.pathname === '/cart' || location.pathname.includes('/product'))) {
          trackBehavior('hesitation_detected', newScore);
        }
        return newScore;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [location.pathname]);

  const trackBehavior = async (action, score = hesitationScore, details = {}) => {
    try {
      const res = await fetch('http://localhost:3001/api/behavior/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          action,
          hesitation_score: score,
          details: { path: location.pathname, ...details }
        })
      });
      const data = await res.json();
      if (data.intervention && onIntervention) {
        onIntervention(data.intervention);
      }
    } catch (err) {
      console.error('Tracking error', err);
    }
  };

  useEffect(() => {
    setHesitationScore(0);
    trackBehavior('page_view', 0);
  }, [location.pathname]);

  // Expose trackBehavior to window for manual calls from other components
  useEffect(() => {
    window.trackBehavior = trackBehavior;
  }, [hesitationScore]);

  return null; // Invisible component
}
