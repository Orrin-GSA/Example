import Badge from 'react-bootstrap/Badge';
import { Stepper } from 'react-form-stepper';
import { React } from 'react';

const ActionMenuStatus = (dbConfig,currentMember,openTicketCount) =>{
    if(dbConfig.statusStepperBoolean=="true"){
        return (
            <>
            <p>Submission Date: {currentMember.date}</p>
            {
                ["Cancelled","Voided"].includes(currentMember.status) ? 
                <p>Status: {currentMember.status}</p>
            :
                <Stepper steps={[
                { label: 'LMT Info Needed' + (currentMember.infoNeededEmailDate && '\n' + currentMember.infoNeededEmailDate.split(",")[0].split(" ")[0]) },
                { label: 'Approval Needed' + (currentMember.approvalEmailDate && '\n' + currentMember.approvalEmailDate.split(",")[0].split(" ")[0])},
                { label: 'Awaiting Bot' }, 
                { label: 'Docusign Sent' + (currentMember.docusignSent && '\n' + currentMember.docusignSent.split(" ")[0])},
                { label: 'Completed' + (currentMember.docusignCompleted && '\n' + currentMember.docusignCompleted.split(" ")[0])}
                ]} 
                activeStep={parseInt(dbConfig[currentMember.status])} />
            }
            {
                !["Completed","Cancelled","Voided"].includes(currentMember.status) &&
                <p>Open Tickets: {openTicketCount}</p>
            }
            </>
        )
    }
    else{
        // get status color
        var statusProp = dbConfig.statuses.filter(row => row.label == currentMember.status)[0]
        if(statusProp){
            return (
            <div className="px-1" style={{"margin-top":"40px"}}>
                <Badge bg={statusProp.type}>{currentMember.status}</Badge>
            </div>);
        }
    }
}

export default ActionMenuStatus