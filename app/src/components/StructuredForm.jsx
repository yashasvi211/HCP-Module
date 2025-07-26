import React from 'react';
import { useSelector } from 'react-redux';

const StructuredForm = () => {
    const { history, currentLogId } = useSelector(state => state.interaction);
    
    const currentInteraction = history.find(log => log.logId === currentLogId);

    if (!currentInteraction) {
        return (
            <div className="form-container">
                <h3>Interaction Details</h3>
                <div className="flex items-center justify-center h-full text-slate-500">
                    <p>Log a new interaction to see details here.</p>
                </div>
            </div>
        );
    }

    const FormField = ({ label, value }) => (
        <div className="form-field">
            <label>{label}</label>
            <input type="text" value={value || ''} readOnly className="bg-slate-100" />
        </div>
    );

    return (
        <div className="form-container">
            <h3>Interaction Details (Log ID: {currentInteraction.logId})</h3>
            <div className="form-grid">
                <FormField label="HCP Name" value={currentInteraction.hcpName} />
                <FormField label="Interaction Type" value={currentInteraction.interactionType} />
            </div>
             <div className="form-field">
                <label>Sentiment</label>
                <input type="text" value={currentInteraction.sentiment || ''} readOnly className="bg-slate-100" />
            </div>
            <div className="form-field">
                <label>Topics Discussed</label>
                <textarea rows="4" value={currentInteraction.topicsDiscussed || ''} readOnly className="bg-slate-100" />
            </div>
            <div className="form-grid">
                 <FormField label="Materials Shared" value={currentInteraction.materialsShared} />
                 <FormField label="Samples Distributed" value={currentInteraction.samplesDistributed} />
            </div>
            <div className="form-field">
                <label>Outcomes</label>
                <textarea rows="3" value={currentInteraction.outcomes || ''} readOnly className="bg-slate-100" />
            </div>
            <div className="form-field">
                <label>Follow-up Actions</label>
                <textarea rows="3" value={currentInteraction.followUpActions || ''} readOnly className="bg-slate-100" />
            </div>
        </div>
    );
};
export default StructuredForm;