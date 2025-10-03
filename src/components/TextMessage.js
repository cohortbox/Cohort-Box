import './TextMessage.css';
import MessageMenu from './MessageMenu.js';
import ReactionMenu from './ReactionMenu.js';
import { useAuth } from '../context/AuthContext.js';

export default function TextMessage({ msg, sender, setMessages }){
    const { user } = useAuth();

    function groupReactions(reactions = []) {
        const map = {};
        for (let r of reactions) {
            if (!map[r.emoji]) map[r.emoji] = 0;
        }
        return Object.entries(map).map(([emoji, count]) => ({ emoji, count }));
    }

    return(
        <div className={msg.from === user.id ? "my-msg-container" : "other-msg-container"}>
            <div className={msg.from === user.id ? "my-msg" : "other-msg"}>
                { msg.from !== user.id && sender && (
                <h4 className='sender-name'>{sender.firstName + ' ' + sender.lastName }</h4>
                ) }
                <span className="msg-text">{msg.message}</span>
                {msg.reactions?.length > 0 && (
                <div className={msg.from === user.id ? "my-reactions" : "other-reactions"}>
                    <span className="reaction-bubble">
                    {groupReactions(msg.reactions)[0].emoji} {groupReactions(msg.reactions)[1]?.emoji} {msg.reactions.length > 1 && <span className="reaction-count">{msg.reactions.length}</span>}
                    </span>
                </div>
                )}
            </div>
            <MessageMenu msg={msg} setMessages={setMessages}/>
            <ReactionMenu msg={msg}/>
        </div>   
    )
}