import SyncLoader from "react-spinners/SyncLoader";
import { useSelector } from 'react-redux';
import {
    selectLoaded
} from './LoadingSlice';
import { selectIsDark } from './UserSettingsSlice';
import PropTypes from 'prop-types';
import React from 'react';

function LoadingScreen({ title }) {
    const isLoaded = useSelector(selectLoaded);
    const isDark = useSelector(selectIsDark);

    return (
        <>
            {
                (!isLoaded &&
                    <div className="loader-overlay">
                        <div className="popup-spinner">
                            <div className="container">
                                <div className="text-center">
                                    <div className="text-center d-flex">
                                        <div className="sweet-loading w-100">
                                            <h3 className='w-100'>{title}</h3>
                                            <SyncLoader
                                                color={isDark ? "#ffffff" : "#000000"}
                                                loading={true}
                                                size={5}
                                                aria-label="Loading Spinner"
                                                data-testid="loader"
                                                loader="SyncLoader"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>)
            }
        </>
    )
}

LoadingScreen.propTypes = {
    title: PropTypes.string.isRequired
}

export default LoadingScreen
