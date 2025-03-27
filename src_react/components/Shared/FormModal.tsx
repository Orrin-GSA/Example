import React, { useMemo, useRef, useState } from "react";
import { Button, Col, Form, InputGroup, Modal, Row } from "react-bootstrap";
import { is, to } from "../../../src_shared/TypeUtils";
import ToastUtils from "../util/ToastUtils";
import MultiSelectString from "./MultiSelectString";
import { Option } from "react-multi-select-component";
import { dateToDatePickerFormat, toIsoDateStr } from "../util/DataUtil";

type Only<T, U> = T & Partial<Record<Exclude<keyof U, keyof T>, never>>
  
type Either<T, U> = Only<T, U> | Only<U, T>;

type FormSettings = {
    title?: string;
    useLarge?: boolean;
    alwaysConfirm?: boolean;
    /** If false will prevent from mouse clicks outside modal from closing. Defaults true. */
    outsideClicking?: boolean;
}

export type FormOptions<T> = {
    settings?: Partial<FormSettings>;
    rows: FormRowOptionsAny<T>[];
}

type FormRowRequirements = {
    minDate?: string;
    maxDate?: string;
    // All fields must be optional, add as many as you need.
};

// This type allows us to say "type" or "template" is required, but not both. In the type definitions for each type, all fields must be present, but fields that are to be excluded from one should be optional, with a type of "never".
type FormRowOptionsAny<T> = Either<FormRowOptions<T>, FormRowTemplateOptions<T>>;

type FormRowOptions<T> = {
    /**
     * Generates a predefined template based on the passed type and additional parameters. A type or template property is required, but not both. If template is provided type will be ignored.
     */
    type: 'text' | 'input' | 'date' | 'textarea' | 'number' | 'check' | 'select' | 'multi-select' | 'document' | 'drive';
    /**
     * The value to set based on the type used. Required when using type.
     */
    field: Extract<keyof T, string>;
    /**
     * If any value is provided for required, it flags this field as required and will be checked during validation.
     * 
     * If required is true, it will do a simple not-null, not empty string check on this field.
     * 
     * If required is a FormRowRequirements object, it will validate based on special rules based on the type field. This is ignored if a template is passed. 
     *
     * If required is a function, it will provide the value of the field to the function and expect a result string. Then, if the result is a non-empty string, it will cause a validation error to popup and provide the resulting string as an error message.
     */
    required?: true | FormRowRequirements | ((fieldValue: any) => string);
    /** Placeholder to show in empty input field. Not used by all types. */
    placeholder?: string;
    title?: string;
    /**
     * The list of options that can be selected. Required if type is 'select' or 'multi-select'.
     */
    options?: (Option | string)[];
    /**
     * Should hide the default caption or should show a custom caption.
     */
    optionsCaption?: false | string;
    /**
     * Property of array element to use as the link. Required for type of 'document'.
     */
    linkId?: string;
}

type FormRowTemplateOptions<T> = {
    /**
     * A react template passed directly. This property will override 'type' is also passed. Note, this will be wrapped in a FormGroup, but it won't include a Form.Label.
     */
    template: (formData: T, setFieldData: (field: string, value: any) => void, controlId: string) => React.JSX.Element;
    required?: true | ((fieldValue: any) => string | '');
}

type FormRowType<T> = {
    html: React.JSX.Element;
    options: FormRowOptionsAny<T>;
    controlId: string;
    isTemplate: boolean;
}

const typeTemplates = {
    // use "text" is if there is data the user may need to reference while working on the form, but would have to leave the form to see. 
    'text': <T,>(formData: T, row: FormRowOptions<any>) => <Form.Control plaintext readOnly defaultValue={formData[row.field] ?? ''} />,
    // generic input field.
    'input': <T,>(formData: T, row: FormRowOptions<any>, setFieldData: (field: string, value: any) => void) => <Form.Control placeholder={row.placeholder || ''} value={formData[row.field] ?? ''} onChange={(e) => setFieldData(row.field, e.target.value)} />,
    // uses "date" input type, ensures the value takes and returns a date.
    'date': <T,>(formData: T, row: FormRowOptions<any>, setFieldData: (field: string, value: any) => void) => <Form.Control type="date" placeholder={row.placeholder || ''} value={dateToDatePickerFormat(formData[row.field] ?? '')} onChange={(e) => setFieldData(row.field, toIsoDateStr(e.target.value))} />,
    // Expandable text area
    'textarea': <T,>(formData: T, row: FormRowOptions<any>, setFieldData: (field: string, value: any) => void) => <Form.Control as={'textarea'} rows={3} placeholder={row.placeholder || ''} value={formData[row.field] ?? ''} onChange={(e) => setFieldData(row.field, e.target.value)}  />,
    // uses "number" input type, blocks non-numeric values.
    'number': <T,>(formData: T, row: FormRowOptions<any>, setFieldData: (field: string, value: any) => void) => <Form.Control type="number" placeholder={row.placeholder || ''} value={formData[row.field] ?? ''} onChange={(e) => setFieldData(row.field, to.float(e.target.value) || 0)}  />,
    // Single select dropdown.
    'select': <T,>(formData: T, row: FormRowOptions<any>, setFieldData: (field: string, value: any) => void) => {
        if (!row.options) {
            throw new Error("column.options is required on a 'select' column in Form Modal.");
        }

        let caption = `Select an Option...`;
        if (row.optionsCaption === false) { // Do not use `!column.optionsCaption`, we specifically want false
            caption = '';
        }
        else if (row.optionsCaption) {
            caption = row.optionsCaption;
        }

        const title = row.title ?? row.field;
        const option = row.options as Option[];
        return <Form.Select
            value={formData[row.field] || ''}
            title={title}
            onChange={(e) => setFieldData(row.field, e.target.value)}>
                {caption && <option value=''>{caption}</option>}
                {option.map(opt => {
                    return <option key={opt.value} value={opt.value}>{opt.label}</option>
                })};
        </Form.Select>
    },
    // Multi select dropdown using our custom MultiSelectString wrapper.
    'multi-select':  <T,>(formData: T, row: FormRowOptions<any>, setFieldData: (field: string, value: any) => void, controlId: string) => {
        if (!row.options) {
            throw new Error("column.options is required on a 'select' column in Form Modal.");
        }

        let caption = `Select an Option...`;
        if (row.optionsCaption === false) { // Do not use `!column.optionsCaption`, we specifically want false
            caption = '';
        }
        else if (row.optionsCaption) {
            caption = row.optionsCaption;
        }

        // casting "as Option[]" because the openInternal method converts any strings to Option objects, so this can be treated as Option only.
        const option = row.options as Option[];
        return <MultiSelectString
                    options={option}
                    value={formData[row.field] ?? ''}
                    onChange={value => setFieldData(row.field, value)}
                    valueRenderer={(selected, _options) => selected.length > 0 ? selected.map(x => x.label).join(', ') : caption }
                    labelledBy={controlId}
                    hasSelectAll={false} />
    },
    // Simple checkbox.
    'check': <T,>(formData: T, row: FormRowOptions<any>, setFieldData: (field: string, value: any) => void) => {
        const title = row.title ?? row.field;
        if(!title){ 
            throw new Error('Title or Field is required for checkbox.')
        }

        return <Form.Check checked={formData[row.field]} label={<b>{title}{ getRequired(row) }</b>} onChange={e => setFieldData(row.field, !!e.target.checked)} />
    },
    // Link to a Google Drive Doc. Can use a form field as the ID or a link can be provided directly.
    'document': <T,>(formData: T, row: FormRowOptions<any>) => {
        if (!row.field && !row.linkId) {
            throw new Error("column.linkId or column.field is required on a 'document' column in Form Modal. Must be the Google Doc Id.");
        }

        const id = row.field ? formData[row.field] : row.linkId;
        
        return <Col>{id ? <a target="_blank" rel="noreferrer" href={`https://docs.google.com/document/d/${id}`}>Link</a> : <>N/A</>}</Col>
    },
    // Link to a Google Drive Folder. Can use a form field as the ID or a link can be provided directly.
    'drive': <T,>(formData: T, row: FormRowOptions<any>) => {
        if (!row.field && !row.linkId) {
            throw new Error("column.linkId or column.field is required on a 'drive' column in Form Modal. Must be the Google Doc Id.");
        }

        const id = row.field ? formData[row.field] : row.linkId;
        
        return <Col>{id ? <a target="_blank" rel="noreferrer" href={`https://drive.google.com/drive/folders/${id}`}>Link</a> : <>N/A</>}</Col>
    }
}

const getRequired = <T,>(row: FormRowOptions<T>) => {
    if(!row.required || row.type === 'text') {
        return <></>;
    }

    return <>&nbsp;<span title="Required" style={{ color: 'red' }}>*</span></>;
} 

const getFormRow = <T,>(row: FormRowType<T>) => {
    if(row.options.type === 'check' || row.isTemplate) {
        return row.html;
    }
    const title = row.options.title ?? row.options.field;
    
    return <>
        <Form.Label><b>{title}{ getRequired(row.options) }</b></Form.Label>
        {row.html}
    </>;
}

const getDefaults = (): FormSettings => ({
    title: '',
    useLarge: true,
    outsideClicking: true,
    alwaysConfirm: true
});

const defaults = getDefaults();

// eslint-disable-next-line @typescript-eslint/no-unused-vars
let openInternal = <T extends Record<string,any>,>(initialData: T, opts: FormOptions<T>): Promise<[canceled: boolean, result: T]> => {
    ToastUtils.showDevError('Form Modal not initialized.');
    return Promise.reject('Modal not initialized.');
}

// Sketchy, but there should only ever be one instance of this object in the tree and shouldn't have any conflicts.
/** Open modal with input field. This will return a promise that will resolve with the resulting input or be rejected. */
export const openFormAsync = <T extends Record<string, any>>(initialData: T, opts: FormOptions<T>) => openInternal<T>(initialData, opts);


function FormModal() {
    const [show, setShow] = useState(false);
    const [title, setTitle] = useState('');
    const [formData, setFormData] = useState<Record<string, any>>({});
    const setFormFieldData = (field: string, value: any) => {
        setFormData(prevData => ({ ...prevData, [field]: value }))
    }
    const [formRowData, setFormRowData] = useState<FormRowOptionsAny<any>[]>([]);

    const [useLarge, setUseLarge] = useState(defaults.useLarge);
    const [outsideClicking, setOutsideClicking] = useState(defaults.outsideClicking);

    const formRows = useMemo(() => {
        const fields: FormRowType<any>[] = [];

        for (let i = 0; i < formRowData.length; i++) {
            const formRow = formRowData[i];
            const controlId = `form-modal-${i}`;
            let template: React.JSX.Element = null;
            let isTemplate = !!formRow.template;
            if (!isTemplate && typeTemplates[formRow.type]) {
                template = typeTemplates[formRow.type](formData, formRow as FormRowOptions<any>, setFormFieldData, controlId)
            }
            else if(isTemplate && formRow.template) {
                template = formRow.template(formData, setFormFieldData, controlId);
                isTemplate = true;
            }

            if (!template) {
                throw new Error('No type or template found.')
            }
            fields.push({ html: template, options: formRow, controlId, isTemplate });
        }

        return fields;
    }, [formData, formRowData]);

    // Promise to resolve with?
    const resultRef = useRef<Record<string, any> | null>(null);
    const cancelRef = useRef<boolean>(false);
    const promiseRef = useRef<{ resolve: (value: [canceled: boolean, result: any]) => void, reject: (reason?: any) => void }>(null);

    openInternal = <T extends Record<string,any>,>(initialData: T, opts: FormOptions<T>) => {
        if (!opts) {
            return Promise.reject('"opts" argument is required.');
        }

        const settings = opts.settings ? Object.assign({}, defaults, opts.settings) : defaults;

        // pre-process any string options so they are always are an object in the format of { label, value }
        for(let i = 0; i < opts.rows.length; i++) {
            const row = opts.rows[i];
            if(row.type && ['select', 'multi-select'].includes(row.type)) {
                row.options = row.options.map(x => (is.string(x) ? ({ label: x, value: x } as Option) : x));
            }
        }

        setTitle(settings.title);
        setOutsideClicking(settings.outsideClicking);
        setUseLarge(settings.useLarge);
        // Make a copy of the data object that we'll then return; we don't want to be modifying the original.
        setFormData(Object.assign({}, initialData));
        setFormRowData(opts.rows);

        // Result to provide if onConfirm is not called before closing. 
        //  null makes the promise returned rejected, false makes it resolve with the value of false.
        resultRef.current = settings.alwaysConfirm ? {} : null;
        cancelRef.current = false;
        const promise = new Promise<[canceled: boolean, result: T]>((resolve, reject) => {
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
        const errors: string[] = [];
        for (let i = 0; i < formRowData.length; i++) {
            
            const row = formRowData[i];
            if(!row.required) {
                continue;
            }

            if(is.function(row.required)) {
                const error = row.required(formData[row.field]);

                if(error){ 
                    errors.push(error);
                }

                continue;
            }
            
            // Only "type" rows can use a settings object. If it's a "template" it must pass a custom function, or true.
            if(is.object(row.required) && !row.template) {
                // TODO: Make "required"'s type be boolean or a object. The object will have custom settings for what exactly is required, IE if the row is a date, then it can have a "no earlier than X date" requirement.
            }
            else if(formData[row.field] == null || formData[row.field] === '') {
                // Quick and simple check, if all that's needed is a check for "did they give me *any* value".
                errors.push(`${row.title ?? row.field} is required.`);
            }
        }

        if(errors.length > 0) {
            ToastUtils.showValidationError(errors);
            return;
        }

        resultRef.current = Object.assign({}, formData);
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
        setFormData({});
    }

    const onTryHide = () => {
        if (!outsideClicking) {
            return;
        }
        cancelRef.current = true;
        setShow(false);
    }

    return (
        <Modal show={show} onHide={onTryHide} onExited={onExited} size={useLarge ? 'lg' : 'sm'}>
            <Modal.Header closeButton>
                {/* <Button onClick={() => onCancel(true)} aria-label="Close">&times;</Button> */}
                {title && <Modal.Title>{title}</Modal.Title>}
            </Modal.Header>
            <Modal.Body>
                {formRows.map((row, idx) => <Form.Group className="mb-3" controlId={row.controlId} key={row.options.field + idx.toString()}>
                    {getFormRow(row)}
                </Form.Group>)}
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

export default FormModal;