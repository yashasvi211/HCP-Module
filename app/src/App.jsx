import React from 'react';
import './App.css';
import StructuredForm from './components/StructuredForm';
import AIAssistant from './components/AIAssistant';

function App() {
  return (
    <div className="App">
      <header className="app-header">
        Log & Update HCP Interaction
      </header>
  
      <main className="main-container">
        <StructuredForm />
        <AIAssistant />
      </main>
    </div>
  );
}
export default App;