import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateFormField, updateInteraction, resetStatus } from '../features/interaction/interactionSlice';

const StructuredForm = () => {
    const dispatch = useDispatch();
    const interaction = useSelector(state => state.interaction);
    const { status, logId } = interaction;

    useEffect(() => {
        if (status === 'updated') {
            const timer = setTimeout(() => {
                dispatch(resetStatus());
            }, 3000); 

            return () => clearTimeout(timer);
        }
    }, [status, dispatch]);

    const handleChange = (e) => {
        dispatch(updateFormField({ field: e.target.name, value: e.target.value }));
    };

    const handleUpdate = () => {
        const updateData = {
            logId: interaction.logId,
            hcpName: interaction.hcpName,
            interactionType: interaction.interactionType,
            sentiment: interaction.sentiment,
            topicsDiscussed: interaction.topicsDiscussed,
            outcomes: interaction.outcomes,
            followUpActions: interaction.followUpActions,
            materialsShared: interaction.materialsShared,
            samplesDistributed: interaction.samplesDistributed,
        };
        dispatch(updateInteraction(updateData));
    };

    const isFormDisabled = !logId;

    return (
        <div className="form-container">
            <h3>Interaction Details</h3>
            <div className="form-grid">
                <div className="form-field">
                    <label>HCP Name</label>
                    <input name="hcpName" type="text" value={interaction.hcpName} onChange={handleChange} disabled={isFormDisabled} />
                </div>
                <div className="form-field">
                    <label>Interaction Type</label>
                    <input name="interactionType" type="text" value={interaction.interactionType} onChange={handleChange} disabled={isFormDisabled} />
                </div>
                 <div className="form-field">
                    <label>Date</label>
                    <input name="date" type="text" value={interaction.date} readOnly disabled={isFormDisabled} />
                </div>
                <div className="form-field">
                    <label>Time</label>
                    <input name="time" type="text" value={interaction.time} readOnly disabled={isFormDisabled} />
                </div>
            </div>
            <div className="form-field">
                <label>Topics Discussed</label>
                <textarea name="topicsDiscussed" rows="4" value={interaction.topicsDiscussed} onChange={handleChange} disabled={isFormDisabled} />
            </div>
            <div className="form-grid">
                <div className="form-field">
                    <label>Materials Shared</label>
                    <input name="materialsShared" type="text" value={interaction.materialsShared} onChange={handleChange} disabled={isFormDisabled} />
                </div>
                <div className="form-field">
                    <label>Samples Distributed</label>
                    <input name="samplesDistributed" type="text" value={interaction.samplesDistributed} onChange={handleChange} disabled={isFormDisabled} />
                </div>
            </div>
             <div className="form-field">
                <label>Observed/Inferred HCP Sentiment</label>
                <select name="sentiment" value={interaction.sentiment} onChange={handleChange} disabled={isFormDisabled} className="sentiment-select">
                    <option value="Positive">Positive</option>
                    <option value="Neutral">Neutral</option>
                    <option value="Negative">Negative</option>
                </select>
            </div>
            <div className="form-field">
                <label>Outcomes</label>
                <textarea name="outcomes" rows="3" value={interaction.outcomes} onChange={handleChange} disabled={isFormDisabled} />
            </div>
             <div className="form-field">
                <label>Follow-up Actions</label>
                <textarea name="followUpActions" rows="3" value={interaction.followUpActions} onChange={handleChange} disabled={isFormDisabled} />
            </div>
            <button onClick={handleUpdate} disabled={isFormDisabled || status === 'updating'} className="update-button">
                {status === 'updating' ? 'Updating...' : 'Update Interaction'}
            </button>
            {status === 'updated' && <p className="success-message">Interaction updated successfully!</p>}
        </div>
    );
};
export default StructuredForm;