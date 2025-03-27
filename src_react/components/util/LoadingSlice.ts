import { createSlice } from '@reduxjs/toolkit';

export const loadingSlice = createSlice({
    name: 'loading',
    initialState: {
        value: true
    },
    reducers: {
        showLoading: state => {
            // Redux Toolkit allows us to write "mutating" logic in reducers. It
            // doesn't actually mutate the state because it uses the immer library,
            // which detects changes to a "draft state" and produces a brand new
            // immutable state based off those changes
            state.value = false;
        },
        hideLoading: state => {
            state.value = true;
        }
    }
});

export const { showLoading, hideLoading } = loadingSlice.actions;

export const selectLoaded = state => state.loading.value as boolean;

export default loadingSlice.reducer;