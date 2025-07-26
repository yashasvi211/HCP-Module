import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// --- Best Practice Note ---
// Storing the API base URL in an environment variable is recommended.
// Example: const API_URL = process.env.REACT_APP_API_URL;
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

// A helper to map backend snake_case keys to frontend camelCase
const mapDataToCamelCase = (data) => ({
    hcpName: data.hcp_name,
    interactionType: data.interaction_type,
    sentiment: data.sentiment,
    topicsDiscussed: data.topics_discussed,
    outcomes: data.outcomes,
    followUpActions: data.follow_up_actions,
    materialsShared: data.materials_shared,
    samplesDistributed: data.samples_distributed,
});

// Thunk for AI-powered form filling
export const fillFormWithAI = createAsyncThunk(
    'interaction/fillFormWithAI',
    async (text, { rejectWithValue }) => {
        try {
            // NOTE: The user_id should come from your authentication state.
            const response = await axios.post(`${API_BASE_URL}/fill_form_with_ai`, { user_id: 1, text });
            return {
                logId: response.data.log_id,
                interactionData: mapDataToCamelCase(response.data.data_sent_to_db),
                // Assumes the API can return suggestions
                suggestedFollowUps: response.data.suggested_follow_ups || [], 
            };
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

// Thunk for chatting with the AI
export const chatWithAI = createAsyncThunk(
    'interaction/chatWithAI',
    async (text, { rejectWithValue }) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/chat_with_ai`, { user_id: 1, text });
            return response.data.ai_message;
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

// Thunk for manual form saves/updates
export const saveManualInteraction = createAsyncThunk(
    'interaction/saveManual',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { currentLogId, currentInteractionData } = getState().interaction;
            const payload = { user_id: 1, log_id: currentLogId, ...currentInteractionData };
            const response = await axios.post(`${API_BASE_URL}/save_manual`, payload);
            return {
                isNew: !currentLogId,
                newLogData: {
                    logId: response.data.log_id,
                    ...mapDataToCamelCase(response.data.data_sent_to_db)
                }
            };
        } catch (error) {
            return rejectWithValue(error.response?.data);
        }
    }
);

const emptyInteraction = { hcpName: '', interactionType: '', sentiment: 'Neutral', topicsDiscussed: '', outcomes: '', followUpActions: '', materialsShared: '', samplesDistributed: '' };

const initialState = {
    history: [],
    currentLogId: null,
    currentInteractionData: { ...emptyInteraction },
    suggestedFollowUps: [],
    aiResponseMessage: null,
    status: 'idle', // 'idle' | 'loading' | 'updating' | 'succeeded' | 'failed'
    error: null,
};

const interactionSlice = createSlice({
    name: 'interaction',
    initialState,
   reducers: {
    startNewInteraction: (state) => {
        state.currentLogId = null;
        state.currentInteractionData = { ...emptyInteraction };
        state.suggestedFollowUps = [];
        state.aiResponseMessage = null;
        state.status = 'idle';
        state.error = null;
    },
    setCurrentInteraction: (state, action) => {
        const logId = action.payload;
        const interactionFromHistory = state.history.find(log => log.logId === logId);
        if (interactionFromHistory) {
            state.currentLogId = logId;
            state.currentInteractionData = { ...interactionFromHistory };
            state.suggestedFollowUps = [];
            state.aiResponseMessage = null;
        }
    },
    updateFormField: (state, action) => {
        const { field, value } = action.payload;
        state.currentInteractionData[field] = value;
    },
    
    // ✅ NEW REDUCER: Clears the interaction history
    clearInteractionHistory: (state) => {
        state.history = [];
    },
},

    extraReducers: (builder) => {
        const handlePending = (state) => {
            state.status = 'loading';
            state.error = null;
            state.aiResponseMessage = null;
        };
        const handleRejected = (state, action) => {
            state.status = 'failed';
            state.error = action.payload?.detail || 'An unexpected error occurred.';
        };
        
        builder
            .addCase(fillFormWithAI.pending, handlePending)
            .addCase(fillFormWithAI.fulfilled, (state, action) => {
                const { logId, interactionData, suggestedFollowUps } = action.payload;
                const newLog = { logId, ...interactionData };
                
                state.status = 'succeeded';
                state.history.push(newLog);
                state.currentLogId = logId;
                state.currentInteractionData = newLog;
                state.suggestedFollowUps = suggestedFollowUps;
            })
            .addCase(fillFormWithAI.rejected, handleRejected)

            .addCase(chatWithAI.pending, handlePending)
            .addCase(chatWithAI.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.aiResponseMessage = action.payload;
            })
            .addCase(chatWithAI.rejected, handleRejected)

            .addCase(saveManualInteraction.pending, (state) => {
                state.status = 'updating';
                state.error = null;
            })
            .addCase(saveManualInteraction.fulfilled, (state, action) => {
                const { newLogData } = action.payload;
                const existingIndex = state.history.findIndex(log => log.logId === newLogData.logId);

                if (existingIndex !== -1) {
                    state.history[existingIndex] = newLogData;
                } else {
                    state.history.push(newLogData);
                }
                
                state.currentLogId = newLogData.logId;
                state.currentInteractionData = newLogData;
                state.status = 'succeeded';
                 // Optionally display a temporary success message via another state property
            })
            .addCase(saveManualInteraction.rejected, (state, action) => {
                 state.status = 'failed';
                 state.error = action.payload?.detail || 'Failed to save changes.';
            });
    }
});

export const {
    startNewInteraction,
    setCurrentInteraction,
    updateFormField,
    clearInteractionHistory // ✅ Export this too
} = interactionSlice.actions;

export default interactionSlice.reducer;
