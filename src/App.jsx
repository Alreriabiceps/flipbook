// App.jsx
import React from 'react';
import { Routes, Route } from 'react-router';

import InformationSystem from './pages/InformationSystem';

function App() {
  return (
 
      <Routes>
          <Route path="/" element={<InformationSystem />} />
      </Routes>
  
  );
}

export default App;
