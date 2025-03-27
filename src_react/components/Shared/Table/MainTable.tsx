import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AppContext } from '../../../App';
import { filterFunctions } from '../../Utils/filterFunctions';
import DataExport from './DataExport';
import {Table as BTable,Popover,Form,Card,Col,Row,Carousel,Button,FloatingLabel,OverlayTrigger,Tooltip,Dropdown,Accordion} from 'react-bootstrap';
import TablePagination from './TablePagination';
import {flexRender,getCoreRowModel,getFilteredRowModel,getFacetedRowModel,getFacetedUniqueValues,getSortedRowModel,getPaginationRowModel,useReactTable,} from '@tanstack/react-table';
import { DebouncedInput, useSkipper,Filter } from '../../Utils/TanstackUtils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {faArrowUpRightFromSquare,faFilterCircleXmark,faEye,faCircleInfo} from '@fortawesome/free-solid-svg-icons';
import BarChart from '../../Charts/BarChart';
import { createDynamicColumns, createActionColumns, createBadgeColumns,getFolderLink,getVisibleTableData,processChartData} from '../../Utils/tableUtils';

const MainTable = ({ tableName, inputData, chartElements = [] }) => {
  const { dbConfig, isLoaded } = useContext(AppContext);
  const [currentRow, setCurrentRow] = useState(-1);
  const [currentMember, setCurrentMember] = useState({});
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnVisibility, setColumnVisibility] = useState({ search: false });
  const [columnFilters, setColumnFilters] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 100,
  });
  const [reportIdx, setReportIdx] = useState(-1);
  const [autoResetPageIndex, skipAutoResetPageIndex] = useSkipper();

  useEffect(() => {
    if (dbConfig.columnSorting && dbConfig.columnSorting[tableName]) {
      setSorting(dbConfig.columnSorting[tableName]);
    }
  }, [dbConfig, tableName]);

  // Row selection for details view
  useEffect(() => {
    if (inputData.length <= 0 || currentRow < 0) {
      setCarouselIndex(0);
      return;
    }
    setCurrentMember(inputData[currentRow]);
    setCarouselIndex(1);
  }, [currentRow, inputData]);

  // Initialize column filters from config
  useEffect(() => {
    if (dbConfig.initialColumnFilters) {
      const validFilters = dbConfig.initialColumnFilters.filter(
        filter => filter && filter.id && filter.id !== 'undefined'
      );
      setColumnFilters(validFilters);
    }
  }, [dbConfig.initialColumnFilters]);
  
  
  // Create table columns
  const columns = useMemo(() => {
    const mapping = dbConfig.filterMappings;
    const dynamicCols = createDynamicColumns(dbConfig, tableName, mapping, isLoaded);
    const actionCols = createActionColumns(
      dbConfig, 
      tableName, 
      (id) => getFolderLink(id, inputData), 
      handleActionSelect
    );
    const badgeCols = createBadgeColumns(dbConfig, tableName, mapping);
    return [...actionCols, ...badgeCols, ...dynamicCols];
  }, [dbConfig, isLoaded, tableName, inputData]);
  
  // Initialize React Table
  const table = useReactTable({
    data: inputData,
    columns,
    state: {
      columnVisibility,
      globalFilter,
      columnFilters,
      sorting,
      pagination,
    },
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    filterFns: { ...filterFunctions },
    globalFilterFn: (row, columnId, filterValue) => {
      if (!row.original.search) return false;
      try {
        const regex = new RegExp("(?=.*" + filterValue + ").*", "i");
        return regex.test(row.original.search);
      } catch (e) {
        console.error("Error in global filter:", e);
        return false;
      }
    },
    autoResetPageIndex,
    debugTable: false,
    debugHeaders: false,
    debugColumns: false,
  });
  
  // Table data for charts
  const tblData = useMemo(() => table.getFilteredRowModel().rows, [table.getFilteredRowModel().rows]);
  
  
  // Clear all filters
  const clearAllFilters = () => {
    setColumnFilters([]);
    setGlobalFilter('');
  };
  
  // Row selection handlers
  const handleSelect = (action) => {
    if (action === "mainTable") {
      setCurrentRow(-1);
      setCarouselIndex(0);
    }
  };

  // Action selection handler
  function handleActionSelect(action, rowIndex) {
    if (action === "details") {
      setCurrentRow(rowIndex);
      setCarouselIndex(1);
    }
  }
  
  // Render the metrics panel
  const renderMetricsPanel = () => {
    if (!chartElements || chartElements.length === 0) {
      return null;
    }
    
    return (
      <Accordion>
        <Accordion.Item eventKey="0">
          <Accordion.Header>Metrics</Accordion.Header>
          <Accordion.Body>
            <Row>
              <Col lg={2}>
                <Form.Select
                  aria-label="Show Report"
                  title="Show Report"
                  value={reportIdx}
                  onChange={e => setReportIdx(parseInt(e.target.value))}
                >
                  <option value={-1}>Select A Report</option>
                  {chartElements?.map((x, idx) => (
                    <option key={idx} value={idx}>{x.chartName}</option>
                  ))}
                </Form.Select>
              </Col>
              <Col xs={12}>
                <Card style={{ padding: '16px', height: '500px' }}>
                  {reportIdx > -1 && BarChart(
                    processChartData(tblData, chartElements[reportIdx]?.colName, chartElements[reportIdx]?.stackedName),
                    chartElements[reportIdx]?.chartName,
                    !!chartElements[reportIdx]?.stackedName
                  )}
                </Card>
              </Col>
            </Row>
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    );
  };
  
  // Render action buttons
  const renderActionButtons = () => {
    return (
      <div className="flexVar">
        {dbConfig.actionButtons && dbConfig.actionButtons.map(button => {
          switch (button.type) {
            case "info":
              return (
                <OverlayTrigger
                  key={button.id}
                  overlay={
                    <Popover id="popover-basic" style={{ width: "1200px" }}>
                      <Popover.Header as="h3">{button.popoverHeader}</Popover.Header>
                      <Popover.Body>
                        <ul>
                          {(dbConfig[button.popoverBody] || []).map((row, index) => (
                            <li key={index}>{row}</li>
                          ))}
                        </ul>
                      </Popover.Body>
                    </Popover>
                  }
                  placement={button.placement}
                >
                  <Button
                    type="button"
                    className="iconBtns gsaBlue"
                    variant={button.variant}
                    aria-label={button.tooltip || 'Info'}
                  >
                    <FontAwesomeIcon icon={faCircleInfo} />
                  </Button>
                </OverlayTrigger>
              );
            case "export":
              return (
                button.enabled && (
                  <DataExport
                    key={button.id}
                    excludedColumns={dbConfig.excludedColumns}
                    tableName={tableName}
                    type={button.dataExportType}
                    data={getVisibleTableData(table)}
                    fileName={`${tableName} ${new Date().toLocaleDateString("en-US", { timeZone: "America/New_York" })} ${new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York" })}`}
                  />
                )
              );
            case "link":
              return (
                dbConfig[button.url] !== "" && (
                  <OverlayTrigger key={button.id} overlay={<Tooltip>{button.tooltip}</Tooltip>} placement="top">
                    <Button
                      type="button"
                      className="iconBtns gsaBlue"
                      variant={button.variant}
                      href={dbConfig[button.url]}
                      target={button.target}
                    >
                      <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
                    </Button>
                  </OverlayTrigger>
                )
              );
            case "clear":
              return (
                <OverlayTrigger key={button.id} overlay={<Tooltip>{button.tooltip}</Tooltip>} placement="top">
                  <Button
                    type="button"
                    className="iconBtns gsaBlue"
                    variant="outline-primary"
                    onClick={clearAllFilters}
                  >
                    <FontAwesomeIcon icon={faFilterCircleXmark} />
                  </Button>
                </OverlayTrigger>
              );
            case "dropdown":
              return (
                <Dropdown key={button.id}>
                  <Dropdown.Toggle variant={button.variant} className="iconBtns gsaBlue">
                    <FontAwesomeIcon icon={faEye} />&ensp;Columns
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {table.getAllLeafColumns().map(column => (
                      !dbConfig.excludedColumns.includes(column.id) && (
                        <div key={column.id} className="px-1">
                          <label>
                            <input
                              type="checkbox"
                              checked={column.getIsVisible()}
                              onChange={column.getToggleVisibilityHandler()}
                            />{' '}
                            {column.columnDef.header}
                          </label>
                        </div>
                      )
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              );
            default:
              return null;
          }
        })}
      </div>
    );
  };
  
  // Render the table header with search
  const renderTableHeader = () => {
    return (
      <div className="wrapper">
        <div>
          <div className="flexVar">
            {renderActionButtons()}
            <FloatingLabel label="Search Database">
              <DebouncedInput
                value={globalFilter || ''}
                onChange={value => setGlobalFilter(String(value))}
                placeholder="Search"
              />
            </FloatingLabel>
          </div>
          <TablePagination table={table} />
        </div>
      </div>
    );
  };
  
  // Render the table body
  const renderTableBody = () => {
    return (
      <div style={{ overflowX: 'scroll', height: '700px' }}>
        <BTable style={{ tableLayout: 'fixed', borderStyle: 'solid' }}>
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className='text-center'
                    style={{ width: `${header.getSize()}px` }}
                  >
                    {!header.isPlaceholder && (
                      <>
                        <div
                          className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getCanSort() &&
                            ({ asc: ' 🔼', desc: ' 🔽' }[header.column.getIsSorted()] ?? " ↕️")
                          }
                        </div>
                        {header.column.getCanFilter() && (
                          <div>
                            <Filter column={header.column} />
                          </div>
                        )}
                      </>
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map(row => (
              <tr key={row.id}>
                {row.getVisibleCells().map(cell => (
                  <td
                    key={cell.id}
                    className='text-center'
                    style={{ width: `${cell.column.getSize()}px` }}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </BTable>
      </div>
    );
  };
  
  
  if (!isLoaded) return <></>;

  return (
    <>
      <Carousel
        activeIndex={carouselIndex}
        onSelect={setCarouselIndex}
        controls={false}
        indicators={false}
        interval={null}
      >
        <Carousel.Item>
          {/* Metrics Panel */}
          {renderMetricsPanel()}

          {/* Table Header with Search and Actions */}
          {renderTableHeader()}

          {/* Table Body */}
          {renderTableBody()}
        </Carousel.Item>
        
        <Carousel.Item>
          {/* Detail view */}
        </Carousel.Item>
      </Carousel>
    </>
  );
};

export default MainTable;