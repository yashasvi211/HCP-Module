import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logInteractionWithAI } from '../features/interaction/interactionSlice';

const AIAssistant = () => {
    const [text, setText] = useState('');
    const dispatch = useDispatch();
    const { status, error } = useSelector(state => state.interaction);

    const handleLogInteraction = () => {
        if (text.trim()) {
            dispatch(logInteractionWithAI(text));
            // The text area is no longer cleared after logging.
        }
    };

    return (
        <div className="assistant-container">
            <h3>AI Assistant</h3>
            <p className="assistant-subtitle">Log interaction via chat</p>
            <div className="assistant-placeholder">
                <p>
                    e.g., "Met with Dr. Evans and discussed the new trial data. He was positive. I shared the product brochure and some samples."
                </p>
            </div>
            <div className="assistant-input-area">
                <textarea
                    rows="5"
                    placeholder="Describe the interaction here..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={status === 'loading'}
                />
                <button onClick={handleLogInteraction} disabled={status === 'loading'}>
                    {status === 'loading' ? 'Processing...' : 'Log with AI'}
                </button>
                {status === 'failed' && error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
};
export default AIAssistant;
