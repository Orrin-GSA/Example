import React, { useState, useEffect, useContext, useMemo } from 'react';
import Button from 'react-bootstrap/Button';
import {Table as BTable, OverlayTrigger, Popover} from 'react-bootstrap';
import Tabs from 'react-bootstrap/Tabs';
import Modal from 'react-bootstrap/Modal';
import Tab from 'react-bootstrap/Tab';
import { AppContext } from '../../../App';
import { DebouncedInput, useSkipper } from '../../Utils/TanstackUtils';
import {
    Column,
    ColumnDef,
    ColumnFiltersState,
    RowData,
    SortingFn,
    SortingState,
    flexRender,
    getCoreRowModel,
    useReactTable,
    createColumnHelper,
    getFacetedMinMaxValues,
    getFacetedRowModel,
    getFacetedUniqueValues,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    ColumnSort,
    ColumnFilter,
    VisibilityState,
    Row
} from '@tanstack/react-table';

import { is } from '../../../../src_shared/TypeUtils';

// a shell function before the actual function is defined
let openInternal = (id) => {

}

// a pointer to open the modal
export const openProjectTreeModal = (id) => openInternal(id);


function ProjectTreeModal() {
    const [show, setShow] = useState(false);
    const handleClose = 
    () => setShow(false);
    const handleShow = () => setShow(true);
    const columnHelper = createColumnHelper();
    const [sorting, setSorting] = useState<ColumnSort[]>([]);
    const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();
    const [ideaID,setIDEAID]=useState("")

    // function to set ID and open modal
    openInternal = (ideaID) => {
        setIDEAID(ideaID)
        setShow(true)
    }

    // Get data and mappings from the App-level context
    const {inputData,supportTickets,userEmail,dbConfig,userAccess,isLoaded,refreshData} = useContext(AppContext);
    

    const tblProjectData = useMemo(() =>{
        let data = inputData.filter(row => row.subidea_id == ideaID)
        data.forEach(row =>{
            const liveDate = is.stringDate(row.live_date) ? new Date(row.live_date) : new Date("1/1/1900")
            const estDelivDate = is.stringDate(row.est_delivery_date) ? new Date(row.est_delivery_date) : new Date("1/1/1900")

            // get the max of estimated delivery date & live date
            row.date = new Date(Math.max(liveDate.getTime(),estDelivDate.getTime()))
            if (row.date.getTime()==(new Date("1/1/1900").getTime())) {
                row.date=""
            }
        })
        return data
    },[ideaID])
        
    const tblTicketData = useMemo(() =>{
        let data = supportTickets.filter(row => row.subidea_id == ideaID)
        data.forEach(row =>{
            row.open_date = is.stringDate(row.open_date) ? new Date(row.open_date).toLocaleDateString() : ''
        })
        return data
    },[ideaID])

    const popoverBody = (id) => {
        if (!inputData || !inputData[id] || !inputData[id].milestoneInfo) {
            return "No ticket information available";
        }
        return tblTicketData[id].description;
    }

    const columnsProjectData = useMemo(() => {
        if (!isLoaded) {
            return [];
        }
    
        const dynamicColumns = dbConfig.metadata["projectTreeInputData"]?.map(row => 
            columnHelper.accessor(tableRow => row.type == "date" ? (tableRow[row.name] ? new Date(tableRow[row.name]) : '' ) : tableRow[row.name], 
            {
                id: row.name,
                header: row.title,
                cell: ({ getValue }) => {
                    if (row.type == "date"){
                        let val = getValue();
                        return is.string(val) ? val : val.toLocaleDateString()
                    }
                
                    return (
                        <span>
                        {getValue() as React.ReactNode}
                        </span>
                    );
                },
                size: row.size,
            }
            )
        )
        
        return [
            ...dynamicColumns
        ];
    }, [dbConfig]);

    const columnsTicketData = useMemo(() => {
        if (!isLoaded) {
            return [];
        }
    
        const dynamicColumns = dbConfig.metadata["projectTreeTicketData"]?.map(row => 
            columnHelper.accessor(tableRow => row.type == "date" ? (tableRow[row.name] ? new Date(tableRow[row.name]) : '' ) : tableRow[row.name], 
            {
                id: row.name,
                header: row.title,
                cell: (cell) => {
                    const value = cell.getValue();
                    if (row.type == "date"){
                        return is.string(value) ? value : value.toLocaleDateString()
                    }
                    if (row.name=="ID"){
                        return (
                            <OverlayTrigger
                            placement='bottom'
                            overlay={<Popover id="popover-basic">
                                <Popover.Header as="h3">TIC Description</Popover.Header>
                                <Popover.Body>
                                    <div>{cell.row.original.description}</div>
                                </Popover.Body>
                            </Popover>}>
                            <Button variant="link">{value}</Button>
                            </OverlayTrigger>
                        );
                    }
                
                    return (
                        <span>
                        {cell.getValue()}
                        </span>
                    );
                },
                size: row.size,
            }
            )
        )
        
        return [
            ...dynamicColumns
        ];
    }, [dbConfig]);

    const projectTbl = useReactTable({
        data: tblProjectData,
        columns:columnsProjectData,
        state: {
            sorting: sorting
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(), //client-side filtering
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(), // client-side faceting
        getFacetedUniqueValues: getFacetedUniqueValues(), // generate unique values for select filter/autocomplete
        autoResetPageIndex,
    })

    const ticketTbl = useReactTable({
        data: tblTicketData,
        columns:columnsTicketData,
        state: {
            sorting: sorting
        },
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(), //client-side filtering
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(), // client-side faceting
        getFacetedUniqueValues: getFacetedUniqueValues(), // generate unique values for select filter/autocomplete
        autoResetPageIndex,
    })

    const tblObj = (reactTbl) => {return (
        <BTable style={{'tableLayout': 'fixed','borderStyle': 'solid'}}>
            <thead>
                {reactTbl.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id} >
                        {headerGroup.headers.map(header => (
                            <th key={header.id} className='text-center' style={{ width: `${header.getSize()}px` }}>
                                {header.isPlaceholder ? null:<>
                                    <div
                                        {...{
                                            className: header.column.getCanSort() ? 'cursor-pointer select-none': '',
                                                onClick: header.column.getToggleSortingHandler(),
                                                }}>
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
                                            {
                                                header.column.getCanSort() ? 
                                                { asc: ' 🔼',desc: ' 🔽',}[header.column.getIsSorted().toString()] ?? " ↕️" : ""
                                            }
                                            </div>
                                    </>
                                }
                            </th>
                        ))}
                    </tr>
                ))}
            </thead>
            <tbody>
                {reactTbl.getRowModel().rows.map(row => (
                    <tr key={row.id}>
                        {row.getVisibleCells().map(cell => (
                            <td key={cell.id} className='text-center' style={{ width: `${cell.column.getSize()}px` }}>
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
            </BTable>
    )}

    return (
      <>
        <Modal show={show} onHide={handleClose} centered size="xl">
            <Modal.Header closeButton>
                <Modal.Title>{ideaID}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Tabs defaultActiveKey="projects" id="uncontrolled-tab-example" className="mb-3">
                    <Tab eventKey="projects" title="Projects">
                    <div style={{'overflowX':'scroll','overflowY':'scroll','height':'600px'}}>
                        {tblObj(projectTbl)}

                    </div>
                    </Tab>
                    <Tab eventKey="tickets" title="Tickets">
                    <div style={{'overflowX':'scroll','overflowY':'scroll','height':'600px'}}>
                        {tblObj(ticketTbl)}
                    </div>
                    </Tab>

                </Tabs> 
            </Modal.Body>
            <Modal.Footer>
            </Modal.Footer>
        </Modal>
      </>
    );
}

export default ProjectTreeModal;