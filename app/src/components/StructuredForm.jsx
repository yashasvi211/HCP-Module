import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateFormField, saveManualInteraction, resetStatus } from '../features/interaction/interactionSlice';

const StructuredForm = () => {
    const dispatch = useDispatch();
    const { history, currentLogId, newInteractionData, status } = useSelector(state => state.interaction);
    
    const isNew = !currentLogId;
    const currentInteraction = isNew ? newInteractionData : history.find(log => log.logId === currentLogId);

    useEffect(() => {
        if (status === 'updated') {
            const timer = setTimeout(() => dispatch(resetStatus()), 3000);
            return () => clearTimeout(timer);
        }
    }, [status, dispatch]);

    const handleChange = (e) => {
        dispatch(updateFormField({ field: e.target.name, value: e.target.value }));
    };

    const handleSave = () => {
        dispatch(saveManualInteraction());
    };

    if (!currentInteraction) return <div className="form-container"></div>;

    return (
        <div className="form-container">
            <h3>
                {isNew ? "Create New Interaction" : `Interaction Details (Log ID: ${currentInteraction.logId})`}
            </h3>
            <div className="form-grid">
                <div className="form-field">
                    <label>HCP Name</label>
                    <input name="hcpName" type="text" value={currentInteraction.hcpName || ''} onChange={handleChange} />
                </div>
                <div className="form-field">
                    <label>Interaction Type</label>
                    <input name="interactionType" type="text" value={currentInteraction.interactionType || ''} onChange={handleChange} />
                </div>
            </div>
            <div className="form-field">
                <label>Sentiment</label>
                <select name="sentiment" value={currentInteraction.sentiment || 'Neutral'} onChange={handleChange}>
                    <option>Positive</option>
                    <option>Neutral</option>
                    <option>Negative</option>
                </select>
            </div>
            <div className="form-field">
                <label>Topics Discussed</label>
                <textarea name="topicsDiscussed" rows="4" value={currentInteraction.topicsDiscussed || ''} onChange={handleChange} />
            </div>
            <div className="form-grid">
                 <div className="form-field">
                    <label>Materials Shared</label>
                    <input name="materialsShared" type="text" value={currentInteraction.materialsShared || ''} onChange={handleChange} />
                </div>
                 <div className="form-field">
                    <label>Samples Distributed</label>
                    <input name="samplesDistributed" type="text" value={currentInteraction.samplesDistributed || ''} onChange={handleChange} />
                </div>
            </div>
            <div className="form-field">
                <label>Outcomes</label>
                <textarea name="outcomes" rows="3" value={currentInteraction.outcomes || ''} onChange={handleChange} />
            </div>
            <div className="form-field">
                <label>Follow-up Actions</label>
                <textarea name="followUpActions" rows="3" value={currentInteraction.followUpActions || ''} onChange={handleChange} />
            </div>
            <button onClick={handleSave} disabled={status === 'updating'} className="update-button">
                {status === 'updating' ? 'Saving...' : 'Save Manual Changes'}
            </button>
            {status === 'updated' && <p className="success-message">Interaction saved successfully!</p>}
        </div>
    );
};
export default StructuredForm;
