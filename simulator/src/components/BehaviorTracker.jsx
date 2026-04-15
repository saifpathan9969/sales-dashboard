import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const generateSessionId = () => Math.random().toString(36).substr(2, 9);
export const sessionId = generateSessionId();

export default function BehaviorTracker({ onIntervention }) {
  const location = useLocation();
  const [hesitationScore, setHesitationScore] = useState(0);
  const idleTimer = useRef(null);
  
  // Track specific metrics
  const scrollDepth = useRef(0);
  const clickCount = useRef(0);
  const lastActive = useRef(Date.now());
  const mouseMoves = useRef(0);
  
  useEffect(() => {
    const handleMouseMove = () => {
      lastActive.current = Date.now();
      mouseMoves.current += 1;
      // Frequent active mouse movement reduces hesitation
      if (mouseMoves.current % 10 === 0) {
         setHesitationScore(s => Math.max(0, s - 0.2));
      }
    };
    
    const handleScroll = () => {
      lastActive.current = Date.now();
      // Calculate scroll percentage
      const winHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const trackLength = docHeight - winHeight;
      const pctScrolled = Math.floor(scrollTop / trackLength * 100);
      
      scrollDepth.current = Math.max(scrollDepth.current, pctScrolled || 0);
      setHesitationScore(s => Math.max(0, s - 0.1));
    };

    const handleClick = () => {
      lastActive.current = Date.now();
      clickCount.current += 1;
      setHesitationScore(s => Math.max(0, s - 0.5));
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('click', handleClick);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  useEffect(() => {
    // Increase hesitation score if completely idle
    const timer = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActive.current;
      
      setHesitationScore(s => {
        let newScore = s;
        // If idle for more than 3 seconds
        if (idleTime > 3000) {
           newScore += 1;
        }
        
        // Critical page triggers
        if (newScore >= 6 && (location.pathname === '/cart' || location.pathname.includes('/product'))) {
           // We only want to trigger the intervention track once per high threshold
           if (s < 6) {
              trackBehavior('hesitation_detected', newScore);
           }
        }
        return newScore;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [location.pathname]);

  const trackBehavior = async (action, score = hesitationScore, customDetails = {}) => {
    try {
      const res = await fetch('http://localhost:3001/api/behavior/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          action,
          hesitation_score: score,
          details: { 
            path: location.pathname, 
            scroll_depth: scrollDepth.current,
            clicks: clickCount.current,
            idle_ms: Date.now() - lastActive.current,
            ...customDetails 
          }
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
    scrollDepth.current = 0;
    clickCount.current = 0;
    trackBehavior('page_view', 0);
  }, [location.pathname]);

  // Expose trackBehavior to window for manual calls
  useEffect(() => {
    window.trackBehavior = trackBehavior;
  }, [hesitationScore]);

  return null;
}
