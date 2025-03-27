/**
 * Swimlane structure as well as sorting/filtering functionality
 */
import React, { useEffect, useState, useMemo, useContext, useRef } from 'react';
import { Dropdown, Card, Button, Spinner } from 'react-bootstrap';
import * as Icon from 'react-bootstrap-icons';
import PropTypes from 'prop-types';
import { is, to } from '../../../../../src_shared/TypeUtils';
import { AutomationsContext } from '../Automations';
import BoxContainerRanked from './BoxContainerRanked';
import { StatusType } from '../../../../../src_shared/AppConstants';
import { ApiProviderContext } from '../../../util/ApiDataProvider';

type Props = {
    status: StatusType;
}

function LaneContainerRanked({ status }: Props) {

    const { rankingHasChanges, rankingIsSaving, triggerRankingSave, updateRanking } = useContext(ApiProviderContext);

    // @ts-expect-error No typings yet.
    const { bucketedProjects, mappedRankings } = useContext(AutomationsContext);
    const containerClassName = useMemo(() => `lane_${status.title.replaceAll(" ", "_")}`, [status]);

    // TODO: Add updatingRankings as the first lookup, then mappedRankings
    const rankedProjects = useMemo(() => {
        const apiData = (bucketedProjects[status.id] ?? []).concat() as ProjectCommonProcessed[];

        const rankSort = (a: ProjectCommon, b: ProjectCommon) => {
            // TODO: throw an error here if the null case here is hit. DataUtils.ts -> fillRankings and the BoxContainerRanked useDrop should be ensuring that there is always a ranking for any object in Under Evaluation.
            const currRank = mappedRankings[a.ID]?.rank ?? 100000;
            const nextRank = mappedRankings[b.ID]?.rank ?? 100000;
            // Asc, 0 is top
            return (currRank - nextRank);
        };

        apiData.sort(rankSort);
        return apiData;
    }, [bucketedProjects, status, mappedRankings]);

    // TODO: Put a refresh ranking button in the top right corner.
    return (
        // Swim Lane
        <div className={`card my-2 mx-1 ${containerClassName}`} style={{ height: '100%' }}>
            <Card className={`containers-header`}>
                <div className='d-flex containers-header-name'>
                    <h3 className="card-title d-flex zero-margin w-100 text-break">{status.title}</h3>
                    {/* sorting dropdown */}
                    <Button variant='outline-secondary' title={ rankingIsSaving ? 'Saving' : rankingHasChanges ? 'Save Rankings' : 'All Rankings Saved' } onClick={(!rankingIsSaving && rankingHasChanges) ? triggerRankingSave : undefined}>
                        { rankingIsSaving && (<Spinner animation="border" role="status" size='sm'>
                                <span className="visually-hidden">Loading...</span>
                            </Spinner>) 
                        }
                        { !rankingIsSaving && (rankingHasChanges ? <Icon.Floppy2 /> : <Icon.Check2 />) }
                    </Button>
                </div>
            </Card>
            <div style={{ overflowY: 'scroll' }}>
                {/* Project cards */}
                <Card>
                    {/* Unlike regular Lane Container, we always want to have a single BoxContainer. (We might also need to do boxes by project?) */}
                    <div className='card-body'>
                        <div className="card-text dropzone">
                            {/* TODO: We need to add a empty dropbox here, to drop items that need to go to the top of the list */}
                            {rankedProjects.map((project, idx) => (
                                <BoxContainerRanked key={project.ID} status={status} project={project} updateRanking={updateRanking} idx={idx} isSaving={rankingIsSaving}></BoxContainerRanked>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    )
}

LaneContainerRanked.propTypes = {
    status: PropTypes.object.isRequired
}

export default LaneContainerRanked