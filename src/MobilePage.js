import { useState, useEffect } from 'react';
import './MobilePage.css';
import { useAuth } from './context/AuthContext';
import Login from './Login.js';
import HomeNav from './components/HomeNav';
import { useNavigate } from 'react-router-dom';
import useHomeChat from './hooks/useHomeChat.js';
import ChatBox from './components/ChatBox.js';
import MobilePagePopup from './components/MobilePagePopup.js';

export default function MobilePage() {

    const {
        loading,
        accessToken,

        paramChatId,
        focusMessageId,
        clearFocus,

        messages,
        setMessages,

        chats,
        setChats,

        users,
        setUsers,

        typingUsers,

        selectedChat,
        setSelectedChat,

        showLiveChat,
        setShowLiveChat,

        userChats,
        setUserChats,

        isNewMessage,
        setIsNewMessage,

        newMessageChatIds,
        setNewMessageChatIds,
    } = useHomeChat();

    const [loggedIn, setLoggedIn] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (accessToken) {
            setLoggedIn(true);
        } else {
            setLoggedIn(false);
        }
    }, [accessToken]);

    return (
        <div className='mobile-page-container'>
            {
                initialLoad && (
                    <MobilePagePopup setSelfState={setInitialLoad}/>
                )
            }
            {!loggedIn ? <Login />
                : (
                    <div className="mobile-page-body">
                        {!selectedChat && (
                            <HomeNav users={users} chats={chats} setChats={setChats} selectedChat={selectedChat} setSelectedChat={setSelectedChat} setUsers={setUsers} isMobile={true} />
                        )}
                        {
                            selectedChat && (
                                <ChatBox
                                    setChats={setChats}
                                    paramChatId={paramChatId}
                                    selectedChat={selectedChat}
                                    setSelectedChat={setSelectedChat}
                                    messages={messages}
                                    setMessages={setMessages}
                                    typingUsers={typingUsers}
                                    setShowLiveChat={setShowLiveChat}
                                    showLiveChat={showLiveChat}
                                    focusMessageId={focusMessageId}
                                    clearFocus={clearFocus}
                                />
                            )
                        }
                    </div>
                )
            }
        </div>
    );
}
