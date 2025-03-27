// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useState, useEffect, useContext, createContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import LaneContainer from './LaneContainer';
import LaneContainerRanked from './Lanes/LaneContainerRanked';
import CreateProject from './CreateProject';
import { Toaster } from 'react-hot-toast';
import AutomationOffcanvasDisplay from './AutomationOffcanvasDisplay';
import AutoMilestones from './Milestones/AutoMilestones';
import { selectApiBugs, selectApiEnhancements, selectApiMilestones, selectApiProjects, selectApiRankings, selectApiScripts } from '../../util/ApiDataSlice';
import { bucketAutomationsData, getProjectType } from '../../util/DataUtil';
import { AppContext } from '../../../App';
import { Row, Col, Button, CardBody, Card } from 'react-bootstrap';
import { openFormAsync } from '../../shared/FormModal';
import { statuses, statusMapping } from '../../../../src_shared/AppConstants';
import { selectEmail } from '../../util/UserSettingsSlice';
import Search from '../../util/Search';
import { arrayUtils, to } from '../../../../src_shared/TypeUtils';
import { makeStorage } from '../../util/StorageUtils';

export const AutomationsContext = createContext({ currentProjectId: '', bucketedProjects: {}, mappedMilestones: {}, mappedRankings: {}, allProjects: [] });
const automationStorage = makeStorage('automations', 1);

function Automations() {
  const rpaProjects = useSelector(selectApiProjects);
  const rpaEnhancements = useSelector(selectApiEnhancements);
  const rpaScripts = useSelector(selectApiScripts);
  const rpaBugs = useSelector(selectApiBugs);
  const milestones = useSelector(selectApiMilestones);
  const rankings = useSelector(selectApiRankings);
  const { setDevTools } = useContext(AppContext);
  const [currentProject, setCurrentProject] = useState(null);
  const [currentProjectId, setCurrentProjectId] = useState(null);
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const [milestoneModalShow, setMilestoneModalShow] = useState(false);
  const { activeUser } = useContext(AppContext);

  const [filter, setFilter] = useState(automationStorage.get.asObject('filter', { filterField: 'name', filterValue: '', filterType: 'All', meChecked: false }));

  // Setup dev tools. Even if none are needed, ensure to provide an empty JSX to clear out the previous page's tools.
  useEffect(() => {
    setDevTools(<></>);
  }, []);

  useEffect(() => {
    automationStorage.set('filter', filter);
  }, [filter]);

  const bucketedProjects = useMemo(() => {
    return bucketAutomationsData(rpaProjects, rpaEnhancements, rpaScripts, rpaBugs);
  }, [rpaProjects, rpaEnhancements, rpaScripts, rpaBugs]);

  const filteredBucketedProjects = useMemo(() => {
    let projectIDs = filter?.filterValue;
    let filterType = filter?.filterType;
    if ((!Array.isArray(projectIDs) || !projectIDs.length) && (!filterType || filterType === 'All') && !filter.meChecked) {
      return bucketedProjects;
    }

    const filteredBucket = {};

    Object.keys(bucketedProjects).forEach(attribute => {
      filteredBucket[attribute] = [];
      const unfilteredArr = bucketedProjects[attribute];

      for (let i = 0; i < unfilteredArr.length; i++) {
        let project = unfilteredArr[i];
        if(projectIDs && !projectIDs.includes(project.ID)) {
            continue;
        }

        if(filterType && filterType !== 'All' && getProjectType(project.ID) !== filterType) {
            continue;
        }

        if(filter.meChecked && !(project.dev_id?.includes(activeUser.ID) || (activeUser?.email.length > 0 && project.process_owners?.includes(activeUser.email)))) {
            continue;
        }

        filteredBucket[attribute].push(project);
      }
    });

    return filteredBucket;
  }, [bucketedProjects, filter, activeUser.ID]);

  const allProjects = useMemo(() => {
    let projects = [];
    Object.keys(bucketedProjects).forEach(attribute => {
      const bucketArr = bucketedProjects[attribute];
      for (let i = 0; i < bucketArr.length; i++) {
        projects.push(bucketArr[i]);
      }
    });
    return projects;
  }, [bucketedProjects]);

  const mappedMilestones = useMemo(() => {
    return to.mapping(milestones, milestone => milestone.ref_id);
  }, [milestones]);

  const mappedRankings = useMemo(() => {
    return to.mapping(rankings, ranking => ranking.project_id);
  }, [rankings]);

  const isEditingProject = useMemo(() => showOffcanvas || milestoneModalShow, [milestoneModalShow, showOffcanvas]);
  const lanes = useMemo(() => {
    return Object.values(statuses).filter(x => !x.hidden);
  }, []);

  return (
    <AutomationsContext.Provider value={{ currentProject, setCurrentProject, currentProjectId, setCurrentProjectId, setShowOffcanvas, setMilestoneModalShow, isEditingProject, bucketedProjects, mappedMilestones, mappedRankings, filteredBucketedProjects, allProjects }}>
      <div style={{ height: `calc(90vh - 200px)` }}>
        <h1 className='text-center'>Automations</h1>
        <Toaster
          position="top-left"
          reverseOrder={false}
        />
        <div className='d-flex'>
          <CreateProject />
        </div>
        <br />
        <Card style={{ height: `100%`, overflowY: 'auto' }}>
            <CardBody style={{ height: `100%` }}>
                    <Search filter={filter} setFilter={setFilter} />
                    <Row style={{ height: `94%` }}>
                        {lanes.map(statusType => {
                            return (<Col xxl={3} sm={6} xs={12} className='mb-3' style={{ height: '100%' }} key={statusType.id}>
                                {statusType.id === statusMapping.UnderEvaluation.id ? <LaneContainerRanked status={statusType} /> : <LaneContainer status={statusType} />}
                            </Col>)
                        })}
                    </Row>
            </CardBody>
        </Card>
        <AutomationOffcanvasDisplay show={showOffcanvas} onHide={() => { setShowOffcanvas(false) }} placement='end' />
        <AutoMilestones show={milestoneModalShow} handleClose={() => setMilestoneModalShow(false)} />
      </div>
    </AutomationsContext.Provider>
  )
}

export default Automations;