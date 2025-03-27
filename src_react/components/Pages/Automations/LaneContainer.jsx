/**
 * Swimlane structure as well as sorting/filtering functionality
 */
import React, { useEffect, useState, useMemo } from 'react';
import { Dropdown, Card } from 'react-bootstrap';
import * as Icon from 'react-bootstrap-icons';
import PropTypes from 'prop-types';
import { to } from '../../../../src_shared/TypeUtils';
import BoxContainer from './BoxContainer';
import { priorityMapping } from '../../../../src_shared/AppConstants';

export const sortings = [
  {
      name: 'End Date Asc',
      id: 1,
      sort(a, b) {
        return new Date(a.est_delivery_date) - new Date(b.est_delivery_date);
      }
  },
  {
      name: 'End Date Desc',
      id: 2,
      sort(a, b) {
        return (-1) * (new Date(a.est_delivery_date) - new Date(b.est_delivery_date));
      }
  },
  {
      name: 'A to Z',
      id: 3,
      sort(a, b) {
        return (a.name.localeCompare(b.name));
      }
  },
  {
      name: 'Z to A',
      id: 4,
      sort(a, b) {
        return (-1) * (a.name.localeCompare(b.name));
      }
  },
  {
      name: 'Priority Asc',
      id: 5,
      sort(a, b) {
        let currPriority = priorityMapping[a.priority]?.value || -1;
        let nextPriority = priorityMapping[b.priority]?.value || -1;
        return currPriority - nextPriority;        
      }
  },
  {
      name: 'Priority Desc',
      id: 6,
      sort(a, b) {
        let currPriority = priorityMapping[a.priority]?.value || -1;
        let nextPriority = priorityMapping[b.priority]?.value || -1;
        return (-1) * (currPriority - nextPriority);  
      }
  },
  {
    name: 'Rank',
    id: 7,
    sort(a, b) {
        // TODO: If it's empty it should simply be at the bottom.
        let currRank = a.rank ?? 100000;
        let nextRank = b.rank ?? 100000;
        // Asc, 1 is top
        return (currRank - nextRank);  
    },
    hidden: true
  }
]

export const sortingMapping = to.mapping(sortings, (sorting) => sorting.id);

/**
 * @param {Object} props 
 * @param {import('../../../../src_shared/AppConstants').StatusType} props.status
 */
function LaneContainer({ status }) {
  const laneSortingName = useMemo(() => `lane_${status.title.replaceAll(" ", "_")}_sorting`, [status]);
  const containerClassName = useMemo(() => `lane_${status.title.replaceAll(" ", "_")}`, [status]);

  const [sorting, setSorting] = useState(to.int(localStorage.getItem(laneSortingName)));
  useEffect(() => {
    localStorage.setItem(laneSortingName, sorting);
  }, [sorting]);

  const visibleStages = useMemo(() => {
    return status.stages.filter(x => !x.hidden);
  }, [status]);

  const selectedSortingName = useMemo(() => {
    if(!sorting || sorting < 0) {
        return '';
    }

    var sortingObj = sortingMapping[sorting];
    if(!sortingObj) {
        console.error(`Invalid Sorting Id found ${sorting}`);
        return '';
    }

    return sortingObj.name;
  }, [sorting]);

  function sortClear() {
    setSorting(0);
  }

  return (
    // Swim Lane
    <div className={`card my-2 mx-1 ${containerClassName}`} style={{ height: '100%' }}>
        <Card className={`containers-header`}>
          <div className='d-flex containers-header-name'>
            <h3 className="card-title d-flex zero-margin w-100 text-break">{status.title}</h3>
            {/* sorting dropdown */}
            <Dropdown className='accordion container-filter-accordion w-75' >
                <Dropdown.Toggle variant='secondary' size='lg' className='w-100 accordion-item' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} id={`${containerClassName}_toggle`}>
                    <span className='container-filter-title'>Sort {selectedSortingName}</span>
                </Dropdown.Toggle>

                <Dropdown.Menu className='container-filter-accordion' style={{ width: '92%' }}>
                    {sortings.map(sorting => {
                        return !sorting.hidden && <Dropdown.Item key={sorting.id} onClick={() => setSorting(sorting.id)}>{sorting.name}</Dropdown.Item>
                    })}
                    <Dropdown.Item onClick={sortClear}>Clear <Icon.XLg></Icon.XLg></Dropdown.Item>
                </Dropdown.Menu>
            </Dropdown>
          </div>
        </Card>
        <div style={{ overflowY: 'scroll' }}>
          {/* Project cards */}
          <Card>
          {/* If there are stages, generate boxes by stage. */}
          {visibleStages.length > 0 && visibleStages.map((stage) => <BoxContainer key={status.id + stage.id} status={status} stage={stage} sortType={sorting}></BoxContainer>)}
          {/* If there are stages, generate a single box for the status. */}
          {visibleStages.length === 0 && <BoxContainer key={status.id} status={status} stage={null} sortType={sorting}></BoxContainer>}
          </Card>
        </div>
    </div>
  )
}

LaneContainer.propTypes = {
    status: PropTypes.object.isRequired
}

export default LaneContainer