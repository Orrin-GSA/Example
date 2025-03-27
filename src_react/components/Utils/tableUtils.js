import { createColumnHelper } from '@tanstack/react-table';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faMagnifyingGlass, 
  faArrowUpRightFromSquare, 
  faFolderOpen 
} from '@fortawesome/free-solid-svg-icons';
import { Button, Badge, ProgressBar, OverlayTrigger, Tooltip, Popover } from 'react-bootstrap';
import { is } from '../../../src_shared/TypeUtils';
import { openProjectTreeModal } from '../Shared/Modals/ProjectTreeModal';

const columnHelper = createColumnHelper();

/**
 * Creates dynamic columns based on the metadata configuration
 * @param {Object} dbConfig - The database configuration
 * @param {string} tableName - The name of the current table
 * @param {Object} mapping - Filter mapping object
 * @param {boolean} isLoaded - Whether data is loaded
 * @returns {Array} Array of column definitions
 */
export function createDynamicColumns(dbConfig, tableName, mapping, isLoaded) {
  if (!isLoaded || !dbConfig.metadata || !dbConfig.metadata[tableName]) return [];
  
  return dbConfig.metadata[tableName].map(row =>
    columnHelper.accessor(
      tableRow =>
        row.type === "date"
          ? tableRow[row.name] ? new Date(tableRow[row.name]) : ''
          : tableRow[row.name],
      {
        id: row.name,
        header: row.title,
        cell: ({ getValue }) => {
          const value = getValue();
          if (row.type === "textArea") {
            return (
            <div className="scrollable-text">
              {value}
            </div>
            );
          }
          
          if (row.type === "date") {
            return is.string(value) ? value : value.toLocaleDateString();
          }
          
          if (row.type === "arr") {
            return value === "" ? "" : (
            <div className="scrollable-list">
              <ul>
                {JSON.parse(value).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
            );
          }
          
          return <span>{value}</span>;
        },
        size: row.size,
        meta: { filterVariant: row.filterType },
        filterFn: mapping[row.filterType] || 'defaultFilterFn'
      }
    )
  );
}

/**
 * Creates action columns based on configuration
 * @param {Object} dbConfig - The database configuration
 * @param {string} tableName - The name of the current table
 * @param {Function} getFolderLink - Function to get folder link
 * @param {Function} handleActionSelect - Function to handle action selection
 * @returns {Array} Array of action column definitions
 */
export function createActionColumns(dbConfig, tableName, getFolderLink, handleActionSelect) {
  if (!dbConfig.actionColumns) return [];
  
  return Object.values(dbConfig.actionColumns)
    .filter(col => col && col.enabled)
    .map(col => {
      if (col.id === 'info') {
        return columnHelper.display({
          id: col.id,
          header: () => <span>{col.header}</span>,
          cell: (cell) => (
            <div className="px-1">
              <Button
                type="button"
                variant={col.buttonVariant}
                onClick={() => handleActionSelect(col.action, cell.row.index)}
                aria-label="View Details"
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} />
              </Button>
            </div>
          ),
          size: Number(col.size),
          enableSorting: col.enableSorting
        });
      } 
      
      // Project folder link column
      else if (col.id === 'project_folder_id') {
        return columnHelper.display({
          id: col.id,
          header: () => <span>{col.header}</span>,
          cell: (cell) => {
            const url = "https://drive.google.com/drive/folders/" + getFolderLink(parseInt(cell.row.id));
            return (
              <OverlayTrigger placement='bottom' overlay={<Tooltip>{url}</Tooltip>}>
                <div className="px-1">
                  <Button
                    type="button"
                    variant={col.buttonVariant}
                    aria-label="Folder Link"
                  >
                    <FontAwesomeIcon
                      icon={faFolderOpen}
                      onClick={() => window.open(url, '_blank').focus()}
                    />
                  </Button>
                </div>
              </OverlayTrigger>
            );
          },
          size: Number(col.size),
          enableSorting: col.enableSorting
        });
      } 
      
      // Project tree column
      else if (["online", "offline"].includes(tableName) && col.id === 'projectTree') {
        return columnHelper.display({
          id: col.id,
          header: () => <span>{col.header}</span>,
          cell: (cell) => (
            <div className="px-1">
              <Button
                type="button"
                variant={col.buttonVariant}
                onClick={() => openProjectTreeModal(cell.row.original?.subidea_id)}
                aria-label="Project Tree">
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} />
              </Button>
            </div>
          ),
          size: Number(col.size),
          enableSorting: col.enableSorting
        });
      }
      
      return null;
    })
    .filter(col => col !== null);
}

/**
 * Helper function to get milestone popover content
 * @param {number} id - Row ID
 * @param {Object} originalRow - Original row data
 * @returns {JSX.Element} Popover content
 */
export function getMilestonePopover(id, originalRow) {
  if (!originalRow || !originalRow.milestoneInfo) {
    return <div>No milestone information available</div>;
  }
  
  const htmlStr = Object.keys(originalRow.milestoneInfo).reduce(
    (acc, key) => key + ":" + originalRow.milestoneInfo[key] + "<br>" + acc,
    ""
  );
  
  return <div dangerouslySetInnerHTML={{ __html: htmlStr }} />;
}

/**
 * Creates badge columns for the table
 * @param {Object} dbConfig - The database configuration
 * @param {string} tableName - The name of the current table
 * @param {Object} mapping - Filter mapping object
 * @returns {Array} Array of badge column definitions
 */
export function createBadgeColumns(dbConfig, tableName, mapping) {
  if (!dbConfig.badgeColumns || !dbConfig.badgeColumns[tableName]) return [];
  
  return Object.values(dbConfig.badgeColumns[tableName])
    .filter(col => col && col.enabled)
    .map(col => {
      // Status column with badges
      if (col.id === 'status') {
        return columnHelper.accessor('status', {
          id: col.id,
          header: col.header,
          cell: (cell) => {
            const value = cell.getValue();
            const statusProp = dbConfig.statuses.find(row => row.label === value);
            return (
              <Badge style={{ whiteSpace: 'normal' }} bg={statusProp?.type || 'secondary'}>
                {value}
              </Badge>
            );
          },
          size: col.size,
          meta: { filterVariant: col.filterType },
          filterFn: mapping['multiselect'],
          enableSorting: true
        });
      } 
      
      // Milestones column with progress bar
      else if (col.id === 'milestones') {
        return columnHelper.accessor('milestones', {
          id: col.id,
          header: col.header,
          cell: (cell) => (
            <OverlayTrigger
              placement='bottom'
              overlay={
                <Popover id="popover-basic">
                  <Popover.Body>
                    {getMilestonePopover(parseInt(cell.row.id), cell.row.original)}
                  </Popover.Body>
                </Popover>
              }
            >
              {cell.getValue() === 0
                ? <ProgressBar animated now={100} label="0" variant="secondary" style={{ opacity: 0.5 }} />
                : <ProgressBar animated now={cell.getValue()} label={cell.getValue()} />
              }
            </OverlayTrigger>
          ),
          size: col.size,
          meta: { filterVariant: col.filterType },
          filterFn: mapping['multiselect'],
          enableSorting: true
        });
      } 
      
      // Development progress column
      else if (col.id === 'devProgress') {
        return columnHelper.accessor('devProgress', {
          id: col.id,
          header: col.header,
          cell: (cell) => {
            const rawValue = cell.getValue();
            const numericValue = !rawValue ? 0 : parseInt(String(rawValue), 10) || 0;
            return (
              <OverlayTrigger 
                placement='bottom'
                overlay={<Tooltip>{rawValue || '0'}</Tooltip>}>
                {numericValue === 0 ? 
                  <ProgressBar animated now={100} label="0" variant="secondary" style={{ opacity: 0.5 }} /> : 
                  <ProgressBar animated now={numericValue} label={rawValue} />}
              </OverlayTrigger>
            );
          },
          size: col.size,
          meta: { filterVariant: col.filterType },
          filterFn: mapping['multiselect'],
          enableSorting: true 
        });
      }
      
      return null;
    })
    .filter(col => col !== null);
}

/**
 * Gets the folder link for a row
 * @param {number} id - Row ID
 * @param {Array} inputData - Table data
 * @returns {string} Folder link
 */
export function getFolderLink(id, inputData) {
  if (!inputData || !inputData[id] || !inputData[id].project_folder_id) {
    return "";
  }
  return inputData[id].project_folder_id;
}

/**
 * Gets the visible table data for export
 * @param {Object} table - Table instance
 * @returns {Array} Visible table data
 */
export function getVisibleTableData(table) {
  const visibleCols = table.getVisibleLeafColumns().map(col => col.id);
  return table.getFilteredRowModel().rows.map(row =>
    visibleCols.reduce((acc, colId) => {
      acc[colId] = row.original[colId];
      return acc;
    }, {})
  );
}

/**
 * Process chart data for visualization
 * @param {Array} tblData - Filtered table data
 * @param {string} colName - Column name to use for data grouping
 * @param {string} stackedName - Optional column name for stacked charts
 * @returns {Object} Formatted chart data object
 */
export function processChartData(tblData, colName, stackedName) {
  const rgb = ['rgb(255, 99, 132)', 'rgb(75, 192, 192)', 'rgb(53, 162, 235)', 'rgb(235, 165, 53)'];
  const dataItems = tblData.map(item => item.original);

  // Handle stacked chart data
  if (stackedName) {
    const labels = [...new Set(dataItems.map(item => item[colName]))];
    const stackedLabels = [...new Set(dataItems.map(item => item[stackedName]))];
    let datasets = [];

    stackedLabels.forEach((lbl, idx) => {
      let dataObj = {};
      dataItems.filter(item => item[stackedName] === lbl).forEach(item => {
        let xVal = formatXValue(item, colName);
        dataObj[xVal] = (dataObj[xVal] || 0) + 1;
      });
      datasets.push({
        label: lbl,
        data: dataObj,
        backgroundColor: rgb[idx % rgb.length]
      });
    });
    
    // Ensure minimum 10 labels for proper display
    while (labels.length < 10) labels.push('');
    return { labels, datasets };
  }

  // Handle simple chart data
  let dataObj = {};
  dataItems.forEach(item => {
    let xVal = formatXValue(item, colName);
    dataObj[xVal] = (dataObj[xVal] || 0) + 1;
  });
  
  const labels = Object.keys(dataObj);
  while (labels.length < 10) labels.push('');
  
  return {
    labels,
    datasets: [{
      data: Object.values(dataObj),
      backgroundColor: 'rgb(255, 99, 132)',
    }],
  };
}

/**
 * Format X-axis values, handling date columns specially
 * @param {Object} item - Data item
 * @param {string} colName - Column name
 * @returns {string} Formatted value
 */
function formatXValue(item, colName) {
  if (colName?.includes("date") && item[colName]) {
    const date = new Date(item[colName]);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
  return item[colName] || '';
}