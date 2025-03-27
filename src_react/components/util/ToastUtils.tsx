import React from 'react';
import toast, { ToastOptions } from 'react-hot-toast';
import { is } from '../../../src_shared/TypeUtils';
import AppConfig from '../../../src_shared/AppConfig';

/** @type {import("react-hot-toast").ToastOptions} */
export const toastSuccessSettings = {
    style: {
        border: '1px solid #0c9112',
        padding: '16px',
        color: '#000000',
    },
    iconTheme: {
        primary: '##ffffff',
        secondary: '#0c9112',
    },
    duration: 7000
};

/** @type {import("react-hot-toast").ToastOptions} */
export const toastWarningSettings = {
    style: {
        border: '1px solid #ffc107',
        padding: '16px',
        color: '#000000',
    },
    iconTheme: {
        primary: '##ffffff',
        secondary: '#ffc107',
    },
    duration: 3000
};

/** @type {import("react-hot-toast").ToastOptions} */
export const toastFailureSettings = {
    style: {
        border: '1px solid #a10808',
        padding: '16px',
        color: '#000000',
    },
    iconTheme: {
        primary: '##ffffff',
        secondary: '#a10808',
    },
    duration: 7000
}

const makeDefaultToast = (msg) => function DefaultToast(t: ToastOptions) { 
    return (
    <span onClick={() => toast.dismiss(t.id)} onKeyDown={() => toast.dismiss(t.id)} role="button" tabIndex={-1}>
        {msg}
    </span>
)};

const show = (msg: string | React.JSX.Element) => {
    toast.success(makeDefaultToast(msg), toastSuccessSettings);
}

const showWarning = (msg: string | React.JSX.Element) => {
    toast.success(makeDefaultToast(msg), toastWarningSettings);
}

const showError = (msg: string | React.JSX.Element) => {
    toast.error(makeDefaultToast(msg), toastFailureSettings);
}

const showValidationError = (validationErrors: string[], header: string | React.JSX.Element = "Validation Failed:") => {
    toast.error(makeDefaultToast(<>{header} <ul>{validationErrors.map(x => <li key={x}>{x}</li>)}</ul></>), toastFailureSettings);
}

/** Will log an error message to the console, and if the application is in Development mode, will create an toast error message with the specific dev error, or if not will provide a generic error message. */
const showDevError = (error: string | Error) => {
    console.error(error);
    let toastMessage = '';
    if (AppConfig.isDevelopment) {
        if(is.error(error)) {
            toastMessage = error.message;
        }
        else {
            toastMessage = error;
        }
        toast.error(makeDefaultToast('DEV: ' + toastMessage), toastFailureSettings);
    }
    else {
        toast.error('An issue occurred, please try again or contact support.', toastFailureSettings);
    }
}

/** Wraps a promise-based toast call. Ensure that it is handled in a try/catch, otherwise the toast will linger till the timeout.  */
const showInProgress = (msg: string | React.JSX.Element) => {
    let successMsg: string | React.JSX.Element = '';
    let errorMsg: string | React.JSX.Element = '';
    
    let resolveToast: (msg: string | React.JSX.Element) => void, rejectToast: (msg: string | React.JSX.Element) => void;
    const promise = new Promise<void>((accept, reject) => {
        // Auto-timeout as a backup, moreso so that the toast doesn't linger forever if we fail close the promise.
        const handle = setTimeout(() => {
            reject('Timeout occurred, no response received.');
        }, 60000);

        resolveToast = (msg) => {
            successMsg = msg;
            clearTimeout(handle);
            accept();
        };
        rejectToast = (msg) => {
            errorMsg = msg;
            clearTimeout(handle);
            reject();
        };
    }).catch(() => { }); // Catch the reject so it doesn't bubble up.

    toast.promise(
        promise,
        {
            loading: msg,
            // @ts-expect-error Hack
            success: () => (is.string(successMsg) ? makeDefaultToast(successMsg) : successMsg),
            // @ts-expect-error Hack
            error: () => (is.string(errorMsg) ? makeDefaultToast(errorMsg) : errorMsg),
        },
        {
            success: toastSuccessSettings,
            error: toastFailureSettings
        }
    );

    return { resolveToast, rejectToast };
}

export default { show, showWarning, showError, showValidationError, showDevError, showInProgress };