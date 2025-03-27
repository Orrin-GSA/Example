// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useEffect, useRef, useState,useContext,useMemo } from "react";
import { Button, Col, Form, InputGroup, Modal, Row } from "react-bootstrap";
import { useQuill } from 'react-quilljs';
import { is } from "../../../../src_shared/TypeUtils";
import { AppContext } from '../../../App';

type QuillDefaults = {
    useLarge: boolean;
    /** If true, the user can click outside of the modal to close it, triggering a "cancel". Defaults to true. */
    outsideClicking: boolean;
    /** If true, the promise will only ever resolve, but will return [false, ...] if canceled. If false, it will reject the promise when canceled. Defaults to true. */
    alwaysConfirm: boolean;

    to: string;
    cc: string;
    bcc: string;
    validation: ({ to, cc, bcc, subject, body }) => boolean;
}

const getDefaults = (): QuillDefaults => ({
    useLarge: true,
    outsideClicking: true,
    alwaysConfirm: true,
    to: '',
    cc: '',
    bcc: '',
    validation: ({ to, cc, bcc, subject, body }) => {
        return true;
    },
});

const defaults = getDefaults();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let openInternal = (message: string, opts?: Partial<QuillDefaults>): Promise<[canceled: boolean, result: string]> => {
    //ToastUtils.showDevError('Input Modal not initialized.');
    return Promise.reject('Modal not initialized.');
}

// Sketchy, but there should only ever be one instance of this object in the tree and shouldn't have any conflicts.
/** Open modal with input field. This will return a promise that will resolve with the resulting input or be rejected. */
export const openQuillAsync = (message: string, opts?: Partial<QuillDefaults>) => openInternal(message, opts);

function QuillModal() {
    const {dbConfig,userEmail} = useContext(AppContext)
    const [show, setShow] = useState(false);
    const [message, setMessage] = useState('');
    const [inputValue, setInputValue] = useState('');
    const [emailType,setEmailType]= useState("")

    const [useLarge, setUseLarge] = useState(defaults.useLarge);
    const [hideSubject, setHideSubject] = useState();
    const [validation, setValidation] = useState(() => defaults.validation);
    const [outsideClicking, setOutsideClicking] = useState(defaults.outsideClicking);

    // QUILL
    const theme = 'snow';
    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['link'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        ]
    }
    const placeholder = 'Write your email body here...';
    // need to register formats
    const formats = ['bold', 'italic', 'underline', 'strike','link','list'];
    const { quill, quillRef } = useQuill({ theme, modules, formats, placeholder });

    // useMemo(() => {
    //     if (quill) {
    //         quill.clipboard.dangerouslyPasteHTML(dbConfig.emailTemplates.filter(row => row.emailType==emailType).emailBody);
    //         console.log(quill, quillRef);
    //     }

    // }, [emailType])

    // Promise to resolve with?
    const resultRef = useRef<string | null>(null);
    const cancelRef = useRef<boolean>(false);
    const promiseRef = useRef<{ resolve: (value: [canceled: boolean, result: string]) => void, reject: (reason?: any) => void }>(null);

    openInternal = (message: string, opts?: Partial<QuillDefaults>) => {
        if (!message) {
            return Promise.reject('"message" argument is required.');
        }

        const options = opts ? Object.assign({}, defaults, opts) : defaults;
        setMessage(message);
        setOutsideClicking(options.outsideClicking);
        setUseLarge(options.useLarge);
        setValidation(options.validation);

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
        resultRef.current = inputValue;
        // if(!validation({ to, body })) {
        //     return;
        // }
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
            promiseRef.current.resolve([cancelRef.current, null]);
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

    const onEmailTypeChange = ({ target: { value } }) => {
        setEmailType(value)
        console.log(value)
        if (quill) {
            quill.clipboard.dangerouslyPasteHTML(dbConfig.emailTemplates.filter(row => row.emailType==value)[0].emailBody);
        }
    }

    return (
        <Modal show={show} onHide={onTryHide} onExited={onExited} size={useLarge ? 'lg' : 'sm'} backdrop="static">
            <Modal.Header closeButton>
                {/* <Button onClick={() => onCancel(true)} aria-label="Close">&times;</Button> */}
                {/* <Modal.Title>Confirm</Modal.Title> */}
            </Modal.Header>
            <Modal.Body>
                <span>{message}</span>
                <Form.Select aria-label="Select An Email Type" onChange={onEmailTypeChange} defaultValue="selectEmailType">
                    <option disabled value="selectEmailType">Email Type</option>
                    {
                        dbConfig.emailTemplates?.map(row => <option value={row.emailType}>{row.emailType}</option>)
                    }
                </Form.Select>
                <hr />
                <Col size='12' className="text-center">
                    <InputGroup className="mb-3">
                        <InputGroup.Text id="basic-addon1">To</InputGroup.Text>
                        <Form.Control
                            id="toEmail"
                            placeholder="toEmail"
                            aria-label="toEmail"
                            aria-describedby="toEmail"
                        />
                    </InputGroup>
                    <InputGroup className="mb-3">
                        <InputGroup.Text id="basic-addon1">CC</InputGroup.Text>
                        <Form.Control
                            id="ccEmail"
                            placeholder="ccEmail"
                            aria-label="ccEmail"
                            aria-describedby="ccEmail"
                        />
                    </InputGroup>
                    <InputGroup className="mb-3">
                        <InputGroup.Text id="basic-addon1">Subject</InputGroup.Text>
                        <Form.Control
                            id="emailSubject"
                            placeholder="emailSubject"
                            aria-label="emailSubject"
                            aria-describedby="emailSubject"
                        />
                    </InputGroup>
                    <div ref={quillRef} />
                </Col>

            </Modal.Body>
            <Modal.Footer>
                <Button variant="warning" onClick={onCancel}>
                    Cancel
                </Button>
                <Button variant="success" onClick={onConfirm}>
                    Send Email
                </Button>
            </Modal.Footer>
        </Modal>)
}

export default QuillModal;