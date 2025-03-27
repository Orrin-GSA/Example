import { createSlice } from '@reduxjs/toolkit';

export const overallMetricsSlice = createSlice({
    name: 'overallMetrics',
    initialState: {
        usePie: false,
    },
    reducers: {
        setUsePie: (state, action) => {
            // Redux Toolkit allows us to write "mutating" logic in reducers. It
            // doesn't actually mutate the state because it uses the immer library,
            // which detects changes to a "draft state" and produces a brand new
            // immutable state based off those changes
            state.usePie = !!action.payload;
        }
    }
});

export const { setUsePie } = overallMetricsSlice.actions;

export const selectUsePie = state => state.overallMetrics.usePie;

export default overallMetricsSlice.reducer;