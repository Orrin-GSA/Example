import React, { useState, useEffect } from 'react';
import SyncLoader from "react-spinners/SyncLoader";
function LoadingScreen({ title, isLoading }) {
    let boolCounter = isLoading

    return (
        <>
            {
                (boolCounter) ?
                    <div>
                        <div className="loader-overlay">
                            <div className="popup-spinner">
                                <div className="container">
                                    <div className="text-center">
                                        <div className="text-center d-flex">
                                            <div className="sweet-loading w-100">
                                                <h3 className='w-100'>{title}</h3>
                                                <SyncLoader
                                                    color="#808080"
                                                    // color={localStorage.getItem("color_mode") == "dark" ? "#ffffff" : "#000000"}
                                                    loading={true}
                                                    size={10}
                                                    aria-label="Loading Spinner"
                                                    data-testid="loader"
                                                    loader="SyncLoader"
                                                />
                                            </div>
                                            {/* Testing redux: {boolCounter.toString()}
                        <button onClick={() => toTrue()}>to true</button>
                        <button onClick={() => toFalse()}>to false</button> */}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    :
                    <div>
                    </div>
            }
        </>
    )
}

export default LoadingScreen