import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import NavBar from './components/NavBar';
import './Reports.css';
import Toast from '../components/Toast';
import ChatInfoMediaView from '../components/ChatInfoMediaView';

export default function Reports(){

    const [toastMessage, setToastMessage] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [reports, setReports] = useState([]);
    const [showMediaView, setShowMediaView] = useState(false);
    const [index, setIndex] = useState(0);
    const [items, setItems] = useState([]);
    
    function showAlert(msg) {
        setToastMessage(msg);
        setShowToast(true);
    }

    const makeItemsForChatInfoMediaView = (msg) =>
      (msg.media || []).map((m, idx) => ({
        key: `${msg._id}-${idx}`,
        url: m.url,
        type: m.type,
        messageId: msg._id,
        from: msg.from,
        timestamp: msg.timestamp
      }))

    useEffect(() => {
        async function fetchReports() {
            try {
                const response = await fetch('/api/admin/reports', {
                    method: 'GET',
                    credentials: 'include', // Send HttpOnly cookie
                });

                if (!response.ok) {
                    throw new Error('Request Failed');
                }

                const data = await response.json();
                console.log(data.reports);
                setReports(data.reports);
            } catch (err) {
                showAlert("Couldn't fetch Reports");
                console.error(err);
            }
        }

        fetchReports();
    }, []);

    async function reportBanAction(e, reportId){
        try{
            const res = await fetch(`/api/admin/report/action/${reportId}/del`, {
                method: 'POST',
            });
            if(!res.ok){
                throw new Error();
            }
            const data = await res.json();
            if(data.success){
                setReports(prev => prev.filter(r => r._id !== reportId))
            }
        } catch (err) {
            console.error(err);
        }
    }    

    async function reportWarnAction(e, reportId){
        try{
            const res = await fetch(`/api/admin/report/action/${reportId}/warn`, {
                method: 'POST',
            });
            if(!res.ok){
                throw new Error();
            }
            const data = await res.json();
            if(data.success){
                setReports(prev => prev.filter(r => r._id !== reportId))
            }
        } catch (err) {
            console.error(err);
        }
    }    

    async function dismissReport(e, reportId){
        try{
            const res = await fetch(`/api/admin/report/action/${reportId}/dismiss`, {
                method: 'POST',
            });
            if(!res.ok){
                throw new Error();
            }
            const data = await res.json();
            if(data.success){
                setReports(prev => prev.filter(r => r._id !== reportId))
            }
        } catch (err) {
            console.error(err);
        }
    }    

    return (
        <div className='admin-reports'>
            <NavBar />
            <div className='admin-reports-container'>
                <h1>Reports</h1>
                {reports.length === 0 ? (
                    <p>No reports found</p>
                ) : (
                    reports.reverse().map((r, index) => (
                        <div key={index} className='report-container'>
                            <h1><span className='text-green'>{r.targetType}</span> Report</h1>
                            <h1>Reason: {r.reason}</h1>
                            <h1>From: <Link to={'/profile/' + r.fromUser._id} style={{textDecoration: 'none', color: '#c5cad3'}}>{r.fromUser.username} <span className='text-small'>{r.fromUser.firstName + ' ' + r.fromUser.lastName}</span></Link></h1>
                            {
                                r.targetType === 'Message' && (
                                    <div className='reported-container'>
                                        <h1>Message was in This Chat: <Link to={'/' + r.target.chatId._id} style={{textDecoration: 'none', color: '#c5cad3'}}>{r.target.chatId.chatName}</Link></h1>
                                        { r.target.type === 'media' && <h1>Reported Message:</h1> }
                                        {
                                            r.target.type === 'media' && (
                                                <div className='reported-message-media-container'>
                                                    {
                                                        r.target.media.map(((m, index) => (
                                                            <div key={index} className='reported-message-media' onClick={() =>{setIndex(index); setItems(makeItemsForChatInfoMediaView(r.target)); setShowMediaView(true)}}>
                                                                {
                                                                    m.type === 'image' && (
                                                                        <img src={m.url} alt='Media'/>
                                                                    )
                                                                }
                                                                {
                                                                    m.type === 'video' && (
                                                                        <video src={m.url} alt='Media'/>
                                                                    )
                                                                }
                                                                {
                                                                    m.type === 'audio' && (
                                                                        <audio src={m.url}/>
                                                                    )
                                                                }
                                                            </div>
                                                        )))
                                                    }
                                                </div>
                                            )
                                        }
                                        {
                                            r.target.message && (
                                                <h1>Message Text: {r.target.message}</h1>
                                            )
                                        }
                                        <div className='report-btns-container'>
                                            <button className='report-btn' onClick={(e) => reportBanAction(e, r._id)}>Delete Message</button>
                                            <button className='report-btn' onClick={(e) => reportWarnAction(e, r._id)}>Warn User</button>
                                            <button className='report-btn dismiss' onClick={(e) => dismissReport(e, r._id)}>Dismiss</button>
                                        </div>
                                    </div>
                                )
                            }

                            {
                                r.targetType === 'User' && (
                                    <div className='reported-container'>
                                        <h1>Reported User: <Link to={'/profile/' + r.target._id} style={{textDecoration: 'none', color: '#c5cad3'}}>{r.target.username} <span className='text-small'>{r.target.firstName + ' ' + r.target.lastName}</span></Link></h1>
                                        <h1>Reported User's Email: <span className='text-green'>{r.target.email}</span></h1>
                                        <div className='report-btns-container'>
                                            <button className='report-btn' onClick={(e) => reportBanAction(e, r._id)}>Ban User</button>
                                            <button className='report-btn' onClick={(e) => reportWarnAction(e, r._id)}>Warn User</button>
                                            <button className='report-btn dismiss' onClick={(e) => dismissReport(e, r._id)}>Dismiss</button>
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    ))
                )}
            </div>
            { showMediaView && <ChatInfoMediaView items={items} index={index} setShowMediaView={setShowMediaView} />}
            <Toast
                message={toastMessage}
                show={showToast}
                onClose={() => setShowToast(false)}
            />
        </div>
    )
}