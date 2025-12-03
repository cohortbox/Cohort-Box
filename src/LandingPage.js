import './LandingPage.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './images/logo.png'

export default function LandingPage(){
    const navigate = useNavigate();
    const [userNum, setUserNum] = useState(0)
    return (
        <div className='lp-container'>
            <div className='lp-welcome-container'>
                <div className='lp-logo-container'>
                    <img src={logo}/>
                </div>
                <h1><span>👋</span>Welcome to CohortBox!</h1>
                <button onClick={() => navigate('/signup')}>SignUp</button>
                <p><span>{userNum}</span> users have already joined us!</p>
            </div>
        </div>
    )
}