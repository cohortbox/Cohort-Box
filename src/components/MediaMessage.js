import './MediaMessage.css';
import MessageMenu from './MessageMenu.js';
import ReactionMenu from './ReactionMenu.js';
import playIcon from '../images/play.png';
import { useAuth } from '../context/AuthContext.js';

export default function MediaMessage({ newSender, setIsReply, setRepliedTo, msg, sender, setMessages, setClickedMedia, selectedChat, setClickedMsg }){
    const { user } = useAuth();
    const senderColors = ['#c76060', '#c79569', '#c7c569', '#6ec769', '#69c2c7', '#6974c7', '#9769c7', '#c769bf']

    function groupReactions(reactions = []) {
        const map = {};
        for (let r of reactions) {
            if (!map[r.emoji]) map[r.emoji] = 0;
        }
        return Object.entries(map).map(([emoji, count]) => ({ emoji, count }));
    }

    const senderIndex = sender 
    ? selectedChat.participants.findIndex(p => p._id === sender._id)
    : 0;

    return(
        <div className={user.id === msg.from._id ? 'my-msg-container' : 'other-msg-container'} onClick={() => setClickedMsg(msg)}>
        {String(msg.from._id) !== String(user.id) && newSender &&
          <div className='msg-user-dp-container'>
            <img className='msg-user-dp' src={msg.from.dp} />
          </div>
        }
        <div className='msg-menu-btns-container'>
          {msg.media.length > 0 && msg.media.length <= 2 ? (
            <div className={msg.from._id === user.id ?`my-media-msg ${newSender ? 'right' : ''}` : `other-media-msg ${newSender ? 'left' : ''}`}>
              <div className='name-menu-container'>
                {msg.from._id !== user.id && sender && newSender && (
                  <h4 className='sender-name' style={{ color: `${senderColors[senderIndex] ? senderColors[senderIndex] : '#c5cad3'}` }}>{sender.firstName + ' ' + sender.lastName}</h4>
                )}
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
              <div className={'msg-media-wrapper' + (msg.media[0].type === 'audio' ? ' audio-msg-wrapper' : '')} onClick={msg.media[0].type === 'audio' ? () => { return } : () => setClickedMedia(msg.media)}>
                {msg.media.map((mediaItem, index) => (
                  mediaItem.type === "image" ? (
                    <div className='msg-media-container'>
                      <img key={index} src={mediaItem.url} className='msg-media' />
                    </div>

                  ) : (
                    <div className='msg-media-container'>
                      <div className='video-icon'>
                        <img src={playIcon} />
                      </div>
                      <video key={index} src={mediaItem.url} className='msg-media' />
                    </div>
                  )
                ))}
              </div>
              {msg.text !== ' ' && <span className="msg-text">{msg.message}</span>}
              {msg.reactions?.length > 0 && (
                <div className={msg.from === user.id ? "my-reactions" : "other-reactions"}>
                  <span className="reaction-bubble">
                    {groupReactions(msg.reactions)[0].emoji}{groupReactions(msg.reactions)[1]?.emoji} {msg.reactions.length > 1 && <span className="reaction-count">{msg.reactions.length}</span>}
                  </span>
                </div>
              )}
            </div>
          ) : msg.media.length === 3 ? (
            <div className={user.id === msg.from._id ? 'my-msg-container' : 'other-msg-container'}>
              <div className={msg.from._id === user.id ? `my-media-msg ${newSender ? 'right' : ''}` : `other-media-msg ${newSender ? 'left' : ''}`}>
                <div className='name-menu-container'>
                  {msg.from._id !== user.id && sender && newSender && (
                    <h4 className='sender-name' style={{ color: `${senderColors[senderIndex]}` }}>{sender.firstName + ' ' + sender.lastName}</h4>
                  )}
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
                <div className='msg-media-wrapper-3' onClick={() => setClickedMedia(msg.media)}>
                  {msg.media.map((mediaItem, index) => (
                    mediaItem.type === "image" ? (
                      <div className='msg-media-container'>
                        <img key={index} src={mediaItem.url} className='msg-media' />
                      </div>

                    ) : (
                      <div className='msg-media-container'>
                        <div className='video-icon'>
                          <img src={playIcon} />
                        </div>
                        <video key={index} src={mediaItem.url} className='msg-media' />
                      </div>
                    )
                  ))}
                </div>
                {msg.text !== ' ' && <span className="msg-text">{msg.message}</span>}
                {msg.reactions?.length > 0 && (
                  <div className={msg.from === user.id ? "my-reactions" : "other-reactions"}>
                    <span className="reaction-bubble">
                      <span>{groupReactions(msg.reactions)[0].emoji}</span>{groupReactions(msg.reactions)[1] && <span>{groupReactions(msg.reactions)[1]?.emoji}</span>}{msg.reactions.length > 1 && <span className="reaction-count">{msg.reactions.length}</span>}
                    </span>
                  </div>
                )}
              </div>
            </div>
            ) : (
              <div className={user.id === msg.from._id ? 'my-msg-container' : 'other-msg-container'}>
                <div className={msg.from._id === user.id ? `my-media-msg ${newSender ? 'right' : ''}` : `other-media-msg ${newSender ? 'left' : ''}`}>
                  <div className='name-menu-container'>
                    {msg.from._id !== user.id && sender && newSender && (
                      <h4 className='sender-name' style={{ color: `${senderColors[senderIndex]}` }}>{sender.firstName + ' ' + sender.lastName}</h4>
                    )}
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
                  <div className='msg-media-wrapper-4' onClick={() => setClickedMedia(msg.media)}>
                    {msg.media.map((mediaItem, index) => (
                      mediaItem.type === "image" ? (
                        <div className='msg-media-container'>
                          <img key={index} src={mediaItem.url} className='msg-media' />
                        </div>

                      ) : (
                        <div className='msg-media-container'>
                          <div className='video-icon'>
                            <img src={playIcon} />
                          </div>
                          <video key={index} src={mediaItem.url} className='msg-media' />
                        </div>
                      )
                    ))}
                  </div>
                  {msg.text !== ' ' && <span className="msg-text">{msg.message}</span>}
                  {msg.reactions?.length > 0 && (
                    <div className={msg.from === user.id ? "my-reactions" : "other-reactions"}>
                      <span className="reaction-bubble">
                        {groupReactions(msg.reactions)[0].emoji} {groupReactions(msg.reactions)[1]?.emoji} {msg.reactions.length > 1 && <span className="reaction-count">{msg.reactions.length}</span>}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )
          }
          <MessageMenu setIsReply={setIsReply} setRepliedTo={setRepliedTo} msg={msg} setMessages={setMessages} />
          <ReactionMenu msg={msg} />
        </div>
      </div>
    )
}