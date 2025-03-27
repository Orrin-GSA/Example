
import React, { useState } from "react";
import { Modal } from "react-bootstrap";
import ToastUtils from "../util/ToastUtils";
import { is } from "../../../src_shared/TypeUtils";

// TODO: Modal that can be invoked with a promise, allowing devs to await a response from the user.
type DetailsDefaults = {
    header: string | React.JSX.Element;
    useLarge: boolean;
}

const getDefaults = (): DetailsDefaults => ({
    header: 'Details',
    useLarge: true,
});

const defaults = getDefaults();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let openInternal = (body: string | React.JSX.Element, opts?: Partial<DetailsDefaults>) => {
    ToastUtils.showDevError('Details Modal not initialized.');
}

// Sketchy, but there should only ever be one instance of this object in the tree and shouldn't have any conflicts.

/** Open generic modal field. Intended as a reusable popup to provide extra details for whatever the dev requires. */
export const openDetailsModal = (body: string | React.JSX.Element, opts?: Partial<DetailsDefaults>) => openInternal(body, opts);

function DetailsModal() {
    const [show, setShow] = useState(false);
    const [header, setHeader] = useState<string | React.JSX.Element>('');
    const [body, setBody] = useState<string | React.JSX.Element>(<></>);
    const [useLarge, setUseLarge] = useState(defaults.useLarge);

    openInternal = (message: string | React.JSX.Element, opts?: Partial<DetailsDefaults>) => {
        if (!message) {
            return Promise.reject('"message" argument is required.');
        }

        const options = opts ? Object.assign({}, defaults, opts) : defaults;
        setUseLarge(options.useLarge);

        setHeader(is.string(options.header) ? <b>{options.header}</b> : options.header);
        setBody(message);
        setShow(true);
    }

    const onTryHide = () => {
        setShow(false);
    }

    return (
        <Modal show={show} onHide={onTryHide} size={useLarge ? 'lg' : 'sm'}>
            <Modal.Header closeButton>
                {header}
            </Modal.Header>
            <Modal.Body>
                {body}
            </Modal.Body>
        </Modal>)
}

export default DetailsModal;