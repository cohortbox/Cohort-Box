import { useAuth } from '../context/AuthContext.js';
import './AudioMessage.css';
import AudioPlayer from './AudioPlayer.js';
import MessageMenu from './MessageMenu.js';
import ReactionMenu from './ReactionMenu.js';

export default function AudioMessage({ msg, setMessages, sender }){
    const { user } = useAuth();

    return(
      <div className={user.id === msg.from ? 'my-msg-container' : 'other-msg-container'}>
        <div className={ msg.from === user.id ? "my-media-msg" : "other-media-msg" }>
            <div className='name-menu-container'>
                { msg.from !== user.id && sender && (
                    <h4 className='sender-name'>{sender.firstName + ' ' + sender.lastName }</h4>
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