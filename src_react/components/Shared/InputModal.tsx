// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useRef, useState } from "react";
import { Button, Col, Form, Modal, Row } from "react-bootstrap";
import { is } from "../../../src_shared/TypeUtils";
import ToastUtils from "../util/ToastUtils";

// TODO: Modal that can be invoked with a promise, allowing devs to await a response from the user.
type InputDefaults = {
    useLarge: boolean;
    /** If true, the user can click outside of the modal to close it, triggering a "cancel". Defaults to true. */
    outsideClicking: boolean;
    /** If true, the promise will only ever resolve, but will return [false, ...] if canceled. If false, it will reject the promise when canceled. Defaults to true. */
    alwaysConfirm: boolean;
    /** If true, requires that the valid parse to a valid number. */
    isNumeric: boolean;
    /** If true, will check that the input is not empty. Defaults to true. */
    isValueRequired: boolean;
}

const getDefaults = (): InputDefaults => ({
    useLarge: true,
    outsideClicking: true,
    isNumeric: false,
    alwaysConfirm: true,
    isValueRequired: true
});

const defaults = getDefaults();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let openInternal = (message: string, opts?: Partial<InputDefaults>): Promise<[canceled: boolean, result: string]> => {
    ToastUtils.showDevError('Input Modal not initialized.');
    return Promise.reject('Modal not initialized.');
}

// Sketchy, but there should only ever be one instance of this object in the tree and shouldn't have any conflicts.
/** Open modal with input field. This will return a promise that will resolve with the resulting input or be rejected. */
export const openInputAsync = (message: string, opts?: Partial<InputDefaults>) => openInternal(message, opts);

function InputModal() {
    const [show, setShow] = useState(false);
    const [message, setMessage] = useState('');
    const [inputValue, setInputValue] = useState('');

    const [useLarge, setUseLarge] = useState(defaults.useLarge);
    const [outsideClicking, setOutsideClicking] = useState(defaults.outsideClicking);
    const [isNumeric, setIsNumeric] = useState(defaults.isNumeric);
    const [isValueRequired, setIsValueRequired] = useState(defaults.isValueRequired);

    // Promise to resolve with?
    const resultRef = useRef<string | null>(null);
    const cancelRef = useRef<boolean>(false);
    const promiseRef = useRef<{ resolve: (value: [canceled: boolean, result: string]) => void, reject: (reason?: any) => void }>(null);

    openInternal = (message: string, opts?: Partial<InputDefaults>) => {
        if (!message) {
            return Promise.reject('"message" argument is required.');
        }

        const options = opts ? Object.assign({}, defaults, opts) : defaults;
        setMessage(message);
        setOutsideClicking(options.outsideClicking);
        setUseLarge(options.useLarge);
        setIsNumeric(options.isNumeric);
        setIsValueRequired(options.isValueRequired);

        // Result to provide if onConfirm is not called before closing. 
        //  null makes the promise returned rejected, false makes it resolve with the value of false.
        resultRef.current = options.alwaysConfirm ? '' : null;
        cancelRef.current = false;
        const promise = new Promise<[canceled: boolean, result: string]>((resolve, reject) => {
            promiseRef.current = { resolve, reject };
        });

        setShow(true);
        return promise;
    }

    const onCancel = () => {
        cancelRef.current = true;
        close();
    }

    const onConfirm = () => {
        if(isNumeric && !is.validNumber(inputValue)) {
            ToastUtils.showWarning('Field must be a valid number.');
            return;
        }
        
        if(isValueRequired && inputValue.toString().trim() == '') {
            ToastUtils.showWarning('A value is required to continue.');
            return;
        }

        resultRef.current = inputValue;
        close();
    }

    const close = () => {
        setShow(false);
    }

    // Waits till after the animation finishes closing to resolve promise. Can be jarring if other modals start to popup before this closes or this modal needs to be reused back to back.
    const onExited = () => {
        if (resultRef.current == null) {
            promiseRef.current.reject();
        } else {
            promiseRef.current.resolve([cancelRef.current, resultRef.current]);
        }
        promiseRef.current = null;
        setInputValue('');
    }

    const onTryHide = () => {
        if (!outsideClicking) {
            return;
        }

        setShow(false);
    }

    return (
        <Modal show={show} onHide={onTryHide} onExited={onExited} size={useLarge ? 'lg' : 'sm'}>
            <Modal.Header closeButton>
                {/* <Button onClick={() => onCancel(true)} aria-label="Close">&times;</Button> */}
                {/* <Modal.Title>Confirm</Modal.Title> */}
            </Modal.Header>
            <Modal.Body>
                <Row>
                    <Col size='12' className="text-center">
                        <span>{message}</span>
                        <hr></hr>
                        {
                            isNumeric ?
                            <Form.Control value={inputValue}  /> :
                            <Form.Control as={'textarea'} rows={useLarge ? 5 : 3} onChange={(e) => setInputValue(e.target.value)} /> 
                        }
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="warning" onClick={onCancel}>
                    Cancel
                </Button>
                <Button variant="success" onClick={onConfirm}>
                    Save
                </Button>
            </Modal.Footer>
        </Modal>)
}

export default InputModal;