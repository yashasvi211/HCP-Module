import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Thunk for all AI communication (log and edit)
export const sendChatMessage = createAsyncThunk(
    'interaction/sendChatMessage',
    async (text, { getState, rejectWithValue }) => {
        try {
            const { currentLogId } = getState().interaction;
            const requestBody = { user_id: 1, text: text, current_log_id: currentLogId };
            const response = await axios.post('http://127.0.0.1:8000/api/v1/chat', requestBody);
            const backendData = response.data.data_sent_to_db;

            return {
                logId: response.data.log_id,
                hcpName: backendData.hcp_name,
                interactionType: backendData.interaction_type,
                sentiment: backendData.sentiment,
                topicsDiscussed: backendData.topics_discussed,
                outcomes: backendData.outcomes,
                followUpActions: backendData.follow_up_actions,
                materialsShared: backendData.materials_shared,
                samplesDistributed: backendData.samples_distributed
            };
        } catch (error) {
            return rejectWithValue(error.response?.data || "Failed to process request.");
        }
    }
);

// Thunk for MANUAL form updates
export const updateInteractionManually = createAsyncThunk(
    'interaction/updateManually',
    async (_, { getState, rejectWithValue }) => {
        try {
            const { history, currentLogId } = getState().interaction;
            const interactionToUpdate = history.find(log => log.logId === currentLogId);

            if (!interactionToUpdate) {
                return rejectWithValue("No interaction selected to update.");
            }
            
            const payload = {
                hcp_name: interactionToUpdate.hcpName,
                interaction_type: interactionToUpdate.interactionType,
                sentiment: interactionToUpdate.sentiment,
                topics_discussed: interactionToUpdate.topicsDiscussed,
                outcomes: interactionToUpdate.outcomes,
                follow_up_actions: interactionToUpdate.followUpActions,
                materials_shared: interactionToUpdate.materialsShared,
                samples_distributed: interactionToUpdate.samplesDistributed,
            };

            const response = await axios.put(`http://127.0.0.1:8000/api/v1/update_interaction/${currentLogId}`, payload);
            return { updatedData: interactionToUpdate, response: response.data };
        } catch (error) {
            return rejectWithValue(error.response?.data || "Failed to update interaction.");
        }
    }
);


const initialState = {
    history: [],
    currentLogId: null,
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
            state.status = 'idle';
            state.error = null;
        },
        // Allows form inputs to update the state
        updateFormField: (state, action) => {
            const { field, value } = action.payload;
            const index = state.history.findIndex(log => log.logId === state.currentLogId);
            if (index !== -1) {
                state.history[index][field] = value;
            }
        },
        // Allows clicking on a history item to make it active
        setCurrentInteraction: (state, action) => {
            state.currentLogId = action.payload;
        },
        resetStatus: (state) => {
            if (state.status === 'updated') {
                state.status = 'succeeded';
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(sendChatMessage.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(sendChatMessage.fulfilled, (state, action) => {
                state.status = 'succeeded';
                const newLogData = action.payload;
                const existingIndex = state.history.findIndex(log => log.logId === newLogData.logId);
                if (existingIndex !== -1) {
                    state.history[existingIndex] = newLogData;
                } else {
                    state.history.push(newLogData);
                }
                state.currentLogId = newLogData.logId;
            })
            .addCase(sendChatMessage.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.detail || 'Failed to process request.';
            })
            .addCase(updateInteractionManually.pending, (state) => {
                state.status = 'updating';
                state.error = null;
            })
            .addCase(updateInteractionManually.fulfilled, (state) => {
                state.status = 'updated'; 
            })
            .addCase(updateInteractionManually.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.detail || 'Failed to update.';
            });
    }
});

export const { startNewInteraction, updateFormField, setCurrentInteraction, resetStatus } = interactionSlice.actions;
export default interactionSlice.reducer;
