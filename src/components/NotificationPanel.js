import './NotificationPanel.css';
import { useEffect, useRef } from 'react';
import Notification from './Notification';

export default function NotificationPanel({notificationBtnRef, openNotification, setOpenNotification}){
    const panelRef = useRef(null)
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
            <Notification/>
        </div>
    )
}