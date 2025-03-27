import { createSlice } from '@reduxjs/toolkit';
import { assertAlways } from '../../../src_shared/TypeUtils';
import { makeStorage } from './StorageUtils';
import { RootState } from './StoreLoad';

type UserSettingsState = {
    username: string;
    useGreyScale: boolean;
    email: string;
    isAdmin: boolean;
    isDark: boolean
}

const { get, set } = makeStorage('user');

const initialState = {
    username: get('username', ''),
    useGreyScale: get.asBool('useGreyScale', false),
    email: get('email', ''),
    isAdmin: get.asBool('isAdmin', false),
    isDark: get.asBool('isDark', false)
} as UserSettingsState;


export const userSettingsSlice = createSlice({
    name: 'user',
    initialState: initialState,
    reducers: {
        setUsername: (state, action) => {
            assertAlways.string(action.payload);

            state.username = action.payload;
            set('username', action.payload);
        },
        setEmail: (state, action) => {
            assertAlways.string(action.payload);

            state.email = action.payload;
            set('email', action.payload);
        },
        setIsAdmin: (state, action) => {
            assertAlways.bool(action.payload);

            state.isAdmin = action.payload;
            set('isAdmin', action.payload);
        },
        setUseGreyScale: (state, action) => {
            assertAlways.bool(action.payload);

            state.useGreyScale = action.payload;
            set('useGreyScale', action.payload);
        },
        setIsDark: (state, action) => {
            assertAlways.bool(action.payload);

            state.isDark = action.payload;
            set('isDark', action.payload);
        },
        reset: (state) => {
            // Don't reset username, only settings managed by the user.
            state.useGreyScale = false;
        }
    }
});

export const { setUsername, setEmail, setIsAdmin, setUseGreyScale, setIsDark, reset } = userSettingsSlice.actions;

/** @returns {string} */
export const selectUsername = (root: RootState) => root.user.username;
/** @returns {string} */
export const selectEmail = (root: RootState) => root.user.email;
/** @returns {bool} */
export const selectIsAdmin = (root: RootState) => root.user.isAdmin;
/** @returns {bool} */
export const selectIsDark = (root: RootState) => root.user.isDark;
/** @returns {boolean} */
export const selectUseGreyScale = (root: RootState) => root.user.useGreyScale;

export default userSettingsSlice.reducer;