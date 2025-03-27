
// This file now imports section data from dbConfig instead of defining it directly
import dbConfig from '../../../../src_dev/settings/dbConfig.json';

// Helper function to convert filterField/filterValue to filter function
const createFilterFunction = (section) => {
  if (!section.tabs) return section;
  
  // Process each tab to create filter functions
  const tabsWithFilters = section.tabs.map(tab => {
    const filter = (item) => {
      let passes = true;

      if (tab.filterField && tab.filterValue && !tab.filterOperator) {
        passes = item[tab.filterField] === tab.filterValue;
      }
      if (tab.filterField && tab.filterValue && tab.filterOperator === '!=') {
        passes = item[tab.filterField] !== tab.filterValue;
      }
      if (tab.filterField && tab.filterValues && tab.filterOperator === 'in') {
        passes = tab.filterValues.includes(item[tab.filterField]);
      }
      if (passes && tab.additionalFilter) {
        const { field, operator, values } = tab.additionalFilter;
        if (field && operator && values) {
          if (operator === 'in' && Array.isArray(values)) {
            passes = passes && values.includes(item[field]);
          }
          if (operator === 'not in' && Array.isArray(values)) {
            passes = passes && !values.includes(item[field]);
          }
        }
      }
      
      return passes;
    };
    
    // Return the tab with the filter function added
    return { ...tab, filter };
  });
  
  // Return the section with updated tabs
  return { ...section, tabs: tabsWithFilters };
};


// Get sections from dbConfig and process them
const projectSections = (dbConfig.projectSections || []).map(createFilterFunction);

export default projectSections;