/**
 * A safety wrapper around JSON.parse. If the string is empty or otherwise throws an error, it will return the defaultVal instead.
 * @param jsonStr Json string to parse.
 * @param defaultVal Default value to fallback to.
 * @returns The parsed value or defaultVal if the string is invalid.
 */
export function parseSafe<T=any>(jsonStr: string | null | undefined, defaultVal: T = undefined): T {
    if(jsonStr == null || jsonStr === '') {
        return defaultVal;
    }

    try {
        return JSON.parse(jsonStr) as T;
    }
    catch(error) {
        console.error(error, '\nJSON: ', jsonStr);
    }

    return defaultVal;
}