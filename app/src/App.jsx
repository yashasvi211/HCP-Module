import React from 'react';
import { useDispatch } from 'react-redux';
import './App.css';
import StructuredForm from './components/StructuredForm';
import AIAssistant from './components/AIAssistant';
import HistoryPanel from './components/HistoryPanel';
import { startNewInteraction } from './features/interaction/interactionSlice';

function App() {
  const dispatch = useDispatch();

  const handleNewInteraction = () => {
      dispatch(startNewInteraction());
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>AI-First CRM</h1>
        <button onClick={handleNewInteraction} className="new-interaction-btn">
          + New Interaction
        </button>
      </header>
      <main className="main-container">
        <StructuredForm />
        <AIAssistant />
      </main>
    </div>
  );
}
export default App;