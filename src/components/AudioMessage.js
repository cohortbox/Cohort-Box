import { useAuth } from '../context/AuthContext.js';
import './AudioMessage.css';
import AudioPlayer from './AudioPlayer.js';
import MessageMenu from './MessageMenu.js';
import ReactionMenu from './ReactionMenu.js';

export default function AudioMessage({ msg, setMessages, sender, selectedChat }){
    const { user } = useAuth();
    const senderColors = ['#c76060', '#c79569', '#c7c569', '#6ec769', '#69c2c7', '#6974c7', '#9769c7', '#c769bf']

    const senderIndex = sender 
    ? selectedChat.participants.findIndex(p => p._id === sender._id)
    : 0;

    return(
      <div className={user.id === msg.from ? 'my-msg-container' : 'other-msg-container'}>
        <div className={ msg.from === user.id ? "my-media-msg" : "other-media-msg" }>
            <div className='name-menu-container'>
                { msg.from !== user.id && sender && (
                    <h4 className='sender-name' style={{color: `${senderColors[senderIndex]}`}}>{sender.firstName + ' ' + sender.lastName }</h4>
                ) }
            </div>
            <div className='msg-media-wrapper audio-msg-wrapper' onClick={() => {return}}>
                <div className='audio-container'>
                    <AudioPlayer src={msg.media[0].url}/>
                </div>   
            </div>
        </div>
        <MessageMenu msg={msg} setMessages={setMessages}/>
        <ReactionMenu msg={msg}/>
      </div>  
    )
}