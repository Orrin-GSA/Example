// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useId } from "react";
import { Tooltip, OverlayTrigger, Button } from "react-bootstrap";
import * as Icon from 'react-bootstrap-icons';
import { Placement } from "react-bootstrap/esm/types";

type Args = {
    /** Body of tooltip. */
    title: string;
    /** Placement of tooltip, defaults to top.  */
    placement?: Placement;
    onClick?: () => void;
}

/**
 * Renders an info icon with a tooltip on hover.
 */
function InfoOverlay({ title, placement, onClick }: Args) {
    const id = useId();
    return <OverlayTrigger placement={placement ?? 'top'} overlay={<Tooltip id={id}>{title}</Tooltip>}>
      <Button variant="link" href="#" onClick={onClick} className="pt-0 px-1"><Icon.InfoCircle /></Button>
    </OverlayTrigger>;
};

export default InfoOverlay;