import './NotificationPanel.css';
import { useEffect, useRef, useState } from 'react';
import Notification from './Notification';
import { useAuth } from '../context/AuthContext';
import LoginFiller from './LoginFiller';

export default function NotificationPanel({notificationBtnRef, openNotification, setOpenNotification, setNotifications, notifications}){
    const {user} = useAuth();
    const panelRef = useRef(null);

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
                { notifications.length > 0 && 
                    notifications.map((not, index) => (
                        <Notification notification={not} setNotifications={setNotifications} key={index}/>
                    ))
                }
                { notifications.length === 0 && user &&
                    (
                        <p className='no-notifications'>There are no notifications for you!</p>
                    )
                }
                {
                    !user && (
                        <LoginFiller message='To see Notifications'/>
                    )
                }
            </div>
        </div>
    )
}