import { assert } from "../../../src_shared/TypeUtils";

/** An awaitable timeout call. Alternatively can be simply used as a promise. */
export const setTimeoutAsync = (ms: number) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return new Promise<void>((accept, reject) => {
        setTimeout(() => {
            accept();
        }, ms);
    });
}

type RetryOptions = {
    /** Max tries before throwing error. Defaults to 3. */
    max?: number;
    /** Delay between retries, in milliseconds. Defaults to 1000. */
    timeout?: number;
    /** Accepts an error message and returns a boolean indicating if it should stop retrying pre-emptively. Useful if you want to stop the retry depending on the error received. */
    checkStop?: (error?) => boolean;
}

const defaultRetryOptions: RetryOptions = {
    max: 3,
    timeout: 1000,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    checkStop(error) { return false },
}

export function retry<T = any>(funcToRetry: () => Promise<T>, options: RetryOptions = defaultRetryOptions): Promise<T> {
    let maxTries = options.max ?? 3;
    const timeout = options.timeout ?? 1000;
    const checkStop = options.checkStop ?? (() => false);
    assert.check(maxTries > 0 && maxTries <= 3, 'Max tries must be greater than 0 and less than 3');
    assert.check(timeout > 0 && timeout <= 60000, 'Timeout cannot be less than 1 millisecond or above 60 seconds');
    const tryCalling = () => {
        maxTries -= 1;
        return funcToRetry().catch(error => {
            if(maxTries <= 0 || checkStop(error)) { 
                throw error;
            }

            console.error('Error occurred, retrying.', error);
            return setTimeoutAsync(timeout).then(tryCalling);
        });
    }

    return tryCalling();
}