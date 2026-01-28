import { Link, useNavigate } from 'react-router-dom';
import './Login.css';
import { useAdminAuth } from './context/AdminAuthContext';
import { useState } from 'react';
import Toast from '../components/Toast';


export default function Login(){

    const navigate = useNavigate();
    const { login } = useAdminAuth();
    const [toastMessage, setToastMessage] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    function showAlert(msg) {
        setToastMessage(msg);
        setShowToast(true);
    }

    async function onLogIn(e) {
        e.preventDefault();

        if (!email || !email.trim()) {
            showAlert('Email is required');
            return;
        }

        if (!password || !password.trim()) {
            showAlert('Password is required');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlert('Invalid Email');
            return;
        }

        try {
            await login(email, password);
            navigate('/admin');  // redirect after successful login
        } catch {
            showAlert('Invalid credentials');
        }
    }

    return (
        <div className='login'>
            <title>Admin Login - CohortBox</title>
            <div className='login-box'>
                <h1 className='login-head'>Admin Login</h1>
                <form className='login-form' onSubmit={onLogIn}>
                    <div className='inputs-container'>
                        <div className='email-container'>
                            <input type='text' placeholder='Email' className='login-input' id='email' value={email} onChange={(e) => setEmail(e.target.value)}/>
                            <p className='invalid-email' id='invalidEmail'>Invalid Email</p>
                        </div>
                        <div className='password-container'>
                            <input type='password' placeholder='Password' className='login-input' id='password' value={password} onChange={(e) => setPassword(e.target.value)} />
                            <p className='invalid-password' id='invalidPassword'>Invalid Password</p>
                        </div>
                        <Link to='/' className='link-to-signup'><button type='button' className='forgot-password-btn'>Forgot Password?</button></Link>
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