import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setCurrentInteraction } from '../features/interaction/interactionSlice';

const HistoryPanel = () => {
    const dispatch = useDispatch();
    const { history, currentLogId } = useSelector(state => state.interaction);

    const handleSelect = (logId) => {
        dispatch(setCurrentInteraction(logId));
    };

    if (history.length === 0) {
        return (
            <>
                <h3>Interaction Log</h3>
                <div className="text-center p-4 text-slate-500">
                    No interactions logged.
                </div>
            </>
        );
    }

    return (
        <>
            <h3>Interaction Log</h3>
            <div className="space-y-2 p-1">
                {history.map((log) => (
                    <div 
                        key={log.logId} 
                        onClick={() => handleSelect(log.logId)}
                        className={`history-item ${log.logId === currentLogId ? 'active' : ''}`}
                    >
                        <p className="font-semibold">{log.hcpName || 'Unknown HCP'}</p>
                        <p className="text-sm text-slate-600">{log.interactionType || 'Interaction'}</p>
                    </div>
                ))}
            </div>
        </>
    );
};
export default HistoryPanel;