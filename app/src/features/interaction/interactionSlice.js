import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const sendChatMessage = createAsyncThunk(
    'interaction/sendChatMessage',
    async (text, { getState, rejectWithValue }) => {
        try {
            const { currentLogId } = getState().interaction;
            const requestBody = { user_id: 1, text: text, current_log_id: currentLogId };
            const response = await axios.post('http://127.0.0.1:8000/api/v1/chat', requestBody);
            
            // The response structure is now different for queries vs. logs/edits.
            if (response.data.ai_message) {
                return { type: 'query', message: response.data.ai_message };
            } else {
                const backendData = response.data.data_sent_to_db;
                return {
                    type: 'log',
                    oldLogId: currentLogId, 
                    newLogData: {
                        logId: response.data.log_id,
                        hcpName: backendData.hcp_name,
                        interactionType: backendData.interaction_type,
                        sentiment: backendData.sentiment,
                        topicsDiscussed: backendData.topics_discussed,
                        outcomes: backendData.outcomes,
                        followUpActions: backendData.follow_up_actions,
                        materialsShared: backendData.materials_shared,
                        samplesDistributed: backendData.samples_distributed
                    }
                };
            }
        } catch (error) {
            return rejectWithValue(error.response?.data || "Failed to process request.");
        }
    }
);

const initialState = {
    history: [], 
    currentLogId: null,
    // A field to store the AI's natural language response.
    aiResponseMessage: null,
    status: 'idle',
    error: null
};

const interactionSlice = createSlice({
    name: 'interaction',
    initialState,
    reducers: {
        startNewInteraction: (state) => {
            state.history = [];
            state.currentLogId = null;
            state.aiResponseMessage = null;
            state.status = 'idle';
            state.error = null;
        },
        setCurrentInteraction: (state, action) => {
            state.currentLogId = action.payload;
            state.aiResponseMessage = null; // Clear AI message when user selects a log
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(sendChatMessage.pending, (state) => {
                state.status = 'loading';
                state.error = null;
                state.aiResponseMessage = null; // Clear previous message
            })
            .addCase(sendChatMessage.fulfilled, (state, action) => {
                state.status = 'succeeded';
                
                // Handle the two different types of responses.
                if (action.payload.type === 'query') {
                    state.aiResponseMessage = action.payload.message;
                } else {
                    const { oldLogId, newLogData } = action.payload;
                    const existingIndex = state.history.findIndex(log => log.logId === oldLogId);
                    if (existingIndex !== -1) {
                        state.history[existingIndex] = newLogData;
                    } else {
                        state.history.push(newLogData);
                    }
                    state.currentLogId = newLogData.logId;
                }
            })
            .addCase(sendChatMessage.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.detail || 'Failed to process request.';
            });
    }
});

export const { startNewInteraction, setCurrentInteraction } = interactionSlice.actions;
export default interactionSlice.reducer;