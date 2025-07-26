import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendChatMessage } from '../features/interaction/interactionSlice';
import HistoryPanel from './HistoryPanel';

const AIAssistant = () => {
    const [text, setText] = useState('');
    const dispatch = useDispatch();
    const { status, error } = useSelector(state => state.interaction);

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
                <p className="assistant-subtitle">Log or Edit via Chat</p>
                <div className="assistant-placeholder">
                    <p>
                        <b>Log:</b> "Met with Dr. Evans..."<br/>
                        <b>Edit:</b> "Update the sentiment to Negative."
                    </p>
                </div>
                <div className="assistant-input-area">
                    <textarea
                        rows="4"
                        placeholder="Describe the interaction or your edit..."
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