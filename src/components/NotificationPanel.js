import './NotificationPanel.css';
import { useEffect, useRef, useState } from 'react';
import Notification from './Notification';
import { useAuth } from '../context/AuthContext';

export default function NotificationPanel({notificationBtnRef, openNotification, setOpenNotification}){
    const panelRef = useRef(null);
    const [notifications, setNotifications] = useState([]);
    const {accessToken} = useAuth();
    useEffect(() => {
        if(!accessToken) return;
        fetch('/api/return-notification', {
            method: 'GET',
            headers: {
                'authorization': `Bearer ${accessToken}`
            },
            credentials: 'include'
        }).then(res => {
            if(!res.ok) {
                throw new Error();
            }
            return res.json();
        }).then(data => {
            console.log(data)
            setNotifications(data.notifications);
        }).catch(err => {
            console.error(err)
        })
    }, [accessToken])

    useEffect(() => {
        function handleClickOutside(e) {
            if (
                panelRef.current &&
                !panelRef.current.contains(e.target) &&
                notificationBtnRef.current &&
                !notificationBtnRef.current.contains(e.target)
            ) {
                setOpenNotification(false)
            }
        }

        if (openNotification) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [openNotification])

    return (
        <div ref={panelRef} className='np-container'>
            <h1>NOTIFICATIONS</h1>
            <div className='notifications-container'>
                {
                    notifications.map((not, index) => (
                        <Notification notification={not} setNotifications={setNotifications} key={index}/>
                    ))
                }
            </div>
        </div>
    )
}