import React, { useContext, useEffect } from 'react';
import { AppContext } from '../../App';

function ProcessOwner() {
    const { setDevTools } = useContext(AppContext);

    // Setup dev tools. Even if none are needed, ensure to provide an empty JSX to clear out the previous page's tools.
    useEffect(() => {
        setDevTools(<></>);
    }, []);
  return (
    <div>ProcessOwner</div>
  )
}

export default ProcessOwner