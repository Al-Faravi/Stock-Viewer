// src/App.js

import React from 'react';
import StockData from './components/StockData';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>📈 Stock Viewer</h1>
        <p>Get the latest stock market updates in real time.</p>
      </header>
      <main>
        <StockData />
      </main>
      <footer>
        <p>&copy; 2025 Stock Viewer | Powered by AL-FARAVI</p>
      </footer>
    </div>
  );
}

export default App;
