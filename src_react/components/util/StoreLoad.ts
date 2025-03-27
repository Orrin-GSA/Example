import { configureStore } from '@reduxjs/toolkit';

import overallMetricsReducer from '../pages/OverallMetrics/slice';
import loadingReducer from './LoadingSlice'
import apiDataReducer from './ApiDataSlice';
import userSettingsSlice from './UserSettingsSlice';

const store = configureStore({
    reducer: {
        api: apiDataReducer,
        loading: loadingReducer,
        overallMetrics: overallMetricsReducer,
        user: userSettingsSlice
    }
});

// Get the type of our store variable
export type AppStore = typeof store
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>
// Inferred type: {api, loading, overallMetrics, users}
export type AppDispatch = AppStore['dispatch']

export default store;