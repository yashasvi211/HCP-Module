import React from 'react';

const AISuggestedFollowUp = ({ suggestions }) => {
    if (!suggestions || suggestions.length === 0) {
        return null;
    }

    return (
        <div className="ai-suggestions">
            <h4>💡 AI-Suggested Follow-Ups</h4>
            <ul>
                {suggestions.map((item, index) => (
                    <li key={index}>{item}</li>
                ))}
            </ul>
        </div>
    );
};

export default AISuggestedFollowUp;