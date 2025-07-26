import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Thunk for AI-powered form filling
export const fillFormWithAI = createAsyncThunk(
    'interaction/fillFormWithAI',
    async (text, { rejectWithValue }) => {
        try {
            const requestBody = { user_id: 1, text };
            const response = await axios.post('http://127.0.0.1:8000/api/v1/fill_form_with_ai', requestBody);
            const backendData = response.data.data_sent_to_db;
            return {
                logId: response.data.log_id,
                hcpName: backendData.hcp_name, interactionType: backendData.interaction_type,
                sentiment: backendData.sentiment, topicsDiscussed: backendData.topics_discussed,
                outcomes: backendData.outcomes, followUpActions: backendData.follow_up_actions,
                materialsShared: backendData.materials_shared, samplesDistributed: backendData.samples_distributed
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
            const requestBody = { user_id: 1, text };
            const response = await axios.post('http://127.0.0.1:8000/api/v1/chat_with_ai', requestBody);
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
            const { currentLogId, newInteractionData, history } = getState().interaction;
            const dataToSend = currentLogId ? history.find(h => h.logId === currentLogId) : newInteractionData;
            const payload = { user_id: 1, log_id: currentLogId, ...dataToSend };
            const response = await axios.post('http://127.0.0.1:8000/api/v1/save_manual', payload);
            const backendData = response.data.data_sent_to_db;
            return {
                isNew: !currentLogId,
                oldLogId: currentLogId,
                newLogData: {
                    logId: response.data.log_id,
                    hcpName: backendData.hcp_name, interactionType: backendData.interaction_type,
                    sentiment: backendData.sentiment, topicsDiscussed: backendData.topics_discussed,
                    outcomes: backendData.outcomes, followUpActions: backendData.follow_up_actions,
                    materialsShared: backendData.materials_shared, samplesDistributed: backendData.samples_distributed
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
    newInteractionData: { ...emptyInteraction },
    aiResponseMessage: null,
    status: 'idle',
    error: null
};

const interactionSlice = createSlice({
    name: 'interaction',
    initialState,
    reducers: {
        startNewInteraction: (state) => {
            state.currentLogId = null;
            state.newInteractionData = { ...emptyInteraction };
            state.status = 'idle';
            state.error = null;
            state.aiResponseMessage = null;
        },
        setCurrentInteraction: (state, action) => {
            state.currentLogId = action.payload;
            state.newInteractionData = { ...emptyInteraction };
            state.aiResponseMessage = null;
        },
        updateFormField: (state, action) => {
            const { field, value } = action.payload;
            if (state.currentLogId) {
                const index = state.history.findIndex(log => log.logId === state.currentLogId);
                if (index !== -1) state.history[index][field] = value;
            } else {
                state.newInteractionData[field] = value;
            }
        },
        resetStatus: (state) => {
            if (state.status === 'updated') state.status = 'succeeded';
        }
    },
    extraReducers: (builder) => {
        const handlePending = (state) => { state.status = 'loading'; state.error = null; state.aiResponseMessage = null; };
        const handleRejected = (state, action) => { state.status = 'failed'; state.error = action.payload?.detail || 'An error occurred.'; };
        
        builder
            .addCase(fillFormWithAI.pending, handlePending)
            .addCase(fillFormWithAI.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.history.push(action.payload);
                state.currentLogId = action.payload.logId;
                state.newInteractionData = { ...emptyInteraction };
            })
            .addCase(fillFormWithAI.rejected, handleRejected)

            .addCase(chatWithAI.pending, handlePending)
            .addCase(chatWithAI.fulfilled, (state, action) => {
                state.status = 'succeeded';
                state.aiResponseMessage = action.payload;
            })
            .addCase(chatWithAI.rejected, handleRejected)

            .addCase(saveManualInteraction.pending, (state) => { state.status = 'updating'; state.error = null; })
            .addCase(saveManualInteraction.fulfilled, (state, action) => {
                state.status = 'updated';
                const { oldLogId, newLogData } = action.payload;
                const existingIndex = state.history.findIndex(log => log.logId === oldLogId);
                if (existingIndex !== -1) {
                    state.history[existingIndex] = newLogData;
                } else {
                    state.history.push(newLogData);
                }
                state.currentLogId = newLogData.logId;
                state.newInteractionData = { ...emptyInteraction };
            })
            .addCase(saveManualInteraction.rejected, handleRejected);
    }
});

export const { startNewInteraction, setCurrentInteraction, updateFormField, resetStatus } = interactionSlice.actions;
export default interactionSlice.reducer;
