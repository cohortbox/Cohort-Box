// src/Home.jsx
import './Home.css'
import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext'
import { useSocket, useSocketEvent } from './context/SocketContext';
import NavBar from './components/NavBar';
import HomeNav from './components/HomeNav';
import ChatBox from './components/ChatBox';
import Posts from './components/Posts'
import { useParams } from 'react-router-dom';

function Home() {
  const paramChatId = useParams().chatId;
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const { user, accessToken, loading } = useAuth();

  const { markMessagesRead, chatOpened } = useSocket();

  useEffect(() => {
    if (!accessToken || !paramChatId || loading) return;

    fetch(`/api/return-chats/${paramChatId}`, {
      method: 'GET',
      headers: { 'authorization': `Bearer ${accessToken}` }
    })
      .then(response => {
        if (!response.ok) {
          console.log(response);
          throw new Error('Request Failes!');
        }
        return response.json();
      })
      .then(data => setSelectedChat(data.chat))
      .catch(console.error);
  }, [paramChatId, accessToken, loading]);

  useEffect(() => {
    if (!accessToken || loading) return;

    fetch(`/api/return-chats`, {
      method: 'GET',
      headers: { 'authorization': `Bearer ${accessToken}` },
      credentials: 'include'
    })
      .then(response => {
        if (!response.ok) throw new Error('Request Failed with Status: ' + response.status);
        return response.json();
      })
      .then(data => setChats(data.chats))
      .catch(console.error);
  }, [accessToken, loading]);

  useEffect(() => {
    if (!accessToken || loading) return;
    
    fetch('/api/return-users', {
      method: 'GET',
      headers: { 'authorization': `Bearer ${accessToken}` }
    })
      .then(r => { if (!r.ok) throw new Error('Request failed: ' + r.status); return r.json(); })
      .then(data => {
        console.log(data.users)
        setUsers(data.users || []);
      })
      .catch(console.error);
  }, [accessToken, loading]);

  const updateReactions = (existing = [], data) => {
    const filtered = existing.filter(r => String(r.userId) !== String(data.userId));
    return [...filtered, { userId: data.userId, emoji: data.emoji }];
  };

  useSocketEvent('participantRemoved', ({userId, chatId, msg}) => {
    setChats(prev => prev.map(chat => {
      if (chat._id === chatId) {
        const updatedChat = {
          ...chat,
          participants: chat.participants.filter(p => p._id !== userId),
        };
        return updatedChat;
      }
      return chat;
    }));
    if(selectedChat._id === chatId){
      setMessages(prev => [...prev, msg]);
    }
  })

  useSocketEvent("returnMessages", (msgs) => {
    setMessages(msgs);
  }, []);

  useSocketEvent("message", (msg) => {
    const isForSelected = selectedChat && String(msg.chatId) === String(selectedChat._id);

    if (isForSelected) {
      if (user?.id && String(msg.from) !== String(user.id)) {
        markMessagesRead({ chatId: selectedChat._id, msgId: msg._id, to: msg.from });
      }
      setMessages(prev => [...prev, msg]);
    } else {
      setChats(prev =>
        prev.map(chat =>
          String(chat._id) === String(msg.chatId)
            ? { ...chat, noOfUnreadMessages: (chat.noOfUnreadMessages || 0) + 1 }
            : chat
        )
      );
    }
  }, [selectedChat?._id, user?.id]);

  useSocketEvent("messageSent", (serverMsg) => {
    setMessages(prev => [...prev, serverMsg]);
  }, []);

  useSocketEvent("messagesRead", ({ chatId, reader }) => {
    if (!selectedChat || String(selectedChat._id) !== String(chatId)) return;
    setMessages(prev =>
      prev.map(m => (String(m.from) !== String(reader) ? { ...m, read: true } : m))
    );
  }, [selectedChat?._id]);

  useSocketEvent("reaction", ({ emoji, msgId, userId }) => {
    setMessages(prev =>
      prev.map(msg =>
        String(msg._id) === String(msgId)
          ? { ...msg, reactions: updateReactions(msg.reactions, { emoji, msgId, userId }) }
          : msg
      )
    );
  }, []);

  useSocketEvent("deleteMessage", (serverMsg) => {
    if (!selectedChat || String(serverMsg.chatId) !== String(selectedChat._id)) return;
    setMessages(prev => prev.filter(msg => String(msg._id) !== String(serverMsg._id)));
  }, [selectedChat?._id]);

  useSocketEvent("deleteMessages", (chatId) => {
    if (!selectedChat || String(chatId) !== String(selectedChat._id)) return;
    setMessages([]);
  }, [selectedChat?._id]);

  useSocketEvent("typing", (data) => {
    if (!selectedChat || String(data.chatId) !== String(selectedChat._id)) return;

    if (data.typing) {
      setTypingUsers(prev => {
        if (prev.find(u => String(u.userId) === String(data.userId))) return prev;
        return [...prev, { userId: data.userId, username: data.username }];
      });
    } else {
      setTypingUsers(prev => prev.filter(u => String(u.userId) !== String(data.userId)));
    }
  }, [selectedChat?._id]);

  useEffect(() => {
    if (!selectedChat) return;

    setChats(prev =>
      prev.map(chat =>
        String(chat._id) === String(selectedChat._id)
          ? { ...chat, noOfUnreadMessages: 0 }
          : chat
      )
    );

    chatOpened(selectedChat._id);
  }, [selectedChat, chatOpened]);

  return (
    <div className="home">
      <title>Home | CohortBox</title>
      <NavBar selectedChat={selectedChat}/>
      <HomeNav users={users} chats={chats} selectedChat={selectedChat} setSelectedChat={setSelectedChat} />
      {selectedChat ? (
        <ChatBox
          paramChatId={paramChatId}
          selectedChat={selectedChat}
          setSelectedChat={setSelectedChat}
          messages={messages}
          setMessages={setMessages}
          typingUsers={typingUsers}
        />
      ) : (
        <Posts />
      )}
    </div>
  );
}

export default Home;
