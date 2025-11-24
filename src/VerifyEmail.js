import './VerifyEmail.css';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Toast from './components/Toast';

export default function VerifyEmail(){
    const [code, setCode] = useState('')
    const [message, setMessage] = useState("Verifying...");
    const [cooldown, setCooldown] = useState(60);
    const [canResend, setCanResend] = useState(false);
    const [toastMsg, setToastMsg] = useState('');
    const [showToast, setShowToast] = useState(false);

    function showAlert(msg){
        setToastMsg(msg);
        setShowToast(true);
    }

    const navigate = useNavigate();

    useEffect(() => {
        if(!code) return;
        if(code.length === 6){
            fetch(`/api/verify/${code}`)
            .then(res => res.json())
            .then(data => {
                if(data.verified){
                    navigate('/');
                }
            })
            .catch(() => showAlert('Something went Wrong!'));
        }
    }, [code]);

    async function handleResend() {
    if (!canResend) return;

    const res = await fetch('/api/update-verification-token', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email })   // adjust based on your state
    });

    const data = await res.json();

    if (data.codeSent) {
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


    return (
        <div className='verify-email-wrapper'>
            <div className='verify-email-container'>
                <p className='verify-email-p'>Check your Email for a verification code & enter it below</p>
                <input className='verify-email-input' value={code} onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ""); // only digits
                        if (value.length <= 6) setCode(value);
                    }} 
                    maxLength={6} 
                    inputMode='numeric'
                />
            </div>
            <Toast
                message={toastMsg}
                show={showToast}
                onClose={() => setShowToast(false)}
            />
        </div>
    )
}