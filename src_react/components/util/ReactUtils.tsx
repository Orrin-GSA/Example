/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Button } from 'react-bootstrap';
import * as Icon from 'react-bootstrap-icons';
import { is } from '../../../src_shared/TypeUtils';
// import { deepEqual, createCustomEqual } from 'fast-equals';

/**
 * Wrapper to call async functions in useEffect. NOTE: This is simple shortcut for how async functions are supposed to be called in useEffect.
 * @param setup Imperative function that **cannot** return a cleanup function.
 * @param {import('react').DependencyList | undefined} dependencies If present, effect will only activate if the values in the list change.
 */
export function useAsyncEffect(setup: () => Promise<any>, dependencies = undefined) {
    useEffect(() => {
        setup().catch(console.error);
    }, dependencies);
}

/** Bypasses Development mode's double effect call. Double effect call is a safety feature; avoid using this when possible. */
export function useOnMountUnsafe(effect) {
    const initialized = useRef(false)

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            return effect();
        }
    }, [])
}

/** Bypasses Development mode's double effect call. Double effect call is a safety feature; avoid using this when possible. */
export function useOnMountUnsafeAsync(effect: () => Promise<any>) {
    const initialized = useRef(false)

    useEffect(() => {
        if (!initialized.current) {
            initialized.current = true;
            effect().catch(console.error);
        }
    }, [])
}

/** useEffect to trigger after one or more of the dependencies has updated and after a certain amount of time has passed. */
export function useDebounceEffect(effect: () => void, duration: number, dependencies: React.DependencyList = undefined) {
    useEffect(() => {
        const handle = setTimeout(effect, duration);
        return () => clearTimeout(handle);
    }, dependencies)
}

type DebounceEffectAsyncOptions = {
    /** Called once the pause for the debounce is disabled. If you want to immediately retrigger the effect, this would be the place to do it. */
    afterEffect?: (success: boolean) => void;
    /** Resets the the debounce if the retrigger is called before the debounce triggers. Defaults to true. */
    resetOnRetrigger?: boolean;
}

const defaultDebounceEffectAsyncOptions: DebounceEffectAsyncOptions = {
    afterEffect: (success: boolean) => { },
    resetOnRetrigger: true
}

// Should pause trigger any additional debounce effects until the promise is completed, success or failure.
/**
 * 
 * @param asyncEffect The effect to trigger, must return a promise or be async.
 * @param duration How long in milliseconds before it should trigger the effect.
 * @param options 
 * @param dependencies If present, effect will only activate if the values in the list change.
 * @returns a function to restart the trigger should it have paused after the last debounce.
 */
export function useDebounceEffectAsync<T = any>(asyncEffect: () => Promise<T>, duration: number, options: DebounceEffectAsyncOptions = undefined, dependencies: React.DependencyList = undefined): [() => Promise<void>, () => void] {
    // Pause has to be a ref, it cannot be a dependency.
    const pauseRef = useRef(false);
    const lastEffectRef = useRef(0);
    const [forceEffect, setForceEffect] = useState(0);
    const [cancelEffect, setCancelEffect] = useState(false);
    const resetOnRetrigger = options?.resetOnRetrigger ?? defaultDebounceEffectAsyncOptions.resetOnRetrigger;
    const retriggerEffect = () => {
        // If this shouldn't reset on trigger, and there is a active trigger (the last effect number and current effect are different), then we simply let the trigger continue.
        if (!resetOnRetrigger && (lastEffectRef.current !== forceEffect || pauseRef.current )) {
            return;
        }

        setCancelEffect(false);
        setForceEffect(x => x += 1);
    }

    const afterEffect = options?.afterEffect ?? defaultDebounceEffectAsyncOptions.afterEffect;
    const triggerEffect = () => {
        pauseRef.current = true;
        
        lastEffectRef.current = forceEffect;
        //console.log(`Started Debounced Effect: ${forceEffect}, ${lastEffectRef.current}`);
        return asyncEffect()
            .finally(() => {
                pauseRef.current = false;
                if(lastEffectRef.current !== forceEffect) {
                    setForceEffect(lastEffectRef.current + 1);
                }
            })
            .then(() => {
                afterEffect(true);
            },
            error => {
                console.error(error);
                afterEffect(false);
            });
    }

    const triggerEffectImmediate = () => {
        setCancelEffect(true);
        return triggerEffect();
    }

    useEffect(() => {
        if(cancelEffect) {
            //console.log(`Canceling Debounced Effect: ${forceEffect}, ${lastEffectRef.current}`);
            return;
        }

        if(lastEffectRef.current === forceEffect) {
            return;
        }

        // If we hit this while it's paused, then forceEffect has been incremented but an existing (older) timeout is running. So setting "lastEffectRef.current = forceEffect;" here increments lastEffectRef in essence.
        if(pauseRef.current) {
            //console.log(`Queuing Debounced Effect: ${forceEffect}, ${lastEffectRef.current}`);
            lastEffectRef.current = forceEffect;
            return;
        }
        
        //console.log(`(re)starting Debounced Effect: ${forceEffect}, ${lastEffectRef.current}`);
        const handle = setTimeout(triggerEffect, duration);
        return () => clearTimeout(handle);
    }, dependencies ? [forceEffect, cancelEffect, ...dependencies] : [forceEffect, cancelEffect]);

    // Return a function that will simply retrigger the useEffect state. Handy if the you want to be able to start the debounce immediately after this finishes.
    return [triggerEffectImmediate, retriggerEffect];
}

// export function useDeepMemo<TResult>(callback: () => TResult, deepObj: Record<any, any> | Map<any, any> | Array<any> | Set<any>, dependencies: React.DependencyList = undefined) {
//     const deepObjRef = useRef(deepObj);

//     if (!deepEqual(deepObj, deepObjRef.current)) {
//         deepObjRef.current = deepObj;
//     }

//     return useMemo(callback, dependencies ? [deepObjRef.current, ...dependencies] : [deepObjRef.current])
// }

export type ObjectMemo<TResult> = {
    current: TResult;
    changed: number
}

// // An experiment, not really useful for small arrays.
// /** 
//  * @example
//  * const result = useObjectMemo(() => ..., arr);
//  * const mapping = useMemo(() => { return result.current.map(...) }, [result.changed]);
//  * */
// export function useObjectMemo<TResult>(callback: () => TResult, obj: Record<any, any> | Map<any, any> | Array<any> | Set<any>, dependencies: React.DependencyList = undefined): ObjectMemo<TResult> {
//     const deepObjRef = useRef(obj);
//     const counterRef = useRef(0);

//     if (!deepEqual(obj, deepObjRef.current)) {
//         deepObjRef.current = obj;
//         counterRef.current += 1;
//     }

//     const result = useMemo(callback, dependencies ? [counterRef.current, ...dependencies] : [counterRef.current]);

//     // This is so you can use changed in a dependency list, as comparing against the current will always return true.
//     return { current: result, changed: counterRef.current };
// }

// Experimental, primarily a shortcut to ensure that we get a 
export function useFieldMemo<T, TResult>(field: keyof T, record: T extends Array<unknown> ? never : T, defaultCallback: () => TResult) {
    return useFieldMemoInternal(field, record, defaultCallback);
}

useFieldMemo.string = <T,>(field: keyof T, record: T extends Array<unknown> ? never : T) => {
    return useFieldMemoInternal<T, string>(field, record, () => '');
}

useFieldMemo.number = <T,>(field: keyof T, record: T extends Array<unknown> ? never : T) => {
    return useFieldMemoInternal<T, number>(field, record, () => 0);
}

function useFieldMemoInternal<T, TResult>(field: keyof T, record: T extends Array<unknown> ? never : T, defaultCallback: () => TResult): TResult {
    return useMemo(() => {
        const result = record?.[field];
        if(result == null) {
            return defaultCallback();
        }

        return result as TResult;
    }, [record?.[field]]);
}

/**
 * A wrapper for setting up state change tracking across multiple states.
 * Any states created by the returned useTrackedState will be managed by the states object. To finalize any tracked state additions and retrieve the states object, call the closeStateTracking function.
 * @returns {[
 *  useTrackedState: UseTrackedState, 
 *  closeStateTracking: () => TrackingStates
 * ]}
 */
export function useStateTracking() {
    const stateFuncs = [];
    let closed = false;

    const resetStates = () => {
        for(let i = 0; i < stateFuncs.length; i++) {
            stateFuncs[i].reset();
        }
    }

    const acceptStates = () => {
        for(let i = 0; i < stateFuncs.length; i++) {
            stateFuncs[i].accept();
        }
    }

    const toObject = () => {
        const obj = {};
        for(let i = 0; i < stateFuncs.length; i++) {
            const state = stateFuncs[i];
            if(!!state.name && state.changed) {
                obj[state.name] = state.value;
            }
        }
        return obj;
    }

    const toFieldsArray = (exclusions: string[] = undefined) => {
        const arr = [];
        exclusions ??= [];
        for(let i = 0; i < stateFuncs.length; i++) {
            const state = stateFuncs[i];
            if(!!state.name && state.changed && !exclusions.includes(state.name)) {
                arr.push(state.name);
            }
        }
        return arr;
    }

    // Optionally provide a custom transform.
    const toArray = (transform = undefined, exclusions: string[] = undefined) => {
        const arr = [];
        transform ??= ((state) => ({ name: state.name, value: state.value }));
        exclusions ??= [];
        for(let i = 0; i < stateFuncs.length; i++) {
            const state = stateFuncs[i];
            if(!!state.name && state.changed && !exclusions.includes(state.name)) {
                arr.push(transform(state));
            }
        }
        return arr;
    }

    /**
     * 
     * @template T
     * @param {T} initialState 
     * @param {string|undefined} propertyName Property name to retrieve changed state when used with parent state.apply() or state.get(). If undefined property will be included for get or apply states.
     * @returns {[state: T, setState: import('react').Dispatch<import('react').SetStateAction<T>>, stateChanged: boolean]}
     */
    const useTrackedState = (initialState, propertyName = undefined) => {
        const [prevState, setPrevStateInternal] = useState(initialState);
        const [state, setStateInternal] = useState(initialState);
        const [stateChanged, setStateChanged] = useState(false);

        if(closed) {
            // closeStateTracking should finalize the tracking object and prevent any further additions.
            throw new Error('Tried to call useTrackedState after closing the state tracking.');
        }

        const resetState = () => {
            if(stateChanged) {
                // Objects and Arrays are assumed to be flat, containing only simple types.
                if(is.object(prevState)) {
                    setStateInternal({ ...prevState });
                }
                else if (is.array(prevState)) {
                    setStateInternal(prevState.slice(0))
                }
                else {
                    setStateInternal(prevState)
                }
                setStateChanged(false);
            }
        }
    
        const acceptState = () => {
            if(stateChanged) {
                // Objects and Arrays are assumed to be flat, containing only simple types.
                if(is.object(state)) {
                    setPrevStateInternal({ ...state });
                }
                else if (is.array(state)) {
                    setPrevStateInternal(state.slice(0))
                }
                else {
                    setPrevStateInternal(state)
                }
                setStateChanged(false);
            }
        }
        
        const setState = (action) => {
            setStateInternal(action);
            setStateChanged(true);
        }

        stateFuncs.push({ 
            reset: resetState,
            accept: acceptState,
            set: setState,
            value: state,
            changed: stateChanged,
            name: propertyName
        })

        /* For reverse compatibility and interop, we need to keep the order of state/setState the same as useState's return result. */
        return [state, setState, stateChanged];
    };

    const closeStateTracking = () => {
        closed = true;
        return { reset: resetStates, accept: acceptStates, toObject, toArray, toFieldsArray };
    };

    return [useTrackedState, closeStateTracking];
}

const defaultAutoMappingOptions: AutoMappingOptions = {
    include: [],

    onUseState: (useStateLocal, propValue) => useStateLocal(propValue),
    onAfterUseState: () => { },

    onStateStarted: () => useState,
    onStateCompleted: (mapping, startState) => { }, 
}

const defaultAutoMappingOptionsLite: AutoMappingOptionsLite = {
    include: [],

    onAfterStateSetup(MappingObject) { },
    onAfterMappingSetup(MappingObject) { },
    onAfterMappingUpdate(mappingObj, nextState, options) { },

    onAfterDefineStateProp(mappedObj, propName) { },
    onAfterDefineMappingProp(mapping, state, propName) { },
    
    onAfterSetMappingProp(currState, nextState, propName, value) { },
}

/**
 * 
 * @param {AutoMappingOptions | string[] } options
 * @returns {MappingObject} an object with the mapped fields from the model. Each field is converted to a property with a getter/setter to retrieve the state or call setState for that field.
 */
export const getTrackingMappingOptions = (options, useTrackedState) => Object.assign({}, {
    onUseState: (value, name) => useTrackedState(value, name),
    onAfterUseState: (mapping, states, propName) => { 
        const stateChanged = states[2];
        mapping[propName + "_changed"] = stateChanged;
    },
    shouldSkip: (mappedObj, propName) => !mappedObj[propName + "_changed"]
}, Array.isArray(options) ? { include: options } : options);

/**
 * 
 * @param model 
 * @param options
 * @returns An object with the mapped fields from the model. Each field is converted to a property with a getter/setter to retrieve the state or call setState for that field.
 */
export function useStateMapper<T=any, TProp extends Extract<keyof T, string> = any>(model: T | null | undefined, options: AutoMappingOptions<T, TProp> | TProp[]): MappingObject<T, TProp> {
    const mapping = {} as MappingObject<T, TProp>;
    //@ts-expect-error Ignoring because the model should always be an object. If null is passed we setup all react state exactly the same but as empty; otherwise react breaks due to inconsistent state instantiation.
    model = model ?? {};

    if(Array.isArray(options)) {
        options = { include: options };
    }

    const include = options?.include ?? [];
    if(include.length <= 0) {
        console.error('A non-empty array of fields to include must be provided.');
        return;
    }

    const onUseState = options?.onUseState ?? defaultAutoMappingOptions.onUseState;    
    const onAfterUseState = options?.onAfterUseState ?? defaultAutoMappingOptions.onAfterUseState;
    const onStateStarted = options?.onStateStarted ?? defaultAutoMappingOptions.onStateStarted;
    const onStateCompleted = options?.onStateCompleted ?? defaultAutoMappingOptions.onStateCompleted;

    const startState = onStateStarted();
    const useStateLocal = Array.isArray(startState) ? startState[0] : startState;

    function mapProperty(propName, propValue) {
        if(is.object(propValue)) {
            console.error('Model property "' + propName + '" is an object and needs to be explicitly told to map via options.children');
            // We don't want to assign an object or array but we still need to deterministically call useState, so we set as null.
            propValue = null;
        }
        else if(is.array(propValue)) {
            console.error('Model property "' + propName + '" is an array and I do not know what to do with arrays.');
            propValue = null;
        }
            
        const stateResults = onUseState(useStateLocal, propValue ?? null, propName);
        const [propState, setPropState] = stateResults;

        // Use getter/setter to simplify. You can read and write like a normal field but it properly uses setState under the hood.
        Object.defineProperty(mapping, propName, {
            get: () => propState,
            set: (x) => setPropState(x)
        });
        // Provide a backup method for setting state if complex use-case is required, IE so that the developer can pass a function to setState.
        mapping["set_" + propName] = setPropState;
        onAfterUseState(mapping, stateResults, propName);
    }

    function resetProperty(propName, propValue) {
        if(is.object(propValue)) {
            console.error('Model property "' + propName + '" is an object and needs to be explicitly told to map via options.children');
            propValue = null;
        }
        else if(is.array(propValue)) {
            console.error('Model property "' + propName + '" is an array and I do not know what to do with arrays.');
            propValue = null;
        }

        mapping[propName] = propValue;
    }

    /** Convert mapped object back to a simple JS object, ignoring the shouldSkip callback. */
    //@ts-expect-error No typings currently
    mapping.toObject = () => {
        const jsObj: Record<string, any> = {};

        for(const propName of include) {
            jsObj[propName] = mapping[propName];
        }

        return jsObj;
    }

    /** Update the state of the whole mapping object. Meant to be used with a useEffect on a state object. */
    mapping.updateFrom = (newModel) => {
        // HACK: this might cause unexpected issues, keep an eye on it.
        //@ts-expect-error Hack to get around complex typings
        newModel = newModel ?? {};
        for(const propName of include) {
            resetProperty(propName, newModel[propName]);
        }
    }

    for(const propName of include) {
        mapProperty(propName, model[propName]);
    }

    onStateCompleted(mapping, startState);

    return mapping;
}

/**
 * A combination of the custom useStateTracking and useStateMapper functions. 
 * The returned mapping object will have attached fields mapped as tracked properties, 
 * and in addition will have changed fields in the form of `[propName + '_changed']`.
 * The changed object will track and manage any changed fields.
 * 
 * @param model Object to map properties from.
 * @param options A string array of fields to create states for and track on the model, or a detailed options object.
 * @param updateOnModelChange Will automatically update the entire mapping state via a useEffect if the tracked model is updated. Useful for resetting the states if the model object is updated. model should be react state. Parameter must be a constant if provided.
 */
export function useStateMapperTracking<T=any, TProp extends Extract<keyof T, string> = any>(model: T | null | undefined, options: AutoMappingOptions<T, TProp> | TProp[], updateOnModelChange: boolean = true): MappingTrackingObject<T, TProp> {
    const mappingOptions = Object.assign({}, {
        onStateStarted: () => useStateTracking(),

        onUseState: (useStateLocal, value, name) => useStateLocal(value, name),
        onAfterUseState: (mapping, states, propName) => { 
            const stateChanged = states[2];
            mapping[propName + "_changed"] = stateChanged;
        },

        onStateCompleted: (mappedObj, [useTrackedState, closeStateTracking]) => mappedObj.changes = closeStateTracking()
    }, Array.isArray(options) ? { include: options } : options) as AutoMappingOptions<T, TProp>;
  
    const mapping = useStateMapper(model, mappingOptions) as MappingTrackingObject<T, TProp>;

    mapping.accept = mapping.changes.accept;

    // Potentially add a "source_changed" flag if updateOnModelChange is false. That would allow the developer to provide options to the user to manually handle refreshing the model in the case an update comes in that overrides current changes.
    if (updateOnModelChange) {
        useEffect(() => {
            // Refresh the entire mapping.
            mapping.updateFrom(model);
            // Call accept so that it updates the "previous" states and all "_changed" flags are cleared.
            mapping.accept();
        }, [model]);
    }

    return mapping;
}

/**
 * 
 * @param model 
 * @param options
 * @returns An object with the mapped fields from the model. Each field is converted to a property with a getter/setter to retrieve the state or call setState for that field.
 */
export function useStateMapperLite<T=any, TProp extends Extract<keyof T, string> = any>(model: T | null | undefined, options: AutoMappingOptionsLite<T, TProp> | TProp[]): MappingObject<T, TProp> {
    const mapping = useStateMapperLiteNoEffect(model, options);    

    useEffect(() => {
        if(Array.isArray(options)) {
            options = { include: options };
        }

        if(!options.disableAutoUpdate) {
            mapping.updateFrom(model);
        }
    }, [model]);

    return mapping;
}

/**
 * 
 * @param model 
 * @param options
 * @returns An object with the mapped fields from the model. Each field is converted to a property with a getter/setter to retrieve the state or call setState for that field.
 */
export function useStateMapperLiteNoEffect<T=any, TProp extends Extract<keyof T, string> = any>(model: T | null | undefined, options: AutoMappingOptionsLite<T, TProp> | TProp[]): MappingObject<T, TProp> {
    const [state, setState] = useState(() => {
        const initialState = {};
        
        if(Array.isArray(options)) {
            options = { include: options } as AutoMappingOptionsLite<T, TProp>;
        }
    
        const include = options?.include ?? [];
        if(include.length <= 0) {
            console.error('A non-empty array of fields to include must be provided.');
            return;
        }

        const onAfterStateSetup = options?.onAfterStateSetup ?? defaultAutoMappingOptionsLite.onAfterStateSetup;
        const onAfterDefineStateProp = options?.onAfterDefineStateProp ?? defaultAutoMappingOptionsLite.onAfterDefineStateProp;

        function mapProperty(propName, propValue) {
            if(is.object(propValue)) {
                console.error('Model property "' + propName + '" is an object and cannot be mapped. Use a additional instance of useStateMapperLite for the child object instead.');
                // We don't want to assign an object or array but we still need to deterministically call useState, so we set as null.
                propValue = null;
            }
            else if(is.array(propValue)) {
                console.error('Model property "' + propName + '" is an array and is unsupported.');
                propValue = null;
            }

            initialState[propName] = propValue;
            onAfterDefineStateProp(initialState, propName);
        }

        const initialModel = model ?? {} as T;
        for(const propName of include) {
            mapProperty(propName, initialModel[propName]);
        }

        onAfterStateSetup(initialState);
        return initialState;
    });

    const mapping = useMemo(() => {
        const mapping = {} as MappingObject<T, TProp>;
    
        if(Array.isArray(options)) {
            options = { include: options } as AutoMappingOptionsLite<T, TProp>;
        }
    
        const include = options?.include ?? [];
        if(include.length <= 0) {
            console.error('A non-empty array of fields to include must be provided.');
            return;
        }
        
        const onAfterSetMappingProp = options?.onAfterSetMappingProp ?? defaultAutoMappingOptionsLite.onAfterSetMappingProp;
        const onAfterDefineMappingProp = options?.onAfterDefineMappingProp ?? defaultAutoMappingOptionsLite.onAfterDefineMappingProp;
        const onAfterMappingSetup = options?.onAfterMappingSetup ?? defaultAutoMappingOptionsLite.onAfterMappingSetup;
        const onAfterMappingUpdate = options?.onAfterMappingUpdate ?? defaultAutoMappingOptionsLite.onAfterMappingUpdate;
    
        function mapProperty(propName) {    
            // Use getter/setter to simplify. You can call it read and write like a normal field but it properly uses setState instead.
            Object.defineProperty(mapping, propName, {
                get: () => state[propName],
                set: (value) => setState((prevState: MappingObject<T, TProp>) => {
                    const nextState = {
                        ...prevState
                    }
    
                    nextState[propName] = value;      
                    onAfterSetMappingProp(state, nextState, propName, value);
                    return nextState;
                })
            });

            onAfterDefineMappingProp(mapping, state, setState, propName);
        }
    
        function resetProperty(nextState, propName, propValue) {
            if(is.object(propValue)) {
                console.error('Model property "' + propName + '" is an object and needs to be explicitly told to map via options.children');
                propValue = null;
            }
            else if(is.array(propValue)) {
                console.error('Model property "' + propName + '" is an array and I do not know what to do with arrays.');
                propValue = null;
            }
    
            nextState[propName] = propValue;
        }
    
        /** Convert mapped object back to a simple JS object, ignoring the shouldSkip callback. */
        //@ts-expect-error No typings currently
        mapping.toObject = () => {
            const jsObj: Record<string, any> = {};
    
            for(const propName of include) {
                jsObj[propName] = mapping[propName];
            }
    
            return jsObj;
        }
    
        /** Update the state of the whole mapping object. Meant to be used with a useEffect on a state object. */
        mapping.updateFrom = (newModel) => {
            // HACK: this might cause unexpected issues, keep an eye on it.
            const updatingModel = newModel ?? {} as T;
            setState(prevState => {
                const nextState = {
                    ...prevState
                }

                for(const propName of include) {
                    resetProperty(nextState, propName, updatingModel[propName]);
                }

                onAfterMappingUpdate(mapping, nextState, options as AutoMappingOptionsLite<T, TProp>);
                return nextState;
            });            
        }
    
        for(const propName of include) {
            mapProperty(propName);
        }

        onAfterMappingSetup(mapping, state, setState, options);
        return mapping;
    }, [state]);

    return mapping as MappingObject<T, TProp>;
}

export function useStateMapperTrackingLite<T=any, TProp extends Extract<keyof T, string> = any>(model: T | null | undefined, options: AutoMappingOptionsLite<T, TProp> | TProp[], disableAutoUpdate?: boolean): MappingTrackingObjectLite<T, TProp> {
    const localModel = model ?? {} as T;
    const mappingOptions = Object.assign({ disableAutoUpdate }, {
        onAfterDefineStateProp(state, propName) {
            state[propName +"_changed"] = false;
        },
        onAfterDefineMappingProp(mapping: MappingTrackingObjectLite<T, TProp>, state, setState, propName) {
            const propChangedName = propName + "_changed";
            Object.defineProperty(mapping, propChangedName, {
                get: () => state[propChangedName],
                set: (value) =>  { 
                    if(state[propChangedName] === value) {
                        return;
                    }
                    setState((prevState) => {
                        const nextState = {
                            ...prevState
                        }
                        if(!value) {
                            nextState[propName] = localModel[propName];
                        }
                        nextState[propChangedName] = value;
                        return nextState;
                    });
                }
            });            
        },
        onAfterSetMappingProp(currState, nextState, propName, value) {
            nextState[propName + "_changed"] = localModel[propName] !== nextState[propName];            
        },
        onAfterMappingSetup(mappingObj: MappingTrackingObjectLite<T, TProp>, state, setState, options) {
            const include = options.include;
            
            mappingObj.changes = {
                apply(obj: any = {}) {
                    for(const propName of include) {
                        obj[propName] = state[propName];
                    }
                    return obj;
                },
                reset() {
                    for(const propName of include) {
                        let propValue = localModel[propName];
                        if(is.object(propValue)) {
                            console.error('Model property "' + propName + '" is an object and cannot be mapped. Use a additional instance of useStateMapperLite for the child object instead.');
                            // We don't want to assign an object or array but we still need to deterministically call useState, so we set as null.
                            propValue = null;
                        }
                        else if(is.array(propValue)) {
                            console.error('Model property "' + propName + '" is an array and is unsupported.');
                            propValue = null;
                        }

                        // Ensure the value is null at the very least and not undefined.
                        propValue ??= null;
                        setState(prevState => {
                            const nextState = { ...prevState };
                            nextState[propName] = propValue;
                            nextState[`${propName}_changed`] = false;
                            return nextState;
                        });
                    }
                },
                accept() {
                    setState(prevState => {
                        const nextState = { ...prevState };
                        for(const propName of include) {
                            nextState[`${propName}_changed`] = false;
                        }     
                        return nextState;
                    });
                },
                toObject(transform = undefined, exclusions: string[] = undefined) {
                    const obj = {} as any;
                    transform ??= state => state.value;
                    exclusions ??= [];

                    for (const propName of include) {
                        if (state[`${propName}_changed`] && !exclusions.includes(propName)) {
                            obj[propName] = transform({ name: propName, value: state[propName] });
                        }
                    }

                    return obj;
                },
                toFieldsArray(exclusions: string[] = undefined) {
                    const arr = [];
                    exclusions ??= [];

                    for(const propName of include) {
                        if(state[`${propName}_changed`] && !exclusions.includes(propName)) { 
                            arr.push(propName);
                        }
                    }

                    return arr;
                },            
                // @ts-expect-error Optionally provide a custom transform.
                toArray(transform = undefined, exclusions: string[] = undefined) {
                    const arr = [];
                    transform ??= ((state) => ({ name: state.name, value: state.value }));
                    exclusions ??= [];
                    for(const propName of include) {
                        if(state[`${propName}_changed`] && !exclusions.includes(propName)) {
                            arr.push(transform({ name: propName, value: state[propName] }));
                        }
                    }
                    return arr;
                },
                forEach(func) {
                    for(const propName of include) {
                        if(state[`${propName}_changed`]) {
                            func({ name: propName, value: state[propName] });
                        }
                    }
                },

                // eslint-disable-next-line react/prop-types
                Undo({ propName, variant, hideWhenUnchanged, children, onUndo, className, ...props }) {
                    const changed = mapping[propName+"_changed"];
                    const undoHandler = () => {
                        mapping[propName+"_changed"] = false;
                        onUndo?.(setState);
                    }
                    
                    if(!hideWhenUnchanged) {
                        return <Button variant={variant} onClick={undoHandler} disabled={!changed} title={changed ? 'Undo' : ''} className={className} {...props}>
                            { children || <Icon.ArrowCounterclockwise color='goldenrod' visibility={changed ? 'inherit' : 'hidden'}></Icon.ArrowCounterclockwise> } 
                        </Button>;
                    }
                    else {
                        return <>{changed && <Button variant={variant} onClick={undoHandler} className={className}><Icon.ArrowCounterclockwise color='goldenrod'></Icon.ArrowCounterclockwise></Button>}</>;
                    }
                },
            }

            mappingObj.accept = mappingObj.changes.accept;
        },
        onAfterMappingUpdate(mappingObj, nextState, options) {
            for(const propName of options.include) {
                nextState[propName +"_changed"] = false;
            }
        },
    } as AutoMappingOptionsLite<T, TProp>, Array.isArray(options) ? { include: options } : options) as AutoMappingOptionsLite<T, TProp>;
  
    // This is a little funky but it can't quite understand that the generics are the same, so we're just gonna tell it they are and move on.
    const mapping = useStateMapperLite(model, mappingOptions) as MappingTrackingObjectLite<T, TProp>;

    return mapping;
}

export type MappingObject<T = any, TProp extends Extract<keyof T, string> = Extract<keyof T, string>> = {
    [Property in TProp]: T[Property];
} & {
    /** Convert mapped object back to a simple JS object, potentially skipping certain fields if the shouldSkip callback was provided. */
    toObject: () => { [Property in TProp]: T[Property] };
    /** Update the state of the whole mapping object. Meant to be used with a useEffect on a state object. */
    updateFrom: (newModel: T) => void;
};

type MappingTrackingObject<T=any, TProp extends Extract<keyof T, string> = Extract<keyof T, string>> = MappingObject<T, TProp> & { changes: TrackingStates<T, TProp>, accept: () => void }

export type MappingTrackingObjectLite<T=any, TProp extends Extract<keyof T, string> = Extract<keyof T, string>> = MappingObject<T, TProp> 
& { 
    /** Returns whether the associated property is different than it's original state. Intended for primitives only and will not work with arrays or objects. */
    readonly [Property in TProp as `${Property}_changed`]: boolean; 
}
& { changes: TrackingStatesFunctions<T, TProp> 
    & { Undo(props: { propName: TProp, variant?: string, hideWhenUnchanged?: boolean, className?: string, onUndo?: (setMappingState?: (prevState: T) => T) => void, children?: React.JSX.Element, [x: string]: any }): React.JSX.Element }, accept: () => void 
}

/** An object for managing the collected tracked states. */
type TrackingStates<T=any, TProp extends Extract<keyof T, string> = Extract<keyof T, string>> = {
    [Property in TProp as `${Property}_changed`]: boolean;
} 
& TrackingStatesFunctions<T, TProp>

type TrackingStatesFunctions<T=any, TProp extends Extract<keyof T, string> = Extract<keyof T, string>> = {
    /** Reset all tracked states to previous values and mark as unchanged. */
    reset(): void;
    /** Applies any states with a propertyName that have been changed to the passed object, or creates a new one and applies if none is passed, and returns it. */
    accept(): void;
    apply(obj?: Record<any, any>): { [Property in TProp]: T[Property] };
    /** returns an array containing the changed fields and their values. */
    toArray(): [{ name: TProp, value: any }];
    toArray<TElem>(transformer: (state: { name: TProp, value: any }) => TElem, exclusions?: TProp[]): TElem[];
    /** returns an array containing the changed fields' names only. */
    toFieldsArray(exclusions?: TProp[]): TProp[];
    /** Returns an object containing the changed fields and their values. */
    toObject(): { [x: string]: any };
    /** Returns an object containing the changed fields and their values. */
    toObject<TElem>(transformer: (state: { name: TProp, value: T[TProp] }) => TElem, exclusions?: TProp[]): { [x: string]: TElem };
    forEach(func: (state: { name: TProp, value: any }) => void): void;
}

type UseTrackedState = <T>(initialState: T | (() => T), propertyName: string|undefined) => [state: T, setState: React.Dispatch<React.SetStateAction<T>>, stateChanged: boolean];

type MappingStartState = <S>(propValue: S, propName?) => [S, React.Dispatch<React.SetStateAction<S>>] | [(propValue: S, propName?) => [S, React.Dispatch<React.SetStateAction<S>>], ...any];

type AutoMappingOptions<T=any, TProp extends Extract<keyof T, string> = Extract<keyof T, string>> = {
    /** Will only map the properties specified in include, if provided. Otherwise it will map all properties automatically. */
    include: TProp[];
    // BUG: Types of Children don't quite recursively work as of yet, but it at least works partially atm.
    /** Map any properties included on object as a child object. Only use with pure objects. Pass null for a child mapping to tell it to map the child w/o any options. */
    //children?: { [TChildProp in TChild]:  AutoMappingOptions<T[TChildProp]> };
    /** Option to provide your own custom useState call. Must return a result consistent with useState. Defaults to `(propValue) => useState(propValue)`. */
    onUseState?: <S>(propValue, [propName], ...any) => [S, React.Dispatch<React.SetStateAction<S>>, ...any];
    /** Optional callback to be called after each property is applied to the mapping object. Passes the output of the `onUseState` call. */
    onAfterUseState?: (mappedObj: MappingObject, states: [state: any, setState: any, ...any], propName: string) => void;
    /** Must return a useState or useState-like function. If it returns an array with a useState-like, the useState must be the first element. */
    onStateStarted?: () => MappingStartState;
    /** Takes the final mapped object and the returned object or array from onStateStarted. Can be used to customize the mapping object before it returns. */
    onStateCompleted?: (mappedObj: MappingObject,  startState: MappingStartState) => void;
}

type AutoMappingOptionsLite<T=any, TProp extends Extract<keyof T, string> = Extract<keyof T, string>> = {
    /** Will only map the properties specified in include, if provided. Otherwise it will map all properties automatically. */
    include: TProp[];
    disableAutoUpdate?: boolean;
    /** Optional callback to be called after a property is updated. */
    onAfterSetMappingProp?: (currState: any, nextState: any, propName: string, value: any) => void;
    onAfterDefineStateProp?: (state: any, propName: string) => void;
    onAfterDefineMappingProp?: (mapping: any, state: any, setState: any, propName: string) => void;
    onAfterStateSetup?: (state: any) => void;
    onAfterMappingSetup?: (mappingObj: any, state: any, setState: (prevState: any) => any, options: AutoMappingOptionsLite<T, TProp>) => void;
    onAfterMappingUpdate?: (mappingObj: any, nextState: any, options: AutoMappingOptionsLite<T, TProp>) => void;
}