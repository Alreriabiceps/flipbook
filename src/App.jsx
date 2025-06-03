// App.jsx
import React from 'react';
import { Routes, Route } from 'react-router';

import InformationSystem from './pages/InformationSystem';
import Viewing from './pages/Viewing';

function App() {
  return (
 
      <Routes>
          <Route path="/edit" element={<InformationSystem />} />
          <Route path="/" element={<Viewing />} />
      </Routes>
  
  );
}

export default App;
