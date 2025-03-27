import React from 'react';
import { Button, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleLeft, faAngleRight, faTimes } from '@fortawesome/free-solid-svg-icons';

const TablePagination = ({ table }) => {
  // Available page sizes for the dropdown
  const pageSizeOptions = [10, 20, 50, 100];
  
  // Calculate current range
  const currentPageIndex = table.getState().pagination.pageIndex;
  const pageSize = table.getState().pagination.pageSize;
  const totalRows = table.getFilteredRowModel().rows.length;
  
  const startRange = currentPageIndex * pageSize + 1;
  const endRange = Math.min((currentPageIndex + 1) * pageSize, totalRows);

  return (
    <div className="table-pagination d-flex flex-wrap justify-content-between align-items-center my-2">
      {/* Left side: Page size selector */}
      <div className="d-flex align-items-center">
        <span className="me-2">Show</span>
        <Form.Select
          value={table.getState().pagination.pageSize}
          onChange={e => {
            table.setPageSize(Number(e.target.value));
          }}
          className="pagination-select"
        >
          {pageSizeOptions.map(pageSize => (
            <option key={pageSize} value={pageSize}>
              {pageSize}
            </option>
          ))}
        </Form.Select>
      </div>
      
      {/* Right side: Pagination controls */}
      <div className="d-flex align-items-center">
        <span className="pagination-text me-2">
          {startRange} - {endRange} of {totalRows}
        </span>
        
        <Button
          variant="outline-primary"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className="pagination-button"
        >
          <FontAwesomeIcon icon={faAngleLeft} />
        </Button>
        
        <Button
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className="pagination-button"
          variant="outline-primary"
        >
          <FontAwesomeIcon icon={faAngleRight} />
        </Button>
        
        <span className="pagination-text mx-2">
         Page  {currentPageIndex + 1}
        </span>
        
        <span className="pagination-text me-2">
          of {table.getPageCount()}
        </span>
        
        <Button
          variant="outline-primary"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
          className="pagination-button"
        >
          <FontAwesomeIcon icon={faTimes} />
        </Button>
      </div>
    </div>
  );
};

export default TablePagination;