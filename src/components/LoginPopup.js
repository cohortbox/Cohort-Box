import './LoginPopup.css';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import cobooPresentation from '../images/coboo-presenting.png';
import Toast from './Toast';

export default function LoginPopup({ setSelfState }) {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [toastMessage, setToastMessage] = useState("");
    const [showToast, setShowToast] = useState(false);

    function showAlert(msg) {
        setToastMessage(msg);
        setShowToast(true);
    }

    function onLogIn(e) {
        e.preventDefault()

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (email === "") {
            emailInput.style.borderColor = 'red'
            return;
        }
        if (password === "") {
            passwordInput.style.borderColor = 'red'
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(email)) {
            emailInput.style.borderColor = 'red'
            document.getElementById('invalidEmail').style.display = 'block'
            return;
        }
        console.log('testing')
        fetch(`/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password
            }),
            credentials: 'include'
        }).then(response => {
            if (response.status === 401) {
                showAlert("Invalid Email or Password.");
                throw new Error("Invalid Email or Password.");
            }

            if (response.status === 404) {
                showAlert('No Account found for this Email!');
                throw new Error("Invalid Email or Password.");
            }

            if (!response.ok) {
                showAlert("Something went wrong. Try again.");
                throw new Error("Login Failed!");
            }
            return response.json();
        }).then(data => {
            console.log(data)
            login(data.accessToken);
            navigate('/', {
                state: { justLoggedIn: true },
            });
        }).catch(err => {
            console.error(err);
        })
    }

    return (
        <div className='login-popup-container'>
            <div className='login-popup-wrapper'>
                <img src={cobooPresentation}/>
                <div className='login-popup-body'>
                    <div className='heading-container'>
                        <h1>Please <span className='green'>Login</span> to get full experience!</h1>
                    </div>
                    <a href='/login'>
                        Login
                    </a>
                    <p>Need a new account? <a href='/signup'>Sign Up</a></p>
                </div>
            </div>
            <div className='login-popup-bg' onClick={() => setSelfState(false)}></div>
            <Toast
                message={toastMessage}
                show={showToast}
                onClose={() => setShowToast(false)}
            />
        </div>
    )
}