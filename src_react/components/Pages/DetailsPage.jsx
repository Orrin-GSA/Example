import { Button} from 'react-bootstrap';
import { useEffect, useMemo, useState, useContext } from 'react';

import ApiDataService from '../utils/ApiDataService';
import DetailsTabs from './DetailsTabs';

import { React, useEffect, useMemo, useState, useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBackward, faArrowUpRightFromSquare} from '@fortawesome/free-solid-svg-icons'
import { AutomationsContext } from '../App';
import DetailsTabs from './DetailsTabs'
import { openQuillAsync } from './QuillModal';
import { toast } from 'react-toastify';

import AddNotes from './AddNotes';
import CancelTransaction from './CancelTransaction';
import ApproveTransaction from './ApproveTransaction';
import SubmitHelpTicket from './SubmitHelpTicket';
import ActionMenuStatus from './ActionMenuStatus';
import helpTicketDisplayCard from './HelpTicketDisplayCard';
import DetailsPageModal from './DetailsPageModal';

const logTableHeaders = ["Date", "User", "Action"];

const DetailsPage = ({ currentMember, memberLogs, memberTickets, handleSelect }) => {
    const { userEmail, refreshData, dbConfig, isLoaded,userAccess } = useContext(AutomationsContext)
    const [show, setShow] = useState(false);
    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);
    const [modalType, setModalType] = useState("");
    const [modalAction, setModalAction] = useState("")
    const [editMode, setEditMode] = useState(false)
    const todayDate = new Date().toLocaleDateString('en-US', {timeZone: 'America/New_York'})
    const openTicketCount = memberTickets.filter(row=>row.status=="Open").length
    const [validated, setValidated] = useState(false);
    const [isSubmitting,setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState({});
    const [formData, setFormData] = useState({
        notes: '',
        ticketDesc: '',
        cancel:'',
        verification:false,
        getHelp:'',
        checkbox:false
      });
    const initialData = {
        notes: '',
        ticketDesc: '',
        cancel:'',
        verification:false,
        getHelp:'',
        checkbox:false
      }
    
    // handle change for inputs within action menu
    const handleChange = (e) => {
        // for checkboxes
        if(["checkbox"].includes(e.target.name)){
            setFormData((prevFormData)=>{
                return {
                ...prevFormData,
                [e.target.name]:e.target.checked,
                }
            });
        }
        // for inputs
        else{
            setFormData((prevFormData)=>{
                return {
                ...prevFormData,
                [e.target.name]:e.target.value,
                }
            });
        }
    };

    // function for modal action change
    const onActionChange = ({ target: { value } }) => {
        console.log(`value: ${value}`);
        setModalAction(value);
    };


    const actionOptions = useMemo( () =>{
        const defaultActionOptions = [{value:"notes",label:"Add Working Notes"},{value:"getHelp",label:"Request Admin Help"}]
        // add code here to include action display logic
        return defaultActionOptions
    },[currentMember])
    
    const actionPanel = useMemo(() => {

        switch (modalAction) {
            case "notes":
                return AddNotes(validated,submitUpdates,todayDate,userEmail,handleChange,errors,formData,isSubmitting)
                break;
            case "resolve":
                return (
                    memberTickets &&
                    <>
                    <div style={{"max-height":"500px","overflow-y":"scroll"}}>
                            {
                            memberTickets.map((ticket,idx) =>{
                                return helpTicketDisplayCard(ticket,"admin",submitUpdates,validated,isSubmitting,errors,formData,handleChange)
                            })
                            }
                        </div>
                    </>
                )
                break;
            case "email":
                openQuillAsync("Select Email Type to Edit:", { validation: ({ body }) => body != '' })
                    .then(([canceled, result]) => {
                        setShow(true);
                    });
                setShow(false);
                return (
                    <></>
                )
                break;
            case "cancel":
                return CancelTransaction(validated,submitUpdates,todayDate,userEmail,handleChange,errors,formData,isSubmitting)
                break;
            case "verification":
                return ApproveTransaction(validated,submitUpdates,handleChange,todayDate,errors,formData,isSubmitting)
            case "getHelp":
                return (
                    <>  <div class="flexVar">
                            <div style={{"max-height":"500px","width":"40%","overflow-y":"scroll"}}>
                                {
                                memberTickets.map(ticket =>{
                                    return helpTicketDisplayCard(ticket,"",submitUpdates,validated,isSubmitting,errors,formData,handleChange)
                                })
                                }
                            </div>
                            
                            {SubmitHelpTicket(validated,submitUpdates,userEmail,handleChange,errors,formData,isSubmitting,currentMember)}
                        </div>
                    </>
                )
            default:
                return (<></>)

        }
    }, [modalAction,formData,errors,isSubmitting])

    const actionMenuStatus = useMemo(() => {
        return ActionMenuStatus(dbConfig,currentMember,openTicketCount) 
    }, [currentMember])

    let displayLogs = memberLogs.slice(0, 3);


    async function submitUpdates(event,idx) {
        
        setIsSubmitting(true)
        event.preventDefault();
        event.stopPropagation();
        console.log(idx)
        console.log("Inside submit updates")
        let allErrors = {};
        console.log(formData)
        switch(modalAction){
            case "notes":
                if(formData.notes=="") allErrors.notes=true;
            break;
            case "cancel":
                if(formData.cancel=="") allErrors.cancel=true;
            break;
            case "verification":
                if(!formData.verification) allErrors.verification=true;
            break;
            case "resolve":
                if(!formData["resolve"+idx]) {
                    allErrors["resolve"+idx]=true;}
            break;
            case "getHelp":
                if(formData.getHelp=="") allErrors.getHelp=true;
            break;

        }
        setErrors(allErrors);
        if(Object.keys(allErrors).length!=0){
            setValidated(false); 
           setIsSubmitting(false)
            return;
        }
        else setValidated(true);


        // setIsLoading(true)
        var jObj = {...formData,"submitterEmail":userEmail,"ID":currentMember.transactionID,"action":modalAction};
        console.log(JSON.stringify(jObj))
        const response = await ApiDataService.submitUpdates(jObj);
        console.log("response:", response);
        setIsSubmitting(false)
        if (response) {
            // await pause(5000)
            console.log("successful update")
            toast.success('Successful update',{
                position:'bottom-right',
                autoClose:5000
            })
            setFormData(initialData)
            await refreshData();
            handleClose()
        }
        else {
            toast.error("There was an error submitting updates. Please try again later, or contact the administrators if this error persists.", {
                position: 'bottom-right',
                autoClose:15000
                
            });
        }
        
        // setIsLoading(false)

    }
    function pause(milliseconds) {
        return new Promise(resolve => setTimeout(resolve, milliseconds));
      }
    if (isLoaded) {
        return (
            <>
                <div className="flex reviewPageTitle">
                    <span className="sectionTitle">{currentMember["leaseNumber"]}</span>
                    {
                        editMode == false &&
                        <Button type="button" style={{"background-color":"#003c71"}} onClick={() => { handleSelect("mainTable") }}><FontAwesomeIcon icon={faBackward} />&emsp;Main Table</Button>
                    }
                </div>
                <div id="review_div" className="flexVar">
                    <div role="region" aria-label="Submission Details" id="summary_div">
                        <DetailsTabs metadata={dbConfig} row={currentMember} defaultActiveKey={dbConfig.defaultActiveKey}/>
                    </div>
                    <div id="action_div" className="flexcolStartVar">
                        <div id="takeAction" >
                            {
                                !["Completed","Cancelled"].includes(currentMember.status) &&
                                <Button type="button" id="actionBtn" className="top-icon" style={{"background-color":"#003c71"}} onClick={() => { setModalType("Action"); handleShow(); }}>Action Menu <FontAwesomeIcon icon={faArrowUpRightFromSquare} /></Button>
                            
                            }
                            <div id="reviewBreakdown" className="flexColEven" >
                                {actionMenuStatus}
                            </div>
                        </div>
                        <div id="viewHistory">
                            <Button type="button" id="historyBtn" className="top-icon" style={{"background-color":"#003c71"}} onClick={() => { setModalType("History"); handleShow(); }}>History Log <FontAwesomeIcon icon={faArrowUpRightFromSquare} /></Button>
                            <div id="historyText">
                                {displayLogs.map((val) => (
                                    <p>{val["Date"] + " " + val["User"]+": " +val["Action"]}</p>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                {DetailsPageModal(handleClose,setModalAction,onActionChange,actionOptions,actionPanel,logTableHeaders,memberLogs,show,modalType) }
            </>

        )
    }
}

export default DetailsPage;