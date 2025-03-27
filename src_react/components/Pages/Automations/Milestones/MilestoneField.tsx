import React, { useContext, useEffect, useMemo, useState } from "react";
import { is } from "../../../../../src_shared/TypeUtils";
import { toIsoDateStr } from "../../../util/DataUtil";
import { Button, Col, Form, InputGroup } from "react-bootstrap";
import { MilestonesContext } from './AutoMilestones';
import * as Icon from 'react-bootstrap-icons';

type Props = {
    fieldName: keyof Milestone;
    type: string;
    title: string;
    size?: number;
    required?: boolean;
    placeholder?: string;
    today?: string | number;
    className?: any;
}

function openUrl(currVal?: string) {
    const lowered = currVal?.trim().toLocaleLowerCase();
    if (lowered) {
        if (is.validUrl(lowered)) {
            window.open(lowered, "_blank", "noreferrer");
        }
        else if (!lowered.startsWith('http://') && !lowered.startsWith('https://')) {
            window.open('https://' + lowered, "_blank", "noreferrer");
        }
    }
}

const todayIsoStr = () => new Date().toISOString().split('T')[0];

function MilestoneField({ fieldName, size, className, type, required, placeholder, title }: Props) {
    const { editMilestone, milestone, isDisabled, isEnh, copyFromParent, parentMilestone } = useContext<any>(MilestonesContext);

    function handleOnChange(fieldName, value) {
        editMilestone[fieldName] = value;
    }

    const mainClass = useMemo(() => {
        const isValue = false; //(currVal && currVal?.length > 0) ? true : false;
        const classPerVal = isValue ? 'milestone-notEmpty' : 'milestone-empty';
        let css = classPerVal;
        if (className) {
            css += ' ' + className;
        }
        return css;
    }, [className]);

    const canCopy = isEnh && !!parentMilestone && parentMilestone[fieldName];

    const formField = useMemo(() => {
        let currVal = editMilestone[fieldName];
        if (type == 'date' && is.validDate(currVal)) {
            currVal = toIsoDateStr(currVal);
        }

        const isValue = false; //(currVal && currVal?.length > 0) ? true : false;
        const disabled = isDisabled || isValue;

        let input = <></>;
        switch (type) {
            case 'date':
                input = <Form.Control type={type} aria-required={!!required} max={todayIsoStr()} value={currVal || ''} disabled={disabled} onChange={e => handleOnChange(fieldName, e.target.value)} />;
                break;
            case 'file':
                input = <Form.Control type={type} aria-required={!!required} disabled={disabled} />;
                break;
            case 'number':
                input = <Form.Control type={type} aria-required={!!required} disabled={disabled} value={currVal || 0} min={0} max={100} onChange={e => handleOnChange(fieldName, e.target.value)} />;
                break;
            case 'text':
                input = (<>
                    <Form.Control type={type} aria-required={!!required} placeholder={placeholder} value={currVal || ''} disabled={disabled} onChange={e => handleOnChange(fieldName, e.target.value)} />
                </>);
                break;
            case 'url':
                input = (<>
                    <Form.Control type='text' placeholder={placeholder} value={currVal || ''} aria-required={!!required} disabled={disabled} onChange={e => handleOnChange(fieldName, e.target.value)} />
                    <Button disabled={!currVal} onClick={() => openUrl(currVal)}>View</Button>
                </>);
                break;
        }

        return (<div className='milestone-group'>
            <Form.Label className='mx-2 d-flex'> {required && <p aria-hidden style={{ color: "red" }}>*</p>} {title}</Form.Label>
            <InputGroup>
                {isEnh && <Button onClick={() => copyFromParent(fieldName)} disabled={!canCopy || !parentMilestone[fieldName]} title="Copy from Parent Project"><Icon.Copy/></Button>}
                {input}
            </InputGroup>
        </div>);
    }, [editMilestone, milestone, fieldName, type, required, title, placeholder, isDisabled]);

    return (
        <Form.Group as={Col} className={mainClass} controlId={`milestones_${fieldName}Id`} xs={size ?? 6} style={{ padding: '4px' }}>
            {formField}
        </Form.Group>)
}

export default MilestoneField;