import './TextMessage.css';
import MessageMenu from './MessageMenu.js';
import ReactionMenu from './ReactMenu.js';
import ReactionsMenu from './ReactionsMenu.js';
import { useAuth } from '../context/AuthContext.js';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

export default function TextMessage({ newSender, setIsReply, setRepliedTo, msg, sender, setMessages, selectedChat, setLoginPopup = () => {} }) {
    const { user } = useAuth();
    const [pop, setPop] = useState(false);
    const senderColors = ['#c76060', '#c79569', '#c7c569', '#6ec769', '#69c2c7', '#6974c7', '#9769c7', '#c769bf']

    useEffect(() => {
        const now = Date.now();
        const msgTime = new Date(msg.timestamp).getTime();

        // animate only if message is fresh (< 3s old)
        if (now - msgTime > 100) return;

        setPop(true);
        const t = setTimeout(() => setPop(false), 220);
        return () => clearTimeout(t);
    }, [msg.timestamp]);

    function formatTime(ts) {
        const date = new Date(ts);
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    const senderIndex = sender
        ? selectedChat.participants.findIndex(p => p._id === sender._id)
        : 0;

    return (
        <div className={String(msg.from._id) === String(user?.id) ? "my-msg-container" : "other-msg-container"}>
            {String(msg.from._id) !== String(user?.id) && newSender &&
                <Link style={{ textDecoration: 'none' }} to={`/profile/${sender._id}`}>
                    <div className='msg-user-dp-container'>
                        <img className='msg-user-dp' src={msg.from.dp} />
                    </div>
                </Link>
            }
            <div className={`msg-menu-btns-container ${newSender ? 'right' : ''}`}>
                <div className={msg.from._id === user?.id ? `my-msg ${msg?.reactions?.length > 0 ? 'has-reactions' : ''} ${pop ? 'msg-pop' : ''}` : `other-msg ${msg?.reactions?.length > 0 ? 'has-reactions' : ''} ${newSender ? 'left' : ''} ${pop ? 'msg-pop' : ''}`}>
                    {msg.from._id !== user?.id && sender && newSender && (
                        <Link style={{ textDecoration: 'none' }} to={`/profile/${sender._id}`}><h4 className='sender-name' style={{ color: `${senderColors[senderIndex] ? senderColors[senderIndex] : '#c5cad3'}` }}>{sender.username}</h4></Link>
                    )}
                    {msg.isReply && msg.repliedTo && (
                        <div className="reply-msg-container">
                            <h1>
                                {msg.repliedTo.from?.firstName || ''}{' '}
                                {msg.repliedTo.from?.lastName || ''}
                            </h1>

                            <p>
                                {msg.repliedTo.type === 'text' && msg.repliedTo.message}

                                {msg.repliedTo.type === 'media' &&
                                    `${msg.repliedTo.media?.length || 0} media`}

                                {msg.repliedTo.type === 'audio' && 'Audio Message'}
                            </p>
                        </div>
                    )}
                    <span className="msg-text">{msg.message}</span>
                    <span className="msg-time">{formatTime(msg.timestamp)}</span>
                    {msg.reactions?.length > 0 && (
                        <div className={String(msg.from._id) === String(user?.id) ? "my-reactions" : "other-reactions"}>
                            <ReactionsMenu reactions={msg.reactions} msgId={msg._id} selectedChat={selectedChat} setLoginPopup={setLoginPopup} />
                        </div>
                    )}
                </div>
                <MessageMenu setIsReply={setIsReply} setRepliedTo={setRepliedTo} msg={msg} setMessages={setMessages} />
                <ReactionMenu msg={msg} setLoginPopup={setLoginPopup} />
            </div>
        </div>
    )
}