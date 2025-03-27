import Endpoints from './Endpoints';
import { is } from '../../../src_shared/TypeUtils';

type QueryValue = string | Record<string, any>;

const responseHandler = async (response: Response) => {
    if(!response.ok) {
        const error = await response.text();
        console.error(error);
        return Promise.reject(error);
    }

    return response.status !== 204 ? await response.json() : undefined;
}

/** Object containing fetch shortcuts for GSA specific endpoints. */
const GSA = {
    /**
     * Shortcut to use a GET fetch call.
     * @param input Url, will be prefixed by Endpoints.local_endpoint.
     * @param query Can take an object which will generate the query string from each property's name and value, or a raw string as a query.
     */
    get(input: string | URL | globalThis.Request, query?: QueryValue) {
        let queryString = '';
        if (is.object(query)) {
            queryString = new URLSearchParams(query).toString();
        }
        else if (is.string(query)) {
            queryString = query;
        }

        if (queryString.length > 0) {
            input += '?' + queryString;
        }

        return fetch(Endpoints.local_endpoint + input, { method: 'GET' })
        .then(responseHandler);
    },
    /**
     * Shortcut to use a PUT fetch call.
     * @param input Url, will be prefixed by Endpoints.local_endpoint.
     * @param content A value to be sent as JSON. If it is not a JS object or an JS array, it will be wrapped in JS object before being sent.
     */
    put(input: string | URL | globalThis.Request, content) {
        if(content != null && !is.object(content) && !Array.isArray(content)) {
            content = { value: content };
        }

        return fetch(Endpoints.local_endpoint + input, {
            method: 'PUT', 
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(content),
        })
        .then(responseHandler);
    },
    /**
     * Shortcut to use a POST fetch call.
     * @param input Url, will be prefixed by Endpoints.local_endpoint.
     * @param content A value to be sent as JSON. If it is not a JS object or an JS array, it will be wrapped in JS object before being sent.
     */
    post(input: string | URL | globalThis.Request, content) {
        if(content != null && !is.object(content) && !Array.isArray(content)) {
            content = { value: content };
        }

        return fetch(Endpoints.local_endpoint + input, {
            method: 'POST', 
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(content),
        })
        .then(responseHandler);
    },
    /**
     * Shortcut to use a DELETE fetch call.
     * @param input Url, will be prefixed by Endpoints.local_endpoint.
     * @param content A value to be sent as JSON. If it is not a JS object or an JS array, it will be wrapped in JS object before being sent.
     */
    delete(input: string | URL | globalThis.Request, content) {
        if(content != null && !is.object(content) && !Array.isArray(content)) {
            content = { value: content };
        }

        return fetch(Endpoints.local_endpoint + input, {
            method: 'DELETE', 
            headers: {
                "Content-Type": "application/json",
            },
            body: content ? JSON.stringify(content) : undefined,
        })
        .then(responseHandler);
    }
}

export default GSA;