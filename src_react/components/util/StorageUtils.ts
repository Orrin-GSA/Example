import AppConstants from "../../../src_shared/AppConstants";
import { assert, is, to } from "../../../src_shared/TypeUtils";
import { useState } from "react";

/**
 * Creates shortcuts for saving and retrieving local storage values with a specific prefix.
 * @param version a simple incrementable number that can be manually incremented to clear previous cached versions.
 */
export const makeStorage = (prefix: string, version?: number) => {
    const keys = new Set<string>();
    prefix = version ? prefix + "_v" + version : prefix;

    // getNoTracking is used internally only.
    const getNoTracking = (name: string, defaultVal = undefined) => {
        return localStorage.getItem(prefix + ':' + name) ?? defaultVal;
    }

    const get = (name: string, defaultVal = undefined) => {
        keys.add(name);
        return localStorage.getItem(prefix + ':' + name) ?? defaultVal;
    }

    get.asInt = (name: string, defaultVal = undefined) => {
        return to.int(get(name), defaultVal);
    }

    get.asFloat = (name: string, defaultVal = undefined) => {
        return to.float(get(name), defaultVal);
    }

    get.asBool = (name: string, defaultVal = undefined) => {
        return to.bool(get(name), defaultVal);
    }

    /**
     * Gets the value from the name and prefix and tries to JSON parse it as an Object.
     */
    get.asObject = (name: string, defaultVal = {}): Record<any, any> => {
        const strValue = get(name);
        if(!strValue) {
            return defaultVal;
        }
        
        let value;
        try {
            value = JSON.parse(strValue);
        }
        catch(error) {            
            console.error(error + '. Returning default value.');
            return defaultVal;
        }

        if(!is.object(value)) {
            return defaultVal;
        }
        
        return value;
    }

    /**
     * Gets the value from the name and prefix and tries to JSON parse it as an Array.
     */
    get.asArray = (name: string, defaultVal: any[] = []) => {
        const strValue = get(name);
        if(!strValue) {
            return defaultVal;
        }
        
        let value;
        try {
            value = JSON.parse(strValue);
        }
        catch(error) {            
            console.error(error + '. Returning default value.');
            return defaultVal;
        }

        if(!is.array(value)) {
            return defaultVal;
        }
        
        return value;
    }

    /** 
     * Stores the value in the session using the name and prefix. Objects and Arrays are automatically JSON stringified. 
     * */
    const set = (name: string, value) => {
        keys.add(name);
        if(is.object(value) || is.array(value)) {
            value = JSON.stringify(value);
        }

        localStorage.setItem(prefix + ':' + name, value);
    }
    
    // getNoTracking is used internally only.
    const setNoTracking = (name: string, value) => {
        if(is.object(value) || is.array(value)) {
            value = JSON.stringify(value);
        }

        localStorage.setItem(prefix + ':' + name, value);
    }

    const clear = (name: string) => {
        localStorage.removeItem(prefix + ':' + name);
    }

    /** Clears any storage that has been setup for this storage, it does not include child storage. */
    const clearAll = () => {
        keys.forEach(name => {
            localStorage.removeItem(prefix + ':' + name);
        });
    }

    /** A shortcut to include the parent object's prefix on top of this one. */
    const makeChildStorage = (childPrefix: string) => {
        return makeStorage(prefix + '|' + childPrefix);
    }

    /* useStorageState: A series of shortcuts to create a react state that also sets a local storage variable, including type specific versions.  */

    const useStorageStateInternal = <T>(name: string, initialState: T | (() => T), getType, checkVersion: boolean): ReactUseStateStorage<T> => {
        assert.string(name, 'name is required for useSessionState.');

        const [state, setState] = useState(() => {
            // If check version is true, we want to compare against the last tracked version number for this state. If it doesn't match, clear the current state which will cause the getType to use the initialState value.
            if(checkVersion) {
                const stateVersion = getNoTracking(name + '-versionNumber');
                if(AppConstants.versionNumber !== stateVersion) {
                    clear(name);
                }
                setNoTracking(name + '-versionNumber', AppConstants.versionNumber);
            }

            return getType(name, is.function(initialState) ? initialState() : initialState)
        });

        const setSessionState = (value) => {
            // If dispatch value is a function, we need to update the local storage inside of the dispatch call.
            if (is.function(value)) {
                setState(prevState => {
                    const nextState = value(prevState);
                    set(name, nextState);
                    return nextState;
                });
            }
            else {
                set(name, value);
                setState(value);
            }
        }

        return [state, setSessionState];
    }

    /** 
     * Create state and retrieve and update the value in storage as a plain string.
     * @param name name of the key for this state. will be prefixed by the storage's name to prevent collisions.
     * @param initialState an initial state to default to if there is no localStorage for this state on the initial setup.
     * @param checkVersion If true, will clear the localStorage for this state and reset to the default provided by initialState whenever it detects an update in the version of the app.
     */
    const useStorageState = (name: string, initialState: string | (() => string) = undefined, checkVersion: boolean = false) => {
        return useStorageStateInternal(name, initialState, get, checkVersion);
    }

    /** 
     * Create state and retrieve and update the value in storage as an array.
     * @param name name of the key for this state. will be prefixed by the storage's name to prevent collisions.
     * @param initialState an initial state to default to if there is no localStorage for this state on the initial setup.
     * @param checkVersion If true, will clear the localStorage for this state and reset to the default provided by initialState whenever it detects an update in the version of the app.
     */
    useStorageState.asArray = <T extends Array<K>, K=any>(name: string, initialState: T | (() => T) = undefined, checkVersion: boolean = false) => {
        return useStorageStateInternal(name, initialState, get.asArray, checkVersion);
    }

    /** 
     * Create state and retrieve and update the value in storage as an object.
     * @param name name of the key for this state. will be prefixed by the storage's name to prevent collisions.
     * @param initialState an initial state to default to if there is no localStorage for this state on the initial setup.
     * @param checkVersion If true, will clear the localStorage for this state and reset to the default provided by initialState whenever it detects an update in the version of the app.
     */
    useStorageState.asObject = <T extends object>(name: string, initialState: T | (() => T) = undefined, checkVersion: boolean = false) => {
        return useStorageStateInternal(name, initialState, get.asObject, checkVersion);
    }

    /** 
     * Create state and retrieve and update the value in storage as an integer Number.
     * @param name name of the key for this state. will be prefixed by the storage's name to prevent collisions.
     * @param initialState an initial state to default to if there is no localStorage for this state on the initial setup.
     * @param checkVersion If true, will clear the localStorage for this state and reset to the default provided by initialState whenever it detects an update in the version of the app.
     */
    useStorageState.asInt = (name: string, initialState: number | (() => number) = undefined, checkVersion: boolean = false) => {
        return useStorageStateInternal(name, initialState, get.asInt, checkVersion);
    }

    /** 
     * Create state and retrieve and update the value in storage as a Number.
     * @param name name of the key for this state. will be prefixed by the storage's name to prevent collisions.
     * @param initialState an initial state to default to if there is no localStorage for this state on the initial setup.
     * @param checkVersion If true, will clear the localStorage for this state and reset to the default provided by initialState whenever it detects an update in the version of the app.
     */
    useStorageState.asFloat = (name: string, initialState: number | (() => number) = undefined, checkVersion: boolean = false) => {
        return useStorageStateInternal(name, initialState, get.asFloat, checkVersion);
    }

    /**
     *  Create state and retrieve and update the value in storage as a Boolean. 
     * @param name name of the key for this state. will be prefixed by the storage's name to prevent collisions.
     * @param initialState an initial state to default to if there is no localStorage for this state on the initial setup.
     * @param checkVersion If true, will clear the localStorage for this state and reset to the default provided by initialState whenever it detects an update in the version of the app.
     * */
    useStorageState.asBool = (name: string, initialState: boolean | (() => boolean) = undefined, checkVersion: boolean = false) => {
        return useStorageStateInternal(name, initialState, get.asBool, checkVersion);
    }

    return { get, set, clear, clearAll, useStorageState, makeChildStorage };
}

type ReactUseStateStorage<T> = [state: T, setStorageState: React.Dispatch<React.SetStateAction<T>>];

export default { makeStorage };