import { useState } from 'react';
import './MobilePage.css';
import {useAuth} from './context/AuthContext';
import Login from './login.js';

export default function MobilePage() {

    const {accessToken} = useAuth();
    const [loggedIn, setLoggedIn] = useState(false);

    useEffect(() => {
        if (accessToken) {
            setLoggedIn(true);
        }
    }, [accessToken]);


    return (
        loggedIn ? (
            <div className="mobile-page-container">
                <h1>Welcome to CohortBox!</h1>
            </div>
        ) : (
            <Login />
        )
    );
}
