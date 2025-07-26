import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateFormField, saveManualInteraction } from '../features/interaction/interactionSlice';
import AISuggestedFollowUp from './AISuggestedFollowUp';

const StructuredForm = () => {
    const dispatch = useDispatch();
    const { currentInteractionData, currentLogId, status, suggestedFollowUps } = useSelector(state => state.interaction);
    
    const isNew = !currentLogId;

    const handleChange = (e) => {
        dispatch(updateFormField({ field: e.target.name, value: e.target.value }));
    };

    const handleSave = () => {
        dispatch(saveManualInteraction());
    };

    const isLoading = status === 'updating';

    // To prevent layout shift when no interaction is selected.
    if (!currentInteractionData) return <div className="form-container-placeholder" />;

    return (
        <div className="form-container">
            <h3>
                {isNew ? "Create New Interaction" : `Editing Interaction (ID: ${currentLogId})`}
            </h3>
            
            <div className="form-grid">
                <div className="form-field">
                    <label htmlFor="hcpName">HCP Name</label>
                    <input id="hcpName" name="hcpName" type="text" value={currentInteractionData.hcpName || ''} onChange={handleChange} />
                </div>
                <div className="form-field">
                    <label htmlFor="interactionType">Interaction Type</label>
                    <input id="interactionType" name="interactionType" type="text" value={currentInteractionData.interactionType || ''} onChange={handleChange} />
                </div>
            </div>

            <div className="form-field">
                <label htmlFor="sentiment">Sentiment</label>
                <select id="sentiment" name="sentiment" value={currentInteractionData.sentiment || 'Neutral'} onChange={handleChange}>
                    <option>Positive</option>
                    <option>Neutral</option>
                    <option>Negative</option>
                </select>
            </div>

            <div className="form-field">
                <label htmlFor="topicsDiscussed">Topics Discussed</label>
                <textarea id="topicsDiscussed" name="topicsDiscussed" rows="4" value={currentInteractionData.topicsDiscussed || ''} onChange={handleChange} />
            </div>
            
            <div className="form-grid">
                <div className="form-field">
                    <label htmlFor="materialsShared">Materials Shared</label>
                    <input id="materialsShared" name="materialsShared" type="text" value={currentInteractionData.materialsShared || ''} onChange={handleChange} />
                </div>
                 <div className="form-field">
                    <label htmlFor="samplesDistributed">Samples Distributed</label>
                    <input id="samplesDistributed" name="samplesDistributed" type="text" value={currentInteractionData.samplesDistributed || ''} onChange={handleChange} />
                </div>
            </div>

            <div className="form-field">
                <label htmlFor="outcomes">Outcomes</label>
                <textarea id="outcomes" name="outcomes" rows="3" value={currentInteractionData.outcomes || ''} onChange={handleChange} />
            </div>
            
            <div className="form-field">
                <label htmlFor="followUpActions">Follow-up Actions</label>
                <textarea id="followUpActions" name="followUpActions" rows="3" value={currentInteractionData.followUpActions || ''} onChange={handleChange} />
            </div>

            <AISuggestedFollowUp suggestions={suggestedFollowUps} />

            <button onClick={handleSave} disabled={isLoading} className="button button-primary w-full mt-4">
                {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    );
};

export default StructuredForm;