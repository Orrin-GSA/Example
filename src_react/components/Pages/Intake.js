import React, { useContext, useEffect } from 'react';
import IdeaSlice from '../util/IdeaSlice';
import { AppContext } from '../../App';

function Intake() {
    const { setDevTools } = useContext(AppContext);

    // Setup dev tools. Even if none are needed, ensure to provide an empty JSX to clear out the previous page's tools.
    useEffect(() => {
        setDevTools(<></>);
    }, []);
  return (
    <div>
      <h3 className='text-center'>Submitted Ideas</h3>
      <br />
      <div className="card">
          <IdeaSlice />
          <IdeaSlice />
          <IdeaSlice />
      </div>
    </div>
  )
}

export default Intake