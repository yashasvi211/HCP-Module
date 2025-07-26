import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentInteraction } from '../features/interaction/interactionSlice';

const HistoryPanel = () => {
    const dispatch = useDispatch();
    const { history, currentLogId } = useSelector(state => state.interaction);

    const handleSelect = (logId) => {
        dispatch(setCurrentInteraction(logId));
    };

    return (
        <>
            <h3>Interaction Log</h3>
            {history.length === 0 ? (
                <div className="empty-history">
                    No interactions logged yet. Use the AI to create one!
                </div>
            ) : (
                <div className="history-list">
                    {history.map((log) => (
                        <div 
                            key={log.logId} 
                            onClick={() => handleSelect(log.logId)}
                            className={`history-item ${log.logId === currentLogId ? 'active' : ''}`}
                        >
                            <p className="font-semibold">{log.hcpName || 'Untitled Interaction'}</p>
                            <p className="text-sm text-slate-600">{log.interactionType || 'General'}</p>
                        </div>
                    ))}
                </div>
            )}
        </>
    );
};

export default HistoryPanel;