import AppConfig from "./AppConfig";

/** Collection of type checking utilities. */
export const is = {
    /** Checks if this is a *pure* object, it is not a function, array, or other object derived typed. */
    object(arg) {
        return arg != null && Object.prototype.toString.call(arg) === '[object Object]';
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    function(arg): arg is Function {
        return arg != null && Object.prototype.toString.call(arg) === '[object Function]';
    },
    promise(arg): arg is Promise<any> {
        return arg != null && Object.prototype.toString.call(arg) === '[object Promise]';
    },
    string(arg): arg is string {
        return arg != null && Object.prototype.toString.call(arg) === '[object String]';
    },
    number(arg): arg is number {
        return arg != null && Object.prototype.toString.call(arg) === '[object Number]';
    },
    bool(arg): arg is boolean {
        return arg != null && Object.prototype.toString.call(arg) === '[object Boolean]';
    },
    date(arg): arg is Date {
        return arg != null && Object.prototype.toString.call(arg) === '[object Date]';
    },
    array(arg): arg is any[] {
        return arg != null && Array.isArray(arg);
    },
    error(arg): arg is Error {
        return arg != null && Object.prototype.toString.call(arg) === '[object Error]';        
    },
    /**
     * Checks if value is or can be converted to a Date and that the Date is valid (non-NaN).
     * @param {string|number|Date|null} date
     */
    validDate(date: string | number | Date | null) {
        if (is.string(date) || is.number(date)) {
            date = new Date(date);
        }

        return is.date(date) && !isNaN(date.getTime());
    },
    validNumber(arg: string | number | null): boolean {
        if(arg == null) {
            return false;
        }

        if(is.string(arg)) {
            arg = to.float(arg);
        }

        return !isNaN(arg) && isFinite(arg);
    },
    validEmail(email: string) {
        return email.match(
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
        );
    },
    emptyObject(obj: Record<any, unknown>) {
        for (const prop in obj) {
            if (Object.hasOwn(obj, prop)) {
                return false;
            }
        }

        return true;
    },
    validUrl(string) {
        let url;

        try {
            url = new URL(string);
        } catch (_) {
            return false;
        }

        return url.protocol === "http:" || url.protocol === "https:";
    },
    /**
     * Checks if value is a string, and that string is a valid date.
     * @param str
     */
    stringDate(str): str is string {
        return is.string(str) && is.validDate(str);
    },
}

/** Collection of type conversion utilities. */
export const to = {
    /**
     * Converts string to integer. If NaN, returns 0.
     */
    int(arg: string, defaultVal: number = 0) {
        const number = parseInt(arg, 10);
        return Number.isNaN(number) ? defaultVal : number;
    },
    /**
     * Converts string to float. If NaN, returns 0.
     */
    float(arg: string, defaultVal: number = 0) {
        const number = parseFloat(arg);
        return Number.isNaN(number) ? defaultVal : number;
    },
    // NOTE: this isn't trying to coerce a string into a boolean, rather it's checking if the value is the literal toString() result, IE if you'd written a boolean to localStorage.
    //       If necessary for a more general boolean conversion, create a boolLike method instead.
    /**
     * Converts string to bool if "true" or "false". If it is not a valid result, returns false.
     */
    bool(arg: string, defaultVal: boolean = false) {
        arg = arg?.toLocaleLowerCase();

        // We don't simply use `return arg === 'true'` because a non-value should be an invalid bool.
        if (arg === 'true') {
            return true;
        }
        if (arg === 'false') {
            return false;
        }

        return defaultVal;
    },
    /**
     * Ensures that the value passed will be a Date object if it can become one, or otherwise null.
     */
    date(date: string | number | Date | null): Date | null {
        if (is.string(date) || is.number(date)) {
            date = new Date(date);
        }

        return date;
    },

    /** Maps an array to an object using a key because I hate using `arr.reduce(...)` to handle this. */
    mapping<T>(arr: Array<T>, keyFunc: (item: T) => string | number | undefined): Record<string | number, T> {
        const result: Record<string | number, T> = {};
        
        for(let i = 0; i < arr.length; i++) {
            const item = arr[i];
            const key = keyFunc(item);
            if(key != null) {
                result[key] = item;
            }
        }

        return result;
    }
}

/** Collection of type asserting utilities. Used to ensure a variable is the type, or immediately throw an error if it is not. assert methods are checked only in development mode. */
export namespace assert {
    /**
    * Throws an Error if arg is not a object.
    */
    export function object<T = any>(arg: T | null | undefined, errStr: string = undefined): asserts arg is T  {
        if (!AppConfig.isDevelopment) {
            return;
        }

        assertAlways.object(arg, errStr);
    }
    /**
    * Throws an Error if arg is not a function.
    * @param {any} arg 
    * @param {string} [errStr] 
    */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    export function func(arg: any, errStr: string = undefined): asserts arg is Function {
        if (!AppConfig.isDevelopment) {
            return;
        }

        assertAlways.func(arg, errStr);
    }
    /**
    * Throws an Error if arg is not a string.
    * @param {any} arg 
    * @param {string} [errStr] 
    */
    export function string(arg: any, errStr: string = undefined): asserts arg is string {
        if (!AppConfig.isDevelopment) {
            return;
        }

        assertAlways.string(arg, errStr);
    }
    /**
    * Throws an Error if arg is not a number.
    * @param {any} arg 
    * @param {string} [errStr] 
    */
    export function number(arg: any, errStr: string = undefined): asserts arg is number {
        if (!AppConfig.isDevelopment) {
            return;
        }

        assertAlways.number(arg, errStr);
    }
    /**
    * Throws an Error if arg is not a bool.
    */
    export function bool(arg: any, errStr: string = undefined): asserts arg is boolean {
        if (!AppConfig.isDevelopment) {
            return;
        }

        assertAlways.bool(arg, errStr);
    }
    /**
    * Throws an Error if arg is not a date.
    */
    export function  date(arg: any, errStr: string = undefined): asserts arg is Date {
        if (!AppConfig.isDevelopment) {
            return;
        }

        assertAlways.date(arg, errStr);
    }
    /**
    * Throws an Error if arg is not an array. 
    */
    export function array<T=any>(arg: any | null | undefined, errStr: string = undefined): asserts arg is T[] {
        if (!AppConfig.isDevelopment) {
            return;
        }

        assertAlways.array(arg, errStr);
    }
    /**
    * Throws an Error if arg is falsey. Used as a general purpose check method.
    * @example
    * assert.check(someObj != null, 'Object must not be null.');
    * assert.check(someObj.prop !== undefined, 'Object must have property "prop".');
    * assert.check(someArray.length > 0, 'Array Length must be greater than zero.');
    */
    export function check(condition: any, errStr: string = undefined) {
        if (!AppConfig.isDevelopment) {
            return;
        }

        assertAlways.check(condition, errStr);
    }
};

/** Collection of type asserting utilities. Used to ensure a variable is the type, or immediately throw an error if it is not. assertAlways methods are checked in both development and production mode. */
export namespace assertAlways {
    /**
    * Throws an Error if arg is not a object.
    */
    export function object<T = any>(arg: T | null | undefined, errStr: string = `Expected Object but received ${arg != null ? Object.prototype.toString.call(arg) : arg}.`): asserts arg is object & T {
        if (!is.object(arg)) {
            throw new Error(errStr);
        }
    }
    /**
    * Throws an Error if arg is not a function.
    */
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    export function func(arg: any, errStr: string = `Expected Function but received ${arg != null ? Object.prototype.toString.call(arg) : arg}.`): asserts arg is Function {
        if (!is.function(arg)) {
            throw new Error(errStr);
        }
    }
    /**
    * Throws an Error if arg is not a string.
    */
    export function string(arg: any, errStr: string = `Expected String but received ${arg != null ? Object.prototype.toString.call(arg) : arg}.`): asserts arg is string {
        if (!is.string(arg)) {
            throw new Error(errStr ?? 'arg was not a string.');
        }
    }
    /**
    * Throws an Error if arg is not a number.
    */
    export function number(arg: any, errStr: string = `Expected Number but received ${arg != null ? Object.prototype.toString.call(arg) : arg}.`): asserts arg is number {
        if (!is.number(arg)) {
            throw new Error(errStr ?? 'arg was not a number.');
        }
    }
    /**
    * Throws an Error if arg is not a bool.
    */
    export function bool(arg, errStr: string = `Expected Boolean but received ${arg != null ? Object.prototype.toString.call(arg) : arg}.`): asserts arg is boolean {
        if (!is.bool(arg)) {
            throw new Error(errStr ?? 'arg was not a bool.');
        }
    }
    /**
    * Throws an Error if arg is not a date.
    */
    export function date(arg: any, errStr: string = `Expected Date but received ${arg != null ? Object.prototype.toString.call(arg) : arg}.`): asserts arg is Date {
        if (!is.date(arg)) {
            throw new Error(errStr ?? 'arg was not a date.');
        }
    }
    /**
    * Throws an Error if arg is not an array.
    */
    export function array<T=any>(arg: any | null | undefined, errStr: string = `Expected Array but received ${arg != null ? Object.prototype.toString.call(arg) : arg}.`): asserts arg is T[] {
        if (!is.array(arg)) {
            throw new Error(errStr ?? 'arg was not an array.', arg);
        }
    }
    /**
    * Throws an Error if condition is falsey. Used as a general purpose check method.
    * @example
    * assertAlways.check(someObj, 'Object must not be null.');
    * assertAlways.check(someObj != null, 'Object must not be null.');
    * assertAlways.check(someObj.prop !== undefined, 'Object must have property "prop".');
    * assertAlways.check(someArray.length > 0, 'Array Length must be greater than zero.');
    */
    export function check(condition: any | (() => any), errStr: string = undefined) {
        const result = is.function(condition) ? condition() : condition;

        if (!result) {
            throw new Error(errStr);
        }
    }
};

const defaultFilterCallback = (item) => item != null;
const defaultMaxCallback = (item) => (item ?? Number.MIN_SAFE_INTEGER) as number;

export namespace arrayUtils {

    /** Removes element from the array. NOTE: This is an *in-place* removal. */
    export function remove<T>(array: T[], itemToRemove: T) {
        const idx = array.indexOf(itemToRemove);
        if(idx == -1) {
            return false;
        }
        array.splice(idx, 1);
        return true;
    }

    /** Removes the first element to match the condition from the array. NOTE: This is an *in-place* removal. */
    export function removeFirst<T>(array: T[], itemToRemove: (item: T) => boolean) {
        const idx = array.findIndex(itemToRemove);
        if(idx == -1) {
            return false;
        }
        array.splice(idx, 1);
        return true;
    }

    /** Combined array map then filter function. If filterCallback is not provided, it will default to "mapValue => mapValue != null" */
    export function mapFilter<T=any, U=any>(array: T[], mapCallback: (item: T, index?: number, arr?: T[]) => U, filterCallback?: (mapValue: U) => boolean) {
        const result: U[] = [];
        filterCallback ??= defaultFilterCallback;

        for(let i = 0; i < array.length; i++) {
            const value = mapCallback(array[i], i, array);
            if(filterCallback(value)) {
                result.push(value);
            }
        }

        return result;
    }

    /** Combined array filter then map function. If filterCallback is not provided, it will default to "mapValue => mapValue != null" */
    export function filterMap<T=any, U=any>(array: T[], mapCallback: (item: T, index?: number, arr?: T[]) => U, filterCallback?: (mapValue: T) => boolean) {
        const result: U[] = [];
        filterCallback ??= defaultFilterCallback;

        for(let i = 0; i < array.length; i++) {
            const element = array[i];
            if(filterCallback(element)) {
                const value = mapCallback(element, i, array);
                result.push(value);
            }            
        }

        return result;
    }

    export function max<T=any>(array: T[], mapping?: (item: T, index?: number, arr?: T[]) => number) {
        let max = Number.MIN_SAFE_INTEGER;
        mapping ??= defaultMaxCallback;
        for(let i = 0; i < array.length; i++) {
            const nextVal = mapping(array[i]);
            if(nextVal > max) {
                max = nextVal;
            }
        }
        return max;
    }

    export function minMax<T=any>(array: T[], mapping?: (item: T, index?: number, arr?: T[]) => number) {
        let max = Number.MIN_SAFE_INTEGER;
        let min = Number.MAX_SAFE_INTEGER;
        mapping ??= defaultMaxCallback;
        for(let i = 0; i < array.length; i++) {
            const nextVal = mapping(array[i]);
            if(nextVal > max) {
                max = nextVal;
            }
            if(nextVal < min) {
                min = nextVal;
            }
        }
        return [min, max];
    }

    /**
     * returns an array of a range of numbers, range(4) => [0, 1, 2, 3]
     */
    export function range(size: number, startAt = 0) {
        return [...Array(size).keys()].map(i => i + startAt);
    }
    
    /**
     * returns an array of characters starting from one letter of the alphabet and going to the other, characterRange('A', 'D') => ['A', 'B', 'C', 'D']
     * @param startChar starting character, only uses first character of passed string. Ensure to use the same capitalization for both arguments.
     * @param endChar eind character, only uses first character of passed string. Ensure to use the same capitalization for both arguments.
     */
    export function characterRange(startChar: string, endChar: string) {
        return String.fromCharCode(...range(endChar.charCodeAt(0) - startChar.charCodeAt(0), startChar.charCodeAt(0)));
    }

    // https://stackoverflow.com/a/12646864/6758317
    export function shuffle<T=unknown>(source: T[]): T[] {
        const copy = source.concat();
        for (let i = copy.length - 1; i >= 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
    }
}

export namespace objectUtils { 
    /** acts like a forEach loop, but using the properties on the object. */
    export function forEach<T extends Record<any, any>, TK extends Extract<keyof T, string> = Extract<keyof T, string>>(obj: T, fcn: (prop: TK, value?: T[TK]) => void) {        
        for (const prop in obj) {
            if (Object.hasOwn(obj, prop)) {
                fcn(prop as TK, obj[prop] as T[TK]);
            }
        }
    }

    export function map<T extends Record<any, any>, TK extends Extract<keyof T, string> = Extract<keyof T, string>>(obj: T, fcn: (prop: TK, value?: T[TK]) => any) {
        const results = [];
        for (const prop in obj) {
            if (Object.hasOwn(obj, prop)) {
                results.push(fcn(prop as TK, obj[prop] as T[TK]));
            }
        }
        return results;
    }

    export function filter<T extends Record<any, any>, TK extends Extract<keyof T, string> = Extract<keyof T, string>>(obj: T, fcn: (prop: TK, value?: T[TK]) => boolean) {
        const results = [];
        for (const prop in obj) {
            if (Object.hasOwn(obj, prop) && fcn(prop as TK, obj[prop] as T[TK])) {
                results.push(prop);
            }
        }
        return results;
    }

    /** Combined array map then filter function. If filterCallback is not provided, it will default to "mapValue => mapValue != null" */
    export function mapFilter<T extends Record<any, any>, U=any>(obj: T, mapCallback: (item: keyof T) => U, filterCallback?: (mapValue: U) => boolean) {
        const results: U[] = [];
        filterCallback ??= defaultFilterCallback;

        for (const prop in obj) {            
            if (Object.hasOwn(obj, prop)) {
                const value = mapCallback(prop);
                if(filterCallback(value)) {
                    results.push(value);
                }
            }
        }

        return results;
    }

    /** Combined array filter then map function. If filterCallback is not provided, it will default to "mapValue => mapValue != null" */
    export function filterMap<T extends Record<any, any>, U=any>(obj: T, mapCallback: (item: keyof T) => U, filterCallback?: (mapValue: keyof T) => boolean) {
        const results: U[] = [];
        filterCallback ??= defaultFilterCallback;

        for (const prop in obj) {
            if (Object.hasOwn(obj, prop)) {
                if (filterCallback(prop)) {
                    const value = mapCallback(prop);
                    results.push(value);
                }
            }
        }

        return results;
    }
}

export default { is, to, assert, assertAlways };