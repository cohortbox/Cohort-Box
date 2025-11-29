import './Notification.css';
import sampleImg from '../images/sample.png';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import accept from '../images/check-gray.png';
import cancel from '../images/close-gray.png';
import Toast from './Toast'
import { useState } from 'react';

export default function Notification({notification, setNotifications}){
    const { user, accessToken } = useAuth();
    const { socket } = useSocket();
    const [toastMsg, setToastMsg] = useState('');
    const [showToast, setShowToast] = useState(false)

    function showAlert(msg){
        setToastMsg(msg);
        setShowToast(true)
    }

    const callApi = async (url, method, body = null) => {
        const res = await fetch(`${url}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${accessToken}`
            },
            credentials: 'include',
            body: body ? JSON.stringify(body) : null,
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            showAlert('Server failed!')
            throw new Error(err.error || `API failed: ${url}`);
        }

        return res.json();
    };

    const handleAccept = async (e) => {
        e.preventDefault();
        try {
            const result = await callApi(`/api/friends/accept/${notification.sender._id}`, 'POST');
            socket.emit('acceptFriendRequest', notification.sender._id);
            socket.emit('notification', result.notification)
            setNotifications(prev => prev.filter(currNotification => currNotification._id !== notification._id))
        } catch (err) {
            console.error(err);
        }
    };

    const handleReject = async (e) => {
        e.preventDefault();
        try {
            const result = await callApi(`/api/friends/reject/${notification.sender._id}`, 'POST');
            socket.emit('rejectFriendRequest', result);
            setNotifications(prev => prev.filter(currNotification => currNotification._id !== notification._id))
        } catch (err) {
            console.error(err);
        }
    };

    let message = '';
    if(notification.type === 'friend_request_received'){
        message = `${notification.sender.firstName + ' ' + notification.sender.lastName} sent you a Friend Request!`
    }else if(notification.type === 'friend_request_accepted') {
        message = `${notification.sender.firstName + ' ' + notification.sender.lastName} accepted your Friend Request!`
    }
    return (
        <div className='notification-container'>
            <img className='notification-img' src={sampleImg}/>
            <p className='notification-msg'>{message}</p>
            {
                notification.type === 'friend_request_received' &&
                (
                    <div className="nub-btn got-request-btn">
                        <div className="request-btns">
                            <button onClick={handleAccept}>
                                <img className="request-btn-img" src={accept} alt="accept" />
                            </button>
                            <button onClick={handleReject}>
                                <img className="request-btn-img" src={cancel} alt="reject" />
                            </button>
                        </div>
                    </div>
                )
            }
            <Toast message={toastMsg} show={showToast} onClose={() => setShowToast(false)} />
        </div>
    )
}