import { Row } from '@tanstack/react-table'

export const filterFunctions: { [key: string]: (row: Row<any>, columnId: string, filterValue: any) => boolean } = {
  select: (row, columnId, filterValue) => {
    if (!Array.isArray(filterValue) || filterValue.length === 0) {
      return true; 
    }
    const selected = filterValue[0]?.value;
    return row.original[columnId] === selected;
  },

  multiselect: (row, columnId, filterValue) => {
    if (!Array.isArray(filterValue) || filterValue.length === 0) {
      return true;
    }
    return filterValue.some(x => row.original[columnId] === x.value);
  },

  multiselectArr: (row, columnId, filterValue) => {
    if (!Array.isArray(filterValue) || filterValue.length === 0) {
      return true;
    }
    return filterValue.some(x => row.original[columnId].includes(x.value));
  },

  includesString: (row, columnId, filterValue) => {
    if (!filterValue) {
      return true;
    }
    return row.original[columnId]?.includes(filterValue);
  },
};
