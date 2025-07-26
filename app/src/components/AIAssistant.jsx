import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendChatMessage } from '../features/interaction/interactionSlice';
import HistoryPanel from './HistoryPanel';

const AIAssistant = () => {
    const [text, setText] = useState('');
    const dispatch = useDispatch();
    const { status, error, aiResponseMessage } = useSelector(state => state.interaction);

    const handleSendMessage = () => {
        if (text.trim()) {
            dispatch(sendChatMessage(text));
            setText('');
        }
    };

    return (
        <div className="assistant-container">
            <div className="history-section">
                <HistoryPanel />
            </div>
            <div className="input-section">
                <p className="assistant-subtitle">Log, Edit, or Ask a Question</p>
                <div className="assistant-placeholder">
                    <p>
                        <b>Log:</b> "Met with Dr. Evans..."<br/>
                        <b>Edit:</b> "Update the sentiment to Negative."<br/>
                        <b>Query:</b> "Who was the last HCP I met?"
                    </p>
                </div>
                {/* Display for the AI's natural language response */}
                {aiResponseMessage && (
                    <div className="ai-response-message">
                        {aiResponseMessage}
                    </div>
                )}
                <div className="assistant-input-area">
                    <textarea
                        rows="4"
                        placeholder="Describe an interaction or ask a question..."
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={status === 'loading'}
                    />
                    <button onClick={handleSendMessage} disabled={status === 'loading'}>
                        {status === 'loading' ? 'Processing...' : 'Send to AI'}
                    </button>
                    {status === 'failed' && error && <p className="error-message">{error}</p>}
                </div>
            </div>
        </div>
    );
};
export default AIAssistant;