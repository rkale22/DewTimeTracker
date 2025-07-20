import React from 'react';
import { ConfigProvider } from 'antd';
import './App.css';

function App() {
  return (
    <ConfigProvider>
      <div className="App">
        <header className="App-header">
          <h1>Dew Time Tracker</h1>
          <p>Welcome to DEW Software Time Tracking Application</p>
        </header>
      </div>
    </ConfigProvider>
  );
}

export default App; 