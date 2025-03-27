import React, { useEffect, useState, useContext, useMemo } from 'react';
import { Button } from 'react-bootstrap';
import Modal from 'react-bootstrap/Modal';
import SyncLoader from "react-spinners/SyncLoader";
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import { MultiSelect } from 'react-multi-select-component';
import { ApiProviderContext } from '../../util/ApiDataProvider';
import { selectIsAdmin } from '../../util/UserSettingsSlice';
import { addRpaWithBlocking, selectApiOffices, selectApiPoaUsers, selectApiSystems, selectApiUsers, selectApiIdeas, selectApiNpe, selectApiDocuments, selectApiTools } from '../../util/ApiDataSlice';
import { priorities, priorityMapping, statuses, statusMapping } from '../../../../src_shared/AppConstants';
import ToastUtils from '../../util/ToastUtils';

function CreateProject() {
  const dispatch = useDispatch();
  const { refreshApiBlocking } = useContext(ApiProviderContext);

  const [show, setShow] = useState(false);
  const [rpaName, setRpaName] = useState("")
  const [startDate, setStartDate] = useState("");
  const [estEndDate, setEstEndDate] = useState("");
  const [priority, setPriority] = useState("");
  const [phaseChange, setPhaseChange] = useState("");
  const [status, setStatus] = useState(statusMapping.UnderEvaluation.id);
  const [devID, setDevID] = useState("");
  //const [processOIds, setProcessOIds] = useState("");
  //const [custodianIds, setCustodianIds] = useState("");
  const [npeIds, setNpeIds] = useState("");
  const [liveDate, setLiveDate] = useState("");
  //const [systemIds, setSystemIds] = useState("");
  const [packageVersion, setPackageVersion] = useState("");
  const [blockButton, setBlockButton] = useState(false);
  const [createBtn, setCreateBtn] = useState(true);
  const [selectedDev, setSelectedDev] = useState([]);
  const [selectedPO, setSelectedPO] = useState([]);
  const [selectedCustodian, setSelectedCustodian] = useState([]);
  const [selectedOffice, setSelectedOffice] = useState([]);
  const [selectedSystems, setSelectedSystems] = useState([]);
  const [selectedIdea, setSelectedIdea] = useState([]);
  const [selectedNpe, setSelectedNpe] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [selectedTools, setSelectedTools] = useState([]);

  const isAdmin = useSelector(selectIsAdmin);
  const employees = useSelector(selectApiUsers);
  const poaUsers = useSelector(selectApiPoaUsers);
  const offices = useSelector(selectApiOffices);
  const systems = useSelector(selectApiSystems);
  const ideas = useSelector(selectApiIdeas);
  const npes = useSelector(selectApiNpe);
  const documents = useSelector(selectApiDocuments);
  const tools = useSelector(selectApiTools);
  const description_limit = 45;
  const addProjectUrl = "https://script.google.com/a/macros/gsa.gov/s/AKfycbw1Zxl2JpTduqxueeDLz6T5w5xL20L9pyTQNxWrmXZj3UFJ1EMFavjz_ygAKNuANuqu/exec";

  let employeeOptions = employees.map(employee => ({
    label: employee?.email,
    value: employee?.ID,
    disabled: employee?.status !== "Inactive" ? false : true
  }));

  let devOptions = poaUsers.map(poa => ({
    label: poa?.email ? poa?.email : poa?.name,
    value: poa?.ID,
    disabled: poa?.status !== "Inactive" ? false : true
  }));

  let officeOptions = offices.map(office => ({
    label: office?.name && office?.name.length > 0 ? office?.name : office?.sso + " - " + office?.dept_code,
    value: office?.ID,
  }));

  let systemOptions = systems.map(system => ({
    label: system?.name,
    value: system?.ID,
  }));

  let npeOptions = npes.map(npe => ({
    label: npe?.ent,
    value: npe?.ID,
  }));

  let documentOptions = documents.map(document => ({
    label: document?.name,
    value: document?.ID,
  }));

  let toolsOptions = tools.map(tool => ({
    label: tool?.name,
    value: tool?.ID,
  }));

  let selectableIdeas = ideas;

  const selectableStatuses = useMemo(() => {
    return statuses.filter(x => !x.hidden);
  }, []);

  var selectedStatus = useMemo(() => {
    return statusMapping[status];
  }, [status]);

  var selectableStages = useMemo(() => {
    if (!selectedStatus) {
      return [];
    }

    return selectedStatus.stages;
  }, [selectedStatus]);

  useEffect(() => {
  }, [blockButton])

  useEffect(() => {
  }, [createBtn])

  function toastMessage(message) {
    toast.success(message, {
      style: {
        border: '1px solid #045721',
        padding: '16px',
        color: '#045721',
      },
      iconTheme: {
        primary: '#045721',
        secondary: '#ffffff',
      },
    });
  }

  function toastError(message) {
    toast.error(message, {
      style: {
        border: '1px solid #910101',
        padding: '16px',
        color: '#910101',
      },
      iconTheme: {
        primary: '#910101',
        secondary: '#ffffff',
      },
    });
  }

  /**
   * 
   * @param {RpaProject} project 
   * @returns 
   */
  function validateProject(project) {
    const errors = [];

    if (!project.name?.trim()) {
      errors.push('Name is required.');
    }

    if (!project.status) {
      errors.push('Status is required.');
    }

    if (selectableStages.length > 0 && !project.dev_stage) {
      errors.push('Stage is required.');
    }

    return errors;
  }

  async function saveProject() {
    setCreateBtn(false);
    try {
      const devIDs = selectedDev.map(x => { return x.value }).join(",");
      const custodianIDs = selectedCustodian.map(x => { return x.value }).join(",");
      const officeIDs = selectedOffice.map(x => { return x.value }).join(",");
      const systemIDs = selectedSystems.map(x => { return x.value }).join(",");
      const selectedPOs = selectedPO.map(x => { return x.value }).join(",");
      const selectedNpes = selectedNpe.map(x => { return x.value }).join(",");
      const selectedDocuments_ = selectedDocuments.map(x => { return x.value }).join(",");
      const selectedTools_ = selectedTools.map(x => { return x.value }).join(",");

      let newProject = {
        subidea_id: selectedIdea,
        name: rpaName,
        priority: priority,
        status: status,
        dev_stage: phaseChange,
        dev_id: devIDs,
        start_date: startDate,
        est_delivery_date: estEndDate,
        deployed_version: packageVersion,
        process_owner_ids: selectedPOs,
        custodian_ids: custodianIDs,
        npe_ids: npeIds,
        system_ids: systemIDs,
        office_id: officeIDs,
        live_date: liveDate,
        npe: selectedNpes,
        document_ids: selectedDocuments_,
        tools_ids: selectedTools_
      };

      console.log("newProject", newProject);

      const errors = validateProject(newProject);
      if (errors.length > 0) {
        ToastUtils.showError(<>Unable to Save: <br />{errors.map(x => <>{x}<br /></>)}</>);
        return;
      }

      await dispatch(addRpaWithBlocking(newProject)).unwrap();
      toastMessage("Created the RPA project: " + rpaName);
      reset();
      setShow(false);
    }
    catch (err) {
      toastError("Failed to create the Project -", err);
      console.error(err);
    }
    finally {
      setCreateBtn(true);
    }
  }

  function onStatusChanged(statusId) {
    setStatus(statusId);
    /** @type {import('../../../../src_shared/AppConstants').StatusType} */
    const status = statusMapping[statusId];
    if (status.stages.length === 0) {
      setPhaseChange('');
    }
    else {
      setPhaseChange(status.stages[0].id);
    }
  }

  async function reloading() {
    try {
      setBlockButton(true);
      await refreshApiBlocking();
    } catch {
      window.location.reload();
    }
    finally {
      setBlockButton(false);
    }
  }

  function reset() {
    setStatus(statusMapping.UnderEvaluation.id);
    setPhaseChange('');
    setRpaName('');
    setPriority(priorityMapping.Medium.id);
    setStartDate('');
    setEstEndDate('');
    setLiveDate('');
    setPackageVersion('');
    setDevID('');
  }

  return (
    <div className="d-flex" >
      <Button variant={"secondary"} className="d-flex" disabled={blockButton} onClick={reloading}>
        Refresh Page
        <div className="sweet-loading">
          <SyncLoader
            color={"#ffffff"}
            loading={blockButton}
            size={5}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
        </div>
      </Button>
      {/* {isAdmin && <Button onClick={() => { setShow(true) }} className='mx-2 d-flex'>Add Project</Button>} */}
      {isAdmin && <Button onClick={() => { window.open(addProjectUrl, '_blank') }} className='mx-2 d-flex'>Add Project</Button>}

      <Modal show={show} onHide={() => setShow(!show)}>
        <Modal.Header closeButton>
          <Modal.Title>Create a Project</Modal.Title>
        </Modal.Header>
        <form className='center-text modal-show w-100'>
          <Modal.Body className='force_scroll'>

            <label htmlFor="idea" className='d-flex'><p style={{ color: "red" }}>*</p>Idea</label>
            <select name="idea"
              className='w-100 mb-3'
              onChange={(e) => setSelectedIdea(e.target.value)}
              id="idea_id">
                <option value=""></option>
              {selectableIdeas.map((idea, idx) => {                  
                return <option title={`${idea?.ID} - ${idea?.submitter_email} - ${idea?.office} - ${idea?.description}`} key={idea.ID + idx} value={idea.ID}>{`${idea.ID} - ${(idea.description.length < description_limit ? idea.description : idea.description.substring(0, description_limit) + '...')}`}</option>
              })};
            </select>
            <br />

            <label htmlFor="rpa_name" className='d-flex'><p style={{ color: "red" }}>*</p>RPA Name</label>
            <input value={rpaName} required className='w-100 mb-3' type="text" id="rpa_name" onChange={(e) => setRpaName(e.target.value)} />
            <br />

            <label htmlFor="rpa_priority" className='d-flex'><p style={{ color: "red" }}>*</p>Priority</label>
            <select id="rpa_priority" className='w-100 mb-3'
              onChange={(e) => setPriority(e.target.value)}>
                {priorities.map(priority => <option key={priority.value} value={priority.id}>{priority.title}</option>)}
            </select>
            <br />

            <label htmlFor="phase_change" className='d-flex'><p style={{ color: "red" }}>*</p>Status</label>
            <select name="phase_change"
              className='w-100 mb-3'
              onChange={(e) => onStatusChanged(e.target.value)}
              id="phase_change">
              {selectableStatuses.map(status => {
                return <option key={status.id} value={status.id}>{status.title}</option>
              })};
            </select>
            <br />

            <label htmlFor="dev_stage">Stage</label>
            <select name="dev_stage"
              className='w-100 mb-3'
              value={phaseChange}
              onChange={(e) => setPhaseChange(e.target.value)}
              disabled={selectableStages.length === 0}
              id="dev_stage">
              {selectableStages.length === 0 ? <option value="">No Stages</option> : ''}
              {selectableStages.map(stage => {
                return <option key={stage.id} value={stage.id}>{stage.title}</option>
              })};
            </select>
            <br />

            {/* <label htmlFor="dev_id">Developer(s)/POA</label>
            <MultiSelectDropdown choices={[{ label: "test@gmail.com", value: "POA-001" }, { label: "test2@gmail.com", value: "POA-002" }, { label: "test3@gmail.com", value: "POA-003" }]}
              placeholder="Select developer(s)" id="dev_id" className='mb-3 w-100' /> */}

            <label htmlFor="dev_id" className='d-flex'><p style={{ color: "red" }}>*</p>Developer(s)/POA</label>
            <MultiSelect
              id="dev_id"
              options={devOptions}
              value={selectedDev}
              onChange={setSelectedDev}
              labelledBy="Select"
              hasSelectAll={false}
            />
            <br />

            <label htmlFor="start_date" className='d-flex'><p style={{ color: "red" }}>*</p>Start Date:</label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              className='mb-3 w-100'
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
            <br />

            <label htmlFor="est_delivery_date" className='d-flex mb-3'>End Date:</label>
            <input
              type="date"
              id="est_delivery_date"
              name="est_delivery_date"
              className='w-100 mb-3'
              value={estEndDate}
              onChange={e => setEstEndDate(e.target.value)}
            />
            <br />

            <label htmlFor="live_date" className='d-flex mb-3'>Live Date:</label>
            <input
              type="date"
              id="live_date"
              name="live_date"
              className='w-100 mb-3'
              value={liveDate}
              onChange={e => setLiveDate(e.target.value)}
            />
            <br />

            <label htmlFor="current_version">Current Version</label>
            <input className='w-100 mb-3' type="text" id="current_version" value={packageVersion} onChange={(e) => setPackageVersion(e.target.value)} />
            <br />

            <label htmlFor="office_id" className='d-flex'><p style={{ color: "red" }}>*</p>Office</label>
            <MultiSelect
              id="office_id"
              options={officeOptions}
              value={selectedOffice}
              onChange={setSelectedOffice}
              labelledBy="Select Office"
              hasSelectAll={false}
            />
            <br />

            <label htmlFor="dev_id" className='d-flex'><p style={{ color: "red" }}>*</p>Process Owner</label>
            <MultiSelect
              className=""
              id="dev_id"
              options={employeeOptions}
              value={selectedPO}
              onChange={setSelectedPO}
              labelledBy="Select Process Owner"
              hasSelectAll={false}
            />
            <br />

            <label htmlFor="custodian_ids">Custodian(s)</label>
            <MultiSelect
              id="custodian_ids"
              options={employeeOptions}
              value={selectedCustodian}
              onChange={setSelectedCustodian}
              labelledBy="Select"
              hasSelectAll={false}
            />
            <br />

            <label htmlFor="npe_ids">NPE(s)</label>
            <MultiSelect
              id="npe_ids"
              options={npeOptions}
              value={selectedNpe}
              onChange={setSelectedNpe}
              labelledBy="Select"
              hasSelectAll={false}
            />
            <br />

            <label htmlFor="system_ids">System(s)</label>
            <MultiSelect
              id="system_ids"
              className='w-100'
              options={systemOptions}
              value={selectedSystems}
              onChange={setSelectedSystems}
              labelledBy="Select"
              hasSelectAll={false}
            />
            <br />

            <label htmlFor="tool_ids">Tool(s)</label>
            <MultiSelect
              id="tool_ids"
              className='w-100'
              options={toolsOptions}
              value={selectedTools}
              onChange={setSelectedTools}
              labelledBy="Select"
              hasSelectAll={false}
            />
            <br />

            <label htmlFor="document_ids">Document(s)</label>
            <MultiSelect
              id="document_ids"
              className='w-100'
              options={documentOptions}
              value={selectedDocuments}
              onChange={setSelectedDocuments}
              labelledBy="Select"
              hasSelectAll={false}
            />
            <br />

          </Modal.Body>
          <Modal.Footer className='w-100'>
            <Button variant="secondary" onClick={() => setShow(!show)}>Close</Button>
            <Button variant="primary" disabled={!createBtn} className="d-flex" onClick={() => saveProject()}>
              Create Project
              <div className="sweet-loading">
                <SyncLoader
                  color={"#ffffff"}
                  loading={!createBtn}
                  size={5}
                  aria-label="Loading Spinner"
                  data-testid="loader"
                  loader="SyncLoader"
                />
              </div>
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </div>
  )
}

export default CreateProject