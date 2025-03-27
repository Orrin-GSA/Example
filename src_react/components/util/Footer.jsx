import React, { useDispatch, useSelector } from 'react-redux';
import { selectIsAdmin, setIsAdmin } from './UserSettingsSlice';
import { isDevelopment } from '../../../src_shared/AppConfig';

function Footer() {
    const dispatch = useDispatch();
    const isAdmin = useSelector(selectIsAdmin);

    return (
        <footer className="text-center text-lg-start bg-body-tertiary text-muted footer fixed-bottom">
            {isDevelopment &&
                <button className="btn btn-secondary d-flex mx-3" onClick={() => { dispatch(setIsAdmin(!isAdmin)) }}>
                    Turn Admin {isAdmin ? 'Off' : 'On'}
                </button>
            }

        </footer>
    )
}

export default Footer