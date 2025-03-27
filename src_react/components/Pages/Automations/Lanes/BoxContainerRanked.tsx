// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React, { useMemo, useContext } from 'react';
import PropTypes from 'prop-types';
import { useDrop } from 'react-dnd';
import { useDispatch, useSelector } from 'react-redux';
import ProjectCard from '../ProjectCard';
import ToastUtils from '../../../util/ToastUtils';
import ApiDataService from '../../../util/ApiDataService';
import { validateMove, moveDroppedProjectToStatus } from '../../../util/RpaUtils';
import { selectIsAdmin, selectEmail } from '../../../util/UserSettingsSlice';
import { statusIdToTitle, statusMapping, StatusType } from '../../../../../src_shared/AppConstants';
import { parseSafe, dragulaCssName, ActionLogger, UpdateHandler } from '../../../util/DataUtil';
import ApiUpdater from '../../../util/ApiUpdater';
import { arrayUtils, assert, is } from '../../../../../src_shared/TypeUtils';
import { cleanRanking, removeRanking, selectApiRankings } from '../../../util/ApiDataSlice';
import { AppContext } from '../../../../App';

type Props = {
    project: ProjectCommonProcessed;
    status: StatusType;
    updateRanking: (ranking: Ranking) => void;
    idx: number;
    isSaving: boolean;
}

type DropBoxItem = {
    record: ProjectCommonProcessed;
    ID: string;
    statusId: string;
    stageId?: string;
    progress: number;
    userEmails?: never;
    idx?: number;
}

const getNextRanking = (rankings: Ranking[]) => {
    const max = arrayUtils.max(rankings, (item) => item.rank);
    if(max === Number.MIN_SAFE_INTEGER) {
        return 0;
    }
    else {
        return max + 1;
    }
}

function BoxContainerRanked({ project, status, updateRanking, idx, isSaving }: Props) {
    const isAdmin = useSelector(selectIsAdmin);
    const rankings = useSelector(selectApiRankings);
    const { activeUser } = useContext(AppContext);
    const dispatch = useDispatch();


    const [boxCss, itemCss] = useMemo(() => {
        const title = status.title;
        return [dragulaCssName(title, true), dragulaCssName(title, false)];
    }, [status]);

    const transparentBlue = "#0000FF60";
    const transparentRed = "#FF000060";

    const [{ canDrop, isOver }, drop] = useDrop(() => ({
        accept: 'RpaProjects',
        // A abbreviated check to see if the project passes basic requirements to move. This will be called every pixel the mouse moves so it needs to be fast.
        /** @param {{ record: ProjectCommonProcessed, ID: string, statusId: string, stageId?: string, progress: number }} item */
        canDrop: (item: DropBoxItem, _monitor) => {
            if(isSaving || !isAdmin) {
                return false;
            }

            const errors = validateMove(item.record, item.statusId, status.id, item.progress, isAdmin);

            return !errors;
        },
        /** @param item */
        drop: async (item: DropBoxItem, _monitor) => {
            const statusChanged = item.statusId !== status.id;
            const incomingRank = rankings.find(x => x.project_id === item.record.ID) ?? { project_id: item.record.ID, rank: item.idx ?? getNextRanking(rankings) };
            const presentRank = rankings.find(x => x.project_id === project.ID)?? { project_id: project.ID, rank: idx };

            const rankChanged = incomingRank.rank !== presentRank.rank;

            // Do nothing if dropped back into it's own drop zone.
            if (!statusChanged && !rankChanged) {
                if(incomingRank.project_id !== presentRank.project_id) {
                    console.error('Ranking issue, two different projects have the same ranking: ' + presentRank.project_id + " and " + incomingRank.project_id);
                }
                return;
            }

            // Reminder: this is only a move *to* Under Evaluation, so any logic that is specific to another status is not required here.
            if (statusChanged) {
                const record = item.record;
                const updater = new UpdateHandler<AllProjectProccessed>(record);

                const output = { comments: '' }; 
                const canceled = await moveDroppedProjectToStatus(isAdmin, record, status, undefined, item.progress, updater, output);
                if(canceled) {
                    return;
                }

                if (output.comments) {
                    const prevComments = parseSafe(record.comments_history, []);
                    const newComments = [{ date: new Date(), comment: output.comments, user: !activeUser?.email ? "invalid_user" : activeUser.email }, ...prevComments];
                    updater.add('comments_history', JSON.stringify(newComments));
                }

                await ApiUpdater.update(record, updater);
            }

            if (rankChanged) {
                console.log('Updating: ', incomingRank, 'over', presentRank);
                updateRanking({ project_id: item.record.ID, rank: presentRank.rank });
            }
            // !record.status is also treated as "Under Eval". When moving *from* under eval, we want
        },
        // Props to collect to use in the below JSX.
        collect: (monitor) => ({
            isOver: monitor.isOver({ shallow: true }),
            canDrop: monitor.canDrop()
        })
    }), [activeUser?.ID, status, rankings, idx, isSaving, isAdmin]);

    return (
        <div ref={drop} style={{ backgroundColor: isOver && !canDrop ? transparentRed : isOver && canDrop ? transparentBlue : 'inherit' }}>
            <ProjectCard key={project.ID} project={project} clsName={itemCss} status={status} stage={null} idx={idx} />
        </div>
    );
}

BoxContainerRanked.propTypes = {
    project: PropTypes.object.isRequired,
    status: PropTypes.object.isRequired,
    stage: PropTypes.object,
    updateRanking: PropTypes.func.isRequired
}

export default BoxContainerRanked;
