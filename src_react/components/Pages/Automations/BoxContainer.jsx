// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useMemo, useContext } from 'react';
import PropTypes from 'prop-types';
import { useDrop } from 'react-dnd';
import { useDispatch, useSelector } from 'react-redux';
import ProjectCard from './ProjectCard';
import { AutomationsContext } from './Automations';
import ToastUtils from '../../util/ToastUtils';
import ApiDataService from '../../util/ApiDataService';
import { validateMove, moveDroppedProjectToStatus } from '../../util/RpaUtils';
import { selectIsAdmin, selectEmail } from '../../util/UserSettingsSlice';
import { parseSafe, dragulaCssName, ActionLogger, UpdateHandler } from '../../util/DataUtil';
import { sortingMapping } from './LaneContainer';
import ApiUpdater from '../../util/ApiUpdater';
import { AppContext } from '../../../App';
import { statusMapping } from '../../../../src_shared/AppConstants';
import { cleanRanking, removeRanking } from '../../util/ApiDataSlice';

/**
 * 
 * @param {Object} props 
 * @param {import('../../../../src_shared/AppConstants').StatusType} props.status
 * @param {import('../../../../src_shared/AppConstants').StageType?} props.stage
 */
function BoxContainer({ status, stage, sortType }) {
    const isAdmin = useSelector(selectIsAdmin);
    const email = useSelector(selectEmail);
    const { activeUser } = useContext(AppContext);
    const { filteredBucketedProjects } = useContext(AutomationsContext);
    const dispatch = useDispatch();

    let transparentBlue = "#0000FF60";
    let transparentRed = "#FF000060";

    // stageClean: boxTitle: "Dev Queue" -> "devqueue"
    // TODO: Move to status
    const [boxCss, itemCss] = useMemo(() => {
        var title = stage ? stage.title : status.title;
        return [dragulaCssName(title, true), dragulaCssName(title, false)];
    }, [status, stage]);

    const projects = useMemo(() => {
        /** @type {RpaProjectProcessed[]} */
        let apiData = (filteredBucketedProjects[status.id] ?? []).concat();

        if (stage != null) {
            apiData = apiData.filter(x => x.dev_stage === stage.id);
        }

        const dataSorted = sortType > 0 ? apiData.sort(sortingMapping[sortType].sort) : apiData;
        // console.log("dataSorted",dataSorted)
        return dataSorted;
    }, [filteredBucketedProjects, sortType, status, stage]);

    const title = useMemo(() => {
        return stage?.title ?? '';
    }, [stage]);

    const [{ canDrop, isOver }, drop] = useDrop(() => ({
        accept: 'RpaProjects',
        // A abbreviated check to see if the project passes basic requirements to move. This will be called every pixel the mouse moves so it needs to be fast.
        /** @param {{ record: ProjectCommonProcessed, ID: string, statusId: string, stageId?: string, progress: number }} item */
        canDrop: (item, _monitor) => {
            localStorage.setItem("currentProgress", item.progress.toString());

            const isLocked = (isAdmin == false) && item.record.dev_id && !(item.record.dev_id.includes(activeUser.ID));

            if (isLocked) {
                return false;
            }

            const errors = validateMove(item.record, item.statusId, status.id, item.progress);

            return !errors;
        },
        /** @param {{ record: ProjectCommonProcessed, ID: string, statusId: string, stageId?: string, progress: number }} item */
        drop: async (item, _monitor) => {
            const statusChanged = item.statusId !== status.id;
            const stageChanged = !!stage && item.stageId !== stage?.id;
            
            const stageOnlyChanged = !statusChanged && stageChanged;

            // Do nothing if dropped back into it's own drop zone.
            if (!statusChanged && !stageOnlyChanged) {
                console.log("status and dev no change:", stage?.id);
                return;
            }

            const record = item.record;
            const updater = new UpdateHandler(record);

            const output = { comments: '' };

            const canceled = await moveDroppedProjectToStatus(isAdmin, record, status, stage, item.progress, updater, output);
            if(canceled) {
                return;
            }
            
            if (output.comments) {
                const prevComments = parseSafe(record.comments_history, []);
                const newComments = [{ date: new Date(), comment: output.comments, user: !activeUser?.email ? "invalid_user" : activeUser.email }, ...prevComments];
                updater.add('comments_history', JSON.stringify(newComments));
            }

            ApiUpdater.update(record, updater);
        },
        // Props to collect to use in the below JSX.
        collect: (monitor) => ({
            isOver: monitor.isOver({ shallow: true }),
            canDrop: monitor.canDrop()
        })
    }), [status, stage]);

    return (
        <div className='card-body' ref={drop} style={{ backgroundColor: isOver && !canDrop ? transparentRed : isOver && canDrop ? transparentBlue : 'inherit' }}>
            <h3 className="card-title d-flex">
                {title}
            </h3>
            <div className="card-text dropzone" id={boxCss}>
                {projects.map((projectData) => (
                    <ProjectCard key={projectData.ID} clsName={itemCss} project={projectData} status={status} stage={stage} />
                ))}
            </div>
        </div>
    );
}

BoxContainer.propTypes = {
    status: PropTypes.object.isRequired,
    stage: PropTypes.object,
    sortType: PropTypes.number
}

export default BoxContainer;
