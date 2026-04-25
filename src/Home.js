// src/Home.jsx
import './Home.css'
import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext'
import { useSocket, useSocketEvent } from './context/SocketContext';
import NavBar from './components/NavBar';
import HomeNav from './components/HomeNav';
import ChatBox from './components/ChatBox';
import Posts from './components/Posts'
import LiveChatView from './components/LiveChatCommentsView';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import LoadingScreen from './components/LoadingScreen';
import HomePopup from './components/HomePopup';
import LoginPopup from './components/LoginPopup';
import useHomeChat from './hooks/useHomeChat';

function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [initialLoad, setInitialLoad] = useState(true);
  const [hasLoggedIn, setHasLoggedIn] = useState(false);
  const [loginPopup, setLoginPopup] = useState(false);
  const location = useLocation();

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
    setTypingUsers,

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

  const { markMessagesRead, chatOpened } = useSocket();

  useEffect(() => {
    if (location.state?.justLoggedIn) {
      console.log("User just logged in!");

      setHasLoggedIn(true);

      window.history.replaceState({}, document.title);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => {
      setInitialLoad(false);
    }, 750)
  }, [setInitialLoad])

  if (loading) return null;
  
  return (
    <>
      {
        initialLoad ?
          <LoadingScreen /> :

          <div className="home">
            {hasLoggedIn && (
              <HomePopup setSelfState={setHasLoggedIn} />
            )}
            <title>Home | CohortBox</title>
            <NavBar selectedChat={selectedChat} setLoginPopup={setLoginPopup} />
            <HomeNav newMessageChatIds={newMessageChatIds} setNewMessageChatIds={setNewMessageChatIds} isNewMessage={isNewMessage} setIsNewMessage={setIsNewMessage} users={users} setUsers={setUsers} chats={chats} setChats={setChats} selectedChat={selectedChat} setSelectedChat={setSelectedChat} userChats={userChats} setUserChats={setUserChats} />
            {selectedChat ? (
              <div className='chat-box-live-chat-container'>
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
                  setLoginPopup={setLoginPopup}
                />
                {showLiveChat &&
                  <LiveChatView selectedChat={selectedChat} setShowLiveChat={setShowLiveChat} />
                }
              </div>
            ) : (
              <Posts />
            )}
          </div>
      }
      { loginPopup &&
        <LoginPopup setSelfState={setLoginPopup}/>
      }
    </>
  );
}

export default Home;
