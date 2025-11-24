import './login.css'
import { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import Toast from './components/Toast';

function Login(){

    const navigate = useNavigate();
    const { login } = useAuth();
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
            if (response.status === 401 || response.status === 404) {
                showAlert("Invalid Email or Password.");
                throw new Error("Invalid Email or Password.");
            }

            if (!response.ok) {
                showAlert("Something went wrong. Try again.");
                throw new Error("Login Failed!");
            }
            return response.json();
        }).then(data => {
            login(data.accessToken);
            navigate('/')
        }).catch(err => {
            console.error(err);
        })
    }

    return(
        <div className='login'>
            <title>Login - CohortBox</title>
            <div className='login-box'>
                <h1 className='login-head'>Login</h1>
                <form className='login-form' onSubmit={onLogIn}>
                    <div className='inputs-container'>
                        <div className='email-container'>
                            <input type='text' placeholder='Email' className='login-input' id='email'/>
                            <p className='invalid-email' id='invalidEmail'>Invalid Email</p>
                        </div>
                        <div className='password-container'>
                            <input type='password' placeholder='Password' className='login-input' id='password'/>
                            <p className='invalid-password' id='invalidPassword'>Invalid Password</p>
                        </div>
                        <button type='button' className='forgot-password-btn'>Forgot Password?</button>
                    </div>
                    <button type='submit' className='login-btn' typeof='submit'>Login</button>
                    <Link to='/signup' className='link-to-signup'>Need a new account!</Link>
                </form>
                
            </div>
            <Toast
                message={toastMessage}
                show={showToast}
                onClose={() => setShowToast(false)}
            />
        </div>
    )
}

export default Login;