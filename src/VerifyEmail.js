import './VerifyEmail.css';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function VerifyEmail(){
    const { token } = useParams();
    const [message, setMessage] = useState("Verifying...");
    const navigate = useNavigate();

    useEffect(() => {
        fetch(`/api/verify/${token}`)
        .then(res => res.json())
        .then(data => {
            setMessage(data.message);
            if(data.verified){
                navigate('/');
            }
        })
        .catch(() => setMessage("Verification failed."));
    }, [token]);

    return (
        <div className='verify-email-container'>
            <div className='spinner'>
            </div>
        </div>
    )
}