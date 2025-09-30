import './NavChatButton.css';
import sampleImg from '../images/sample.png'
import { useAuth } from '../context/AuthContext';

function NavChatButton({ chat, setSelectedChat }){

    // ---------- nav-chat-button === ncbs ----------

    return (
        <div className='ncbs-container' onClick={() => setSelectedChat(chat)}>
            <div className='ncbs-img-container'>
                <img className='ncbs-img' src={sampleImg}/>
            </div>
            <div className='ncbs-heading-container'>
                <h4 className='ncbs-heading'>{chat.chatName}</h4>
                <h5 className='ncbs-sub-heading'>{chat.chatNiche}</h5>
            </div>
        </div>
    )
}

export default NavChatButton;