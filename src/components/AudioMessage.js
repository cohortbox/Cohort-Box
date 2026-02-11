import { useAuth } from '../context/AuthContext.js';
import './AudioMessage.css';
import AudioPlayer from './AudioPlayer.js';
import MessageMenu from './MessageMenu.js';
import ReactionMenu from './ReactionMenu.js';

export default function AudioMessage({ newSender, setIsReply, setRepliedTo, msg, setMessages, sender, selectedChat, setClickedMsg }){
    const { user } = useAuth();
    const senderColors = ['#c76060', '#c79569', '#c7c569', '#6ec769', '#69c2c7', '#6974c7', '#9769c7', '#c769bf']

    const senderIndex = sender 
    ? selectedChat.participants.findIndex(p => p._id === sender._id)
    : 0;

    return(
        <div className={user.id === msg.from._id ? 'my-msg-container' : 'other-msg-container'} onClick={() => setClickedMsg(msg)}>
            {String(msg.from._id) !== String(user.id) &&
                <div className='msg-user-dp-container'>
                    <img className='msg-user-dp' src={msg.from.dp} />
                </div>
            }
            <div className='msg-menu-btns-container'>
                <div className={ msg.from._id === user.id ? `my-media-msg ${msg?.reactions?.length > 0 ? 'has-reactions' : ''} ${newSender ? 'right' : ''}` : `other-media-msg ${msg?.reactions?.length > 0 ? 'has-reactions' : ''} ${newSender ? 'left' : ''}` }>
                    <div className='name-menu-container'>
                        { msg.from._id !== user.id && sender && newSender && (
                            <h4 className='sender-name' style={{color: `${senderColors[senderIndex]}`}}>{sender.username }</h4>
                        ) }
                    </div>
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
                    <div className='msg-media-wrapper audio-msg-wrapper' onClick={() => {return}}>
                        <div className='audio-container'>
                            <AudioPlayer src={msg.media[0].url}/>
                        </div>   
                    </div>
                </div>
                <MessageMenu setIsReply={setIsReply} setRepliedTo={setRepliedTo} msg={msg} setMessages={setMessages}/>
                <ReactionMenu msg={msg}/>
            </div>
        </div>  
    )
}