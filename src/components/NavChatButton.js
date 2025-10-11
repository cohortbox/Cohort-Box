import './NavChatButton.css';
import sampleImg from '../images/sample.png';
import eyeImg from '../images/eye.png';

function NavChatButton({ chat, setSelectedChat }){

    // ---------- nav-chat-button === ncbs ----------

    return (
        <div className='ncbs-container' onClick={() => setSelectedChat(chat)}>
            <div className='ncbs-img-heading-container'>
                <div className='ncbs-img-container'>
                    <img className='ncbs-img' src={sampleImg}/>
                </div>
                <div className='ncbs-heading-container'>
                    <h4 className='ncbs-heading'>{chat.chatName}</h4>
                    <h5 className='ncbs-sub-heading'>{chat.chatNiche}</h5>
                </div>
            </div>
            <div className='ncbs-live-count-container'>
                <img src={eyeImg}/>
                {chat.liveViewerCount}
            </div>
        </div>
    )
}

export default NavChatButton;