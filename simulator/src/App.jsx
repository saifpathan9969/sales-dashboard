import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import BehaviorTracker, { sessionId } from './components/BehaviorTracker';
import './index.css';

const products = [
  { id: 1, name: 'Wireless Noise-Canceling Headphones', category: 'Electronics', price: 299.99, image: '🎧' },
  { id: 2, name: 'Ergonomic Office Chair', category: 'Furniture', price: 199.99, image: '🪑' },
  { id: 3, name: 'Smart Fitness Watch', category: 'Electronics', price: 149.99, image: '⌚' },
  { id: 4, name: 'Mechanical Keyboard Pro', category: 'Accessories', price: 129.99, image: '⌨️' },
  { id: 5, name: 'Ultra HD 4K Monitor', category: 'Electronics', price: 349.99, image: '🖥️' },
  { id: 6, name: 'Premium Coffee Maker', category: 'Appliances', price: 89.99, image: '☕' }
];

function InterventionModal({ intervention, onClose, onClaim }) {
  if (!intervention) return null;
  return (
    <div className="intervention-overlay">
      <div className="intervention-modal">
        {/* LIKELY TO BUY UI */}
        {intervention.fastCheckout && (
           <>
             <div style={{color: '#ff9800', marginBottom: 10, fontWeight: 'bold'}}>⚡ {intervention.message}</div>
             <h2 style={{marginBottom: 20}}>Ready to Checkout?</h2>
             <button className="btn" onClick={() => {
                window.location.href = '/checkout';
                onClose();
             }} style={{width: '100%', background: '#4caf50', color: 'white'}}>⚡ Fast Checkout</button>
             <button className="btn-secondary" onClick={onClose} style={{width:'100%', marginTop: 10, padding: 10, border: '1px solid var(--border)', background: 'transparent', color: 'white', borderRadius: 4}}>Keep Browsing</button>
           </>
        )}
        
        {/* LIKELY TO LEAVE UI */}
        {intervention.discount && (
           <>
             {intervention.trustBadges && intervention.trustBadges.map((badge, i) => (
                <div key={i} style={{color: '#4caf50', marginBottom: 5, fontSize: '0.9rem', fontWeight: 'bold'}}>{badge}</div>
             ))}
             <h2 style={{color: '#f44336', marginTop: 15, marginBottom: 10}}>Wait! {intervention.discount}</h2>
             <p style={{margin: '15px 0'}}>{intervention.message}</p>
             <button className="btn" onClick={onClaim} style={{width: '100%', background: '#f44336', color:'white'}}>Claim Offer</button>
             <button className="btn-secondary" onClick={onClose} style={{width:'100%', marginTop: 10, padding: 10, border: '1px solid var(--border)', background: 'transparent', color: 'white', borderRadius: 4}}>No Thanks</button>
           </>
        )}
      </div>
    </div>
  );
}

function SmartRecommendations() {
  const [recs, setRecs] = useState([]);
  const location = useLocation();
  
  useEffect(() => {
    // Only fetch if session is active
    fetch(`http://localhost:3001/api/behavior/recommendations/${sessionId}`)
      .then(r => r.json())
      .then(d => {
         if (d.recommendations) setRecs(d.recommendations);
      }).catch(e => console.error(e));
  }, [location.pathname]); // Update recommendations implicitly on route changes
  
  if (recs.length === 0) return null;
  
  return (
    <div style={{marginTop: 50, borderTop: '1px solid var(--border)', paddingTop: 30}}>
      <h3>🤖 Smart AI Recommendations</h3>
      <p style={{color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20}}>Based on your recent behavior and hesitation.</p>
      <div className="product-grid" style={{marginTop: 20}}>
        {recs.map(p => (
           <Link to={`/product/${p.id}`} key={p.id} style={{textDecoration: 'none', color: 'inherit'}}>
             <div className="product-card">
               <div className="product-img">{p.image}</div>
               <div className="product-info">
                 <span className="product-cat">{p.category}</span>
                 <h3 className="product-title">{p.name}</h3>
                 <div className="product-price">${p.price}</div>
               </div>
             </div>
           </Link>
        ))}
      </div>
    </div>
  );
}

function Home() {
  return (
    <div>
      <h1 style={{marginBottom: 30, fontSize: '2.5rem'}}>Featured Products</h1>
      <div className="product-grid">
        {products.slice(0, 3).map(p => (
           <Link to={`/product/${p.id}`} key={p.id} style={{textDecoration: 'none', color: 'inherit'}}>
             <div className="product-card">
               <div className="product-img">{p.image}</div>
               <div className="product-info">
                 <span className="product-cat">{p.category}</span>
                 <h3 className="product-title">{p.name}</h3>
                 <div className="product-price">${p.price}</div>
               </div>
             </div>
           </Link>
        ))}
      </div>
    </div>
  );
}

function Listing() {
  return (
    <div>
      <h1 style={{marginBottom: 30}}>All Products</h1>
      <div className="product-grid">
        {products.map(p => (
           <Link to={`/product/${p.id}`} key={p.id} style={{textDecoration: 'none', color: 'inherit'}}>
             <div className="product-card">
               <div className="product-img">{p.image}</div>
               <div className="product-info">
                 <span className="product-cat">{p.category}</span>
                 <h3 className="product-title">{p.name}</h3>
                 <div className="product-price">${p.price}</div>
               </div>
             </div>
           </Link>
        ))}
      </div>
      <SmartRecommendations />
    </div>
  );
}

function ProductDetails() {
  const { pathname } = useLocation();
  const idStr = pathname.split('/').pop();
  const product = products.find(p => p.id === parseInt(idStr)) || products[0];

  return (
    <div className="product-detail-layout" style={{ display: 'block' }}>
      <div style={{ display: 'flex', gap: '30px' }}>
        <div className="product-detail-img" style={{ flex: 1, fontSize: '5rem', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg-card)', borderRadius: 12 }}>{product.image}</div>
        <div className="product-detail-info" style={{ flex: 1 }}>
           <div>
             <span className="product-cat">{product.category}</span>
             <h1 style={{fontSize: '2.5rem'}}>{product.name}</h1>
           </div>
           <h2 className="product-price" style={{fontSize: '2rem'}}>${product.price}</h2>
           <p style={{color: 'var(--text-muted)'}}>Experience premium quality with our {product.category.toLowerCase()} line.</p>
           <button className="btn" onClick={() => window.trackBehavior('click_add_to_cart', 0)}>Add to Cart</button>
        </div>
      </div>
      <SmartRecommendations />
    </div>
  );
}

function Cart({ discountApplied }) {
  const navigate = useNavigate();
  const basePrice = 299.99;
  const finalPrice = discountApplied ? (basePrice * 0.9).toFixed(2) : basePrice;

  return (
    <div>
      <h1>Shopping Cart</h1>
      {discountApplied && <div style={{padding: 10, background: '#4caf5020', border: '1px solid #4caf50', borderRadius: 6, color: '#4caf50', marginBottom: 20}}>✔️ 10% Discount manually applied to cart!</div>}
      <div style={{marginTop: 10, padding: 20, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)'}}>
         <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 20}}>
           <span>Wireless Noise-Canceling Headphones</span>
           <span>
             {discountApplied && <span style={{textDecoration: 'line-through', color: 'var(--text-muted)', marginRight: 10}}>${basePrice}</span>}
             ${finalPrice}
           </span>
         </div>
         <hr style={{borderColor: 'var(--border)', margin: '20px 0'}} />
         <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: 30}}>
           <span>Total</span>
           <span style={{color: 'var(--theme-color)'}}>${finalPrice}</span>
         </div>
         <button className="btn" style={{width: '100%'}} onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
      </div>
      <SmartRecommendations />
    </div>
  );
}

function Checkout({ discountApplied }) {
  const basePrice = 299.99;
  const finalPrice = discountApplied ? (basePrice * 0.9).toFixed(2) : basePrice;

  return (
    <div>
      <h1>Checkout</h1>
      <div style={{marginTop: 30, padding: 20, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)'}}>
         <h3>Order Summary</h3>
         <p style={{margin: '10px 0'}}>Total: ${finalPrice} {discountApplied && '(10% Off)'}</p>
         <button className="btn" style={{marginTop: 20, background: '#4caf50', color: 'white'}} onClick={() => window.trackBehavior('purchase_complete')}>Complete Order</button>
         <button className="btn" style={{marginTop: 20, marginLeft: 10, background: '#f44336', color: 'white'}} onClick={() => {
            window.trackBehavior('cancel_checkout');
            alert('Why did you cancel? (Simulated popup)');
         }}>Cancel Order</button>
      </div>
    </div>
  );
}

export default function App() {
  const [intervention, setIntervention] = useState(null);
  const [discountApplied, setDiscountApplied] = useState(false);

  const handleIntervention = (data) => {
    // Show modal if an intervention comes from the backend AI
    if (data && data.type) {
      setIntervention(data);
    }
  };

  const handleClaimOffer = () => {
    setDiscountApplied(true);
    setIntervention(null);
  };

  return (
    <Router>
      <div className="app-container">
        <BehaviorTracker onIntervention={handleIntervention} />
        <InterventionModal intervention={intervention} onClose={() => setIntervention(null)} onClaim={handleClaimOffer} />
        
        <nav className="navbar">
          <Link to="/" className="navbar-brand">EDOS MockShop</Link>
          <div className="nav-links">
            <Link to="/">Home</Link>
            <Link to="/products">Products</Link>
            <Link to="/cart">Cart</Link>
            <button onClick={() => {
              // Internal dev tool to auto-generate data
              fetch('http://localhost:3001/api/behavior/generate-bulk')
            }} style={{background:'none', border:'1px solid var(--border)', color:'white', padding:'4px 8px', borderRadius:4, cursor:'pointer'}}>Run Auto-Pilot</button>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Listing />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart discountApplied={discountApplied} />} />
            <Route path="/checkout" element={<Checkout discountApplied={discountApplied} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
