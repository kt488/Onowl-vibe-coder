import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import IDE from './pages/IDE';
import CreateWebsite from './pages/CreateWebsite';
import Admin from './pages/Admin';
import Auth from './pages/Auth';
import ContactUs from './pages/ContactUs';
import ErrorBoundary from './ErrorBoundary';

function App() {
  return (
    <>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/create" element={<CreateWebsite />} />
          <Route path="/ide" element={<IDE />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </ErrorBoundary>
    </>
  );
}

export default App;