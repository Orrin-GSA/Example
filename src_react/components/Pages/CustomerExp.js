import React, { useContext, useEffect } from 'react';
import { AppContext } from '../../App';

function CustomerExp() {
    const { setDevTools } = useContext(AppContext);

    // Setup dev tools. Even if none are needed, ensure to provide an empty JSX to clear out the previous page's tools.
    useEffect(() => {
        setDevTools(<></>);
    }, []);

  return (
    <div>
        <div className="card container">
            <div className="card-body text-center">
                <h4>Feedback Form</h4>
            </div>
            <div className="text-center border mt-2 mb-2">
                <form className='mt-2 mb-2'>
                    <input type="text"/>
                    <br/><br/>
                    <input type="text"/>
                    <br/><br/>
                    <input type="text"/>
                    <br/><br/>
                    <textarea className='w-50'/>
                </form>
            </div>
        </div>
    </div>
  )
}

export default CustomerExp