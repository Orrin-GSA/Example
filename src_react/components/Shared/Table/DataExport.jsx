// // source: https://medium.com/@aalam-info-solutions-llp/how-to-excel-export-in-react-js-481b15b961e3


import { read, utils, writeFileXLSX } from 'xlsx';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faFileExcel} from '@fortawesome/free-solid-svg-icons'
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import ApiDataService from '../../Utils/ApiDataService';
import {useContext } from 'react';
import { AppContext } from '../../../App';
import { ToastContainer, toast } from 'react-toastify';

// remove excluded columns from data export
const filterData = (excludedColumns,data) =>{
    let filteredData = []
    data.forEach((row,idx) =>{
        filteredData[idx] = {}
        Object.keys(row).forEach(key =>{
            if (!excludedColumns.includes(key)){
                filteredData[idx][key]=row[key]
            }
        })
    })
    return filteredData
}

const DataExport=({excludedColumns,tableName,data,fileName,type}) =>{
    const { userEmail} = useContext(AppContext)

    // export data to excel option
    const exportToExcel = async () =>{
        try {
            const newArray = filterData(excludedColumns,data)
            console.log(newArray)
            const ws = utils.json_to_sheet(newArray);
            const wb = utils.book_new();
            utils.book_append_sheet(wb, ws, "Data");
            writeFileXLSX(wb, fileName+".xlsx");
        }
        catch(e){
            toast.error("There was an error exporting data. Please try again later, or contact the administrators if this error persists.", {
                position: 'bottom-right',
                autoClose:15000
                
            });
        }
    }

    // export data to google sheet option
    const exportToGSheet = async () =>{
        toast.info('Creating data export...',{
            toastId:"dataExportToast",
            position:'bottom-right'
        })
        const newArray = filterData(excludedColumns,data);
        const response = await ApiDataService.exportData(newArray,userEmail,tableName);

        console.log("response:", response);
        if (response) {
            toast.dismiss("dataExportToast")
            console.log("successful update")
            const gsheetID = response.msg.id
            window.open("https://docs.google.com/spreadsheets/d/"+gsheetID, '_blank');
        }
        else {
            toast.error("There was an error exporting data. Please try again later, or contact the administrators if this error persists.", {
                position: 'bottom-right',
                autoClose:15000
                
            });
        }

    }

    switch(type){
        case "excel":
            return (
                <OverlayTrigger overlay={<Tooltip >Export visible data to excel</Tooltip>}>
                    <Button type="button" variant='outline-primary' className="iconBtns" onClick={(e)=>exportToExcel(fileName)}><FontAwesomeIcon icon={faFileExcel} size='xl'/></Button>
                </OverlayTrigger>
            )
        case "gsheet":
            return (
                <OverlayTrigger overlay={<Tooltip >Export visible data to google sheet</Tooltip>}>
                    <Button type="button" variant='outline-primary' className="iconBtns" onClick={(e)=>exportToGSheet(fileName)}><FontAwesomeIcon icon={faFileExcel} size='xl'/></Button>
                </OverlayTrigger>
            )
    }
}

export default DataExport;
