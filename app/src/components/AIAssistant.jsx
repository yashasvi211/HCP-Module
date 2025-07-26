import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fillFormWithAI, chatWithAI } from '../features/interaction/interactionSlice';
import HistoryPanel from './HistoryPanel';

const AIAssistant = () => {
    const [text, setText] = useState('');
    const dispatch = useDispatch();
    const { status, error, aiResponseMessage } = useSelector(state => state.interaction);

    const handleFillForm = () => {
        if (text.trim()) dispatch(fillFormWithAI(text));
    };

    const handleChat = () => {
        if (text.trim()) dispatch(chatWithAI(text));
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
                    disabled={status === 'loading'}
                />
                <div className="flex gap-2 mt-2">
                    <button onClick={handleFillForm} disabled={status === 'loading'} className="flex-1 fill-btn">
                        {status === 'loading' ? 'Processing...' : '📝 Fill Form with AI'}
                    </button>
                    <button onClick={handleChat} disabled={status === 'loading'} className="flex-1 chat-btn">
                        {status === 'loading' ? 'Processing...' : '💬 Chat with AI'}
                    </button>
                </div>
                {status === 'failed' && error && <p className="error-message">{error}</p>}
            </div>
        </div>
    );
};
export default AIAssistant;