import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fillFormWithAI, chatWithAI } from '../features/interaction/interactionSlice';
import HistoryPanel from './HistoryPanel';

// A simple spinner component
const Spinner = () => <div className="spinner"></div>;

const AIAssistant = () => {
    const [text, setText] = useState('');
    const dispatch = useDispatch();
    const { status, error, aiResponseMessage } = useSelector(state => state.interaction);

    const isLoading = status === 'loading';

    const handleFillForm = () => {
        if (text.trim() && !isLoading) {
            dispatch(fillFormWithAI(text));
        }
    };

    const handleChat = () => {
        if (text.trim() && !isLoading) {
            dispatch(chatWithAI(text));
        }
    };

    return (
        <div className="assistant-container">
            <div className="history-section">
                <HistoryPanel />
            </div>
            <div className="input-section">
                {aiResponseMessage && <div className="ai-response-message">{aiResponseMessage}</div>}
                
                <textarea
                    rows="5"
                    placeholder="Describe an interaction to fill the form, or ask a question..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={isLoading}
                />
                
                <div className="flex gap-3 mt-3">
                    <button onClick={handleFillForm} disabled={isLoading} className="button button-secondary flex-1">
                        {isLoading ? <Spinner /> : '📝 Fill Form'}
                    </button>
                    <button onClick={handleChat} disabled={isLoading} className="button button-success flex-1">
                        {isLoading ? <Spinner /> : '💬 Chat'}
                    </button>
                </div>
                
                {status === 'failed' && error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
};

export default AIAssistant;