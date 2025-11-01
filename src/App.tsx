import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FlowersPage } from './pages/FlowersPage';
import { CreateOrderPage } from './pages/CreateOrderPage';
import { OrderPage } from './pages/OrderPage';
import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<FlowersPage />} />
          <Route path="/create-order" element={<CreateOrderPage />} />
          <Route path="/orders/:id" element={<OrderPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;