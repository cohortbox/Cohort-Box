import { useState, useEffect } from 'react';
import './MobilePage.css';
import {useAuth} from './context/AuthContext';
import Login from './Login.js';
import HomeNav from './components/HomeNav';
import { useNavigate } from 'react-router-dom';

export default function MobilePage() {

    const {accessToken, loading} = useAuth();
    const [loggedIn, setLoggedIn] = useState(false);
    const [chats, setChats] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (accessToken) {
            setLoggedIn(true);
        }else{
            setLoggedIn(false);
        }
    }, [accessToken]);

    useEffect(() => {
        if (!accessToken || loading) return;

        fetch(`/api/chats`, {
            method: 'GET',
            headers: { 'authorization': `Bearer ${accessToken}` },
            credentials: 'include'
        })
            .then(response => {
                if (!response.ok) {
                    if (response.status === 404) {
                        setChats([]);
                        return;
                    }
                    throw new Error('Request Failed with Status: ' + response.status);
                }
                return response.json();
            })
            .then(data => setChats(data.chats))
            .catch(err => {
                console.error(err);
                navigate('/crash');
            });
    }, [accessToken, loading]);

    useEffect(() => {
        if (!accessToken || loading) return;

        fetch('/api/users', {
            method: 'GET',
            headers: { 'authorization': `Bearer ${accessToken}` }
        })
            .then(r => { if (!r.ok) throw new Error('Request failed: ' + r.status); return r.json(); })
            .then(data => {
                setUsers(data.users || []);
            })
            .catch(err => {
                console.error(err);
                navigate('/crash');
            });
    }, [accessToken, loading]);


    return (
        <div className='mobile-page-container'>
            {!loggedIn ? <Login />
                : (
                    <div className="mobile-page-body">
                        <HomeNav users={users} chats={chats} setChats={setChats} selectedChat={selectedChat} setSelectedChat={setSelectedChat} setUsers={setUsers} isMobile={true} />
                    </div>
                )
            }            
        </div>
    );
}
