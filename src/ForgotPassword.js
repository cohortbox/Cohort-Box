import { useEffect, useState } from 'react';
import './ForgotPassword.css';
import Toast from './components/Toast';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword(){
    const [uiState, setUiState] = useState('initial');
    const [email, setEmail] = useState('');
    const [passCode, setPassCode] = useState('');
    const [cooldown, setCooldown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [toastMsg, setToastMsg] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [newPass, setNewPass] = useState('');
    const [newAgainPass, setNewAgainPass] = useState('');
    const [resetToken, setResetToken] = useState(null);
    const navigate = useNavigate();

    function showAlert(msg){
        setToastMsg(msg);
        setShowToast(true);
    }

    useEffect(() => {
        if(!passCode) return;
        if (uiState !== 'userFound') return;
        if(passCode.length === 6){
            fetch(`/api/forgot-password/verify-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: email.trim(), passwordChangeCode: passCode })
            })
            .then(res => {
                if(!res.ok){
                    throw new Error();
                }
                return res.json()
            })
            .then(data => {
                if(data.verified && data.resetToken){
                    setResetToken(data.resetToken);
                    setUiState('changePassword')
                }
            })
            .catch(() => showAlert('Invalid or Expired Token'));
        }
    }, [passCode]);

    async function findAccount() {
        if (!email.trim()) return showAlert('Enter a valid email');

        await fetch('/api/forgot-password/update-password-change-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        setCooldown(60);
        setCanResend(false);
        setUiState('userFound');
    }

    async function handleResend() {
        if (!canResend) return;

        const res = await fetch('/api/forgot-password/update-password-change-code', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        if (!res.ok) {
            return showAlert('Account not found');
        }

        const data = await res.json();

        if (data.success) {
            // restart timer
            setCanResend(false);
            setCooldown(60);

            const interval = setInterval(() => {
                setCooldown(prev => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        setCanResend(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
    }

    async function handlePasswordChange(){
         if(!newPass || !newPass.trim()) {
            document.getElementById('newPass').style.borderColor = 'red';
            return;
        }
        if(!newAgainPass || !newAgainPass.trim()) {
            document.getElementById('newAgainPass').style.borderColor = 'red';
            return;
        }
        if(newPass.length < 8 || newAgainPass.length < 8) return;
        if(newPass !== newAgainPass) {
            document.getElementById('newPass').style.borderColor = 'red';
            document.getElementById('newAgainPass').style.borderColor = 'red';
            document.getElementById('notMatch').style.display = 'block';
            return;
        }

        const res = await fetch('/api/forgot-password/reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                password: newPass,
                resetToken,
            })
        });
        if (res.ok) {
            navigate('/login')
        }

    }

    return (
        <div className='forgot-password-container'>
            {
                uiState === 'initial' && (
                    <div className='initial-state-container'>
                        <p>Please Enter your accont Email:</p>
                        <input id='email' value={email} onChange={(e) => setEmail(e.target.value)} placeholder='Email'/>
                        <p id='notFound' style={{color: 'red', display: 'none'}}>Couldn't find an account for this email.</p>
                        <button onClick={findAccount}>Continue</button>
                    </div>
                )
            }
            {
                uiState === 'userFound' && (
                    <div className='uesr-found-state-container'>
                        <p className='verify-email-p'>Check your Email for a verification code & enter it below</p>
                        <input className='verify-email-input' value={passCode} onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, ""); // only digits
                            if (value.length <= 6) setPassCode(value);
                        }}
                            maxLength={6}
                            inputMode='numeric'
                        />
                        <button
                            className="resend-btn"
                            onClick={handleResend}
                            disabled={!canResend}
                        >
                            {canResend ? "Resend Code" : `Resend in ${cooldown}s`}
                        </button>
                    </div>
                )
            }
            {
                uiState === 'changePassword' && (
                    <div className='change-password-state-container'>
                        <input type='password' id='newPass' value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder='New Password'/>
                        <input type='password' id='newAgainPass' value={newAgainPass} onChange={(e) => setNewAgainPass(e.target.value)} placeholder='Re-Type New Password'/>
                        <p>Password should be longer than 8 Characters</p>
                        <p id='notMatch' style={{color: 'red', display: 'none', fontSize: '0.7rem'}}>Passwords Don't match</p>
                        <button onClick={handlePasswordChange}>Change</button>
                    </div>
                )
            }
            <Toast
                message={toastMsg}
                show={showToast}
                onClose={() => setShowToast(false)}
            />
        </div>
    )
}