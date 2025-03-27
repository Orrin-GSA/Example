// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useRef, useState } from "react";
import { Button, Col, Modal, Row } from "react-bootstrap";
import ToastUtils from "../util/ToastUtils";

// TODO: Modal that can be invoked with a promise, allowing devs to await a response from the user.
type ConfirmDefaults = {
    /** Text for confirm button. */
    confirm: string;
    /** Text for cancel button. */
    cancel: string;
    /** If true, will exapnd the size of the modal. */
    useLarge: boolean;
    /** If true, the promise will only ever resolve, returning true if confirmed or false if canceled in any way. If alwaysConfirm is false, it will reject the promise when canceled. Defaults to true. */
    alwaysConfirm: boolean;
    /** If true, the user can click outside of the modal to close it, triggering a "cancel". Defaults to true. */
    outsideClicking: boolean;
}

const getDefaults = (): ConfirmDefaults => ({
    confirm: "Yes",
    cancel: "No",
    useLarge: false,
    alwaysConfirm: true,
    outsideClicking: true
});
const defaults = getDefaults();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let openInternal = (message: string, opts?: Partial<ConfirmDefaults>): Promise<boolean> => {
    ToastUtils.showDevError('Input Modal not initialized.');
    return Promise.reject('Modal not initialized.');
}

// Sketchy, but there should only ever be one instance of this object in the tree and shouldn't have any conflicts.
/** Open modal with a simple confirm/cancel button. This will return a promise that will resolve or reject based on the modal. */
export const openConfirmAsync = (message: string, opts?: Partial<ConfirmDefaults>) => openInternal(message, opts);

function ConfirmModal() {
    const [show, setShow] = useState(false);
    const [message, setMessage] = useState('');
    const [useLarge, setUseLarge] = useState(defaults.useLarge);
    const [confirmText, setConfirmText] = useState(defaults.confirm);
    const [cancelText, setCancelText] = useState(defaults.cancel);
    const [outsideClicking, setOutsideClicking] = useState(defaults.outsideClicking);

    // Promise to resolve with?
    const resultRef = useRef<boolean | null>(null);
    const promiseRef = useRef<{ resolve: (value: boolean) => void, reject: (reason?: any) => void  }>(null);

    openInternal = (message: string, opts?: Partial<ConfirmDefaults>) => {
        if(!message) {
            return Promise.reject('"message" argument is required.');
        }

        const options = opts ? Object.assign({}, defaults, opts) : defaults;
        setMessage(message);
        setConfirmText(options.confirm);
        setCancelText(options.cancel);
        setOutsideClicking(options.outsideClicking);
        setUseLarge(options.useLarge);

        // Result to provide if onConfirm is not called before closing. 
        //  null makes the promise returned rejected, false makes it resolve with the value of false.
        resultRef.current = options.alwaysConfirm ? false : null;
        const promise = new Promise<boolean>((resolve, reject) => {
            promiseRef.current = { resolve, reject };
        })

        setShow(true);
        return promise;
    }

    const onCancel = () => {
        close();
    }

    const onConfirm = () => {
        resultRef.current = true;
        close();
    }

    const close = () => {
        setShow(false);
    }

    // Waits till after the animation finishes closing to resolve promise. Can be jarring if other modals start to popup before this closes or this modal needs to be reused back to back.
    const onExited = () => {
        if (resultRef.current == null) {
            promiseRef.current.reject(false);
        } else {
            promiseRef.current.resolve(resultRef.current);
        }
    }

    const onTryHide = () => {
        if (!outsideClicking) {
            return;
        }

        setShow(false);
    }

    return (
        <Modal show={show} onHide={onTryHide} onExited={onExited} size={useLarge ? 'lg': 'sm'}>
            <Modal.Header closeButton>
                {/* <Button onClick={() => onCancel(true)} aria-label="Close">&times;</Button> */}
                <Modal.Title>Confirm</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row>
                    <Col size='12'>{message}</Col>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="warning" onClick={onCancel}>
                    {cancelText}
                </Button>
                <Button variant="success" onClick={onConfirm}>
                    {confirmText}
                </Button>
            </Modal.Footer>
        </Modal>)
}

export default ConfirmModal;