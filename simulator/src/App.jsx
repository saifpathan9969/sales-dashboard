import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import BehaviorTracker from './components/BehaviorTracker';
import './index.css';

const products = [
  { id: 1, name: 'Wireless Noise-Canceling Headphones', category: 'Electronics', price: 299.99, image: '🎧' },
  { id: 2, name: 'Ergonomic Office Chair', category: 'Furniture', price: 199.99, image: '🪑' },
  { id: 3, name: 'Smart Fitness Watch', category: 'Electronics', price: 149.99, image: '⌚' },
  { id: 4, name: 'Mechanical Keyboard Pro', category: 'Accessories', price: 129.99, image: '⌨️' },
  { id: 5, name: 'Ultra HD 4K Monitor', category: 'Electronics', price: 349.99, image: '🖥️' },
  { id: 6, name: 'Premium Coffee Maker', category: 'Appliances', price: 89.99, image: '☕' }
];

function InterventionModal({ intervention, onClose }) {
  if (!intervention) return null;
  return (
    <div className="intervention-overlay">
      <div className="intervention-modal">
        {intervention.badge && <div style={{color: 'var(--theme-color)', marginBottom: 10, fontWeight: 'bold'}}>{intervention.badge}</div>}
        <h2>Wait! Before you go...</h2>
        <p style={{margin: '15px 0'}}>{intervention.message}</p>
        <button className="btn" onClick={onClose} style={{width: '100%'}}>Claim Offer & Checkout</button>
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
    </div>
  );
}

function ProductDetails() {
  return (
    <div className="product-detail-layout">
      <div className="product-detail-img">🎧</div>
      <div className="product-detail-info">
         <div>
           <span className="product-cat">Electronics</span>
           <h1 style={{fontSize: '2.5rem'}}>Wireless Noise-Canceling Headphones</h1>
         </div>
         <h2 className="product-price" style={{fontSize: '2rem'}}>$299.99</h2>
         <p style={{color: 'var(--text-muted)'}}>Experience pure sound with our active noise cancellation.</p>
         <button className="btn" onClick={() => window.trackBehavior('click_add_to_cart', 0)}>Add to Cart</button>
      </div>
    </div>
  );
}

function Cart() {
  const navigate = useNavigate();
  return (
    <div>
      <h1>Shopping Cart</h1>
      <div style={{marginTop: 30, padding: 20, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)'}}>
         <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 20}}>
           <span>Wireless Noise-Canceling Headphones</span>
           <span>$299.99</span>
         </div>
         <hr style={{borderColor: 'var(--border)', margin: '20px 0'}} />
         <div style={{display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: 30}}>
           <span>Total</span>
           <span style={{color: 'var(--theme-color)'}}>$299.99</span>
         </div>
         <button className="btn" style={{width: '100%'}} onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
      </div>
    </div>
  );
}

function Checkout() {
  return (
    <div>
      <h1>Checkout</h1>
      <div style={{marginTop: 30, padding: 20, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)'}}>
         <h3>Order Summary</h3>
         <p style={{margin: '10px 0'}}>Total: $299.99</p>
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

  const handleIntervention = (data) => {
    // Show modal if an intervention comes from the backend AI
    if (data && data.type) {
      setIntervention(data);
    }
  };

  return (
    <Router>
      <div className="app-container">
        <BehaviorTracker onIntervention={handleIntervention} />
        <InterventionModal intervention={intervention} onClose={() => setIntervention(null)} />
        
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
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}
