import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// THUNK 1: Log the initial interaction from the AI assistant
export const logInteractionWithAI = createAsyncThunk(
    'interaction/logWithAI',
    async (text, { rejectWithValue }) => {
        try {
            const requestBody = { user_id: 1, text: text };
            const response = await axios.post('http://127.0.0.1:8000/api/v1/log_interaction', requestBody);
            
            const backendData = response.data.data_sent_to_db;

            // Manually map snake_case from backend to camelCase for our frontend state.
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
            return rejectWithValue(error.response?.data || "Failed to log interaction.");
        }
    }
);

// THUNK 2: Update the interaction with user edits
export const updateInteraction = createAsyncThunk(
    'interaction/update',
    async (interactionData, { rejectWithValue }) => {
        try {
            const { logId, ...updateData } = interactionData;
            if (!logId) {
                return rejectWithValue("No Log ID found. Cannot update.");
            }
            const response = await axios.put(`http://127.0.0.1:8000/api/v1/update_interaction/${logId}`, updateData);
            return response.data;
        } catch (error) {
            return rejectWithValue(error.response?.data || "Failed to update interaction.");
        }
    }
);

const initialState = {
    logId: null,
    hcpName: "",
    interactionType: "",
    date: "",
    time: "",
    topicsDiscussed: "",
    sentiment: "Neutral",
    outcomes: "",
    followUpActions: "",
    materialsShared: "",
    samplesDistributed: "",
    status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed' | 'updating' | 'updated'
    error: null
};

const interactionSlice = createSlice({
    name: 'interaction',
    initialState,
    reducers: {
        updateFormField: (state, action) => {
            const { field, value } = action.payload;
            state[field] = value;
        },
        resetStatus: (state) => {
            if (state.status === 'updated') {
                state.status = 'succeeded';
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(logInteractionWithAI.pending, (state) => {
                state.status = 'loading';
                state.error = null;
            })
            .addCase(logInteractionWithAI.fulfilled, (state, action) => {
                state.status = 'succeeded';
                Object.assign(state, action.payload);
                state.date = new Date().toISOString().split('T')[0];
                state.time = new Date().toTimeString().split(' ')[0].substring(0, 5);
            })
            .addCase(logInteractionWithAI.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.detail || 'Failed to log interaction.';
            })
            .addCase(updateInteraction.pending, (state) => {
                state.status = 'updating';
                state.error = null;
            })
            .addCase(updateInteraction.fulfilled, (state) => {
                state.status = 'updated'; 
            })
            .addCase(updateInteraction.rejected, (state, action) => {
                state.status = 'failed';
                state.error = action.payload?.detail || 'Failed to update.';
            });
    }
});

export const { updateFormField, resetStatus } = interactionSlice.actions;
export default interactionSlice.reducer;
