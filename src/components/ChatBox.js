import './ChatBox.css';
import { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { useFloating, offset, autoUpdate, flip } from '@floating-ui/react';
import { useAuth } from '../context/AuthContext';
import ChatInfo from './ChatInfo';
import AttachmentMenu from './AttachmentMenu';
import eyeIcon from '../images/eye.png';
import dotsImg from '../images/dots.png';
import closeImg from '../images/close-gray.png';
import sendImg from '../images/send.png';
import micImg from '../images/microphone.png';
import recordingIcon from '../images/voice.png';
import { useNavigate } from 'react-router-dom';
import MediaView from './MediaView.js';
import MediaMessagePreview from './MediaMessagePreview.js';
import { useSocket, useSocketEvent } from '../context/SocketContext.js';
import TextMessage from './TextMessage.js';
import MediaMessage from './MediaMessage.js';
import AudioMessage from './AudioMessage.js';
import ChatInfoMessage from './ChatInfoMessage.js';

function ChatBox({ paramChatId, selectedChat, setSelectedChat, messages, setMessages, typingUsers }){
  const { socket } = useSocket();
  const [files, setFiles] = useState([]);
  const [chatInfoClass, setChatInfoClass] = useState(' hidden');
  const [showEmoji, setShowEmoji] = useState(false);
  const [message, setMessage] = useState('');
  const [chatLiveCount, setChatLiveCount] = useState(0);
  const { user, accessToken } = useAuth();
  const [clickedMedia, setClickedMedia] = useState(null);
  const [recording, setRecording] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const { refs, floatingStyles } = useFloating({
    placement: "top-start",
    middleware: [offset(4), flip()],
    whileElementsMounted: autoUpdate
  });
  const navigate = useNavigate();

  useSocketEvent('liveViewerCount', ({chatId, count}) => {
    if(chatId === selectedChat._id){
      console.log('hi from liveViewerCount');
      setChatLiveCount(count);
    }
  })

  useEffect(() => {
    if(!selectedChat) return;

    fetch(`/api/return-messages/${encodeURIComponent(selectedChat._id)}`, {
      method: 'GET',
      headers: {
        'authorization': `Bearer ${accessToken}` 
      }
    }).then(response => {
      if(!response.ok){
        throw new Error('Request Failed!');
      }
      return response.json();
    }).then(data => {
      console.log(data.msgs)
      setMessages(data.msgs);
    })

    //Notifying server that user has opened a chat
    const isParticipant = selectedChat.participants.some(p => p._id === user.id)
    if(isParticipant){
      socket.emit('chatOpenedByParticipant', { chatId: selectedChat._id, userId: user.id })
    }else{
      socket.emit('joinChat', { chatId: selectedChat._id, userId: user.id })
    }

    return () => {
      if (selectedChat && socket) {
        socket.emit('leaveChat', selectedChat._id);
        console.log('left chat:', selectedChat._id);
      }
    };

  }, [selectedChat])

  function handleCloseChat(e){
      e.preventDefault();
      setSelectedChat(null);
      setMessages([]);
      setMessage('');
      setChatLiveCount(0);
      if(paramChatId){
        navigate('/')
      }
  }

  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  function handleInputChange(e) {
    setMessage(e.target.value);

    if (socket && selectedChat) {
      if (!isTypingRef.current) {
        // only emit once when typing starts
        socket.emit("typing", { chatId: selectedChat._id, userId: user.id, typing: true });
        isTypingRef.current = true;
      }

      // clear the old timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // set a new timeout (2s) to mark typing as stopped
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing", { chatId: selectedChat._id, userId: user.id, typing: false });
        isTypingRef.current = false;
      }, 2000);
    }
  }

  function sendMessage(e) {
      e.preventDefault();
      if(!message.trim()) return;
      if (socket && selectedChat) {
        if(files.length === 0){
          const newMessage =  {
            from: user.id,
            chatId: selectedChat._id,
            type: "text",
            message: message.trim(),
          }
          socket.emit("message", newMessage);
          setMessage("");
        }else {
          const formData = new FormData();
          for(const file of files){
            formData.append('media', file)
          }

          fetch(`/api/upload-images`, {
            method: 'POST',
            headers: {
                'authorization': `Bearer ${accessToken}`
            },
            body: formData
          }).then(response => {
            if(!response.ok){
                throw new Error('Request Failed!')
            }
            return response.json();
          }).then(data => {
            const media = data.media;
            const newMessage = {
              from: user.id,
              chatId: selectedChat._id,
              type: 'media',
              message: ' ',
              media,
            }
            socket.emit("message", newMessage);
            socket.emit("typing", { chatId: selectedChat._id, userId: user.id, typing: false });
            setFiles([])
            setMessage("");
          })
        }
      }
  }

  async function handleAudioMessage(e) {
    e.preventDefault();

    if (!recording) {
      // start recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        recorder.stream.getTracks().forEach(track => track.stop());
        const formData = new FormData();
        formData.append('audio', blob);
        fetch(`/api/upload-audio`, {
            method: 'POST',
            headers: {
                'authorization': `Bearer ${accessToken}`
            },
            body: formData
        }).then(response => {
          if(!response.ok){
              throw new Error('Request Failed!', response.status)
          }
          return response.json();
        }).then(data => {
          const media = data.media;
          const newMessage = {
            from: user.id,
            chatId: selectedChat._id,
            type: 'audio',
            message: ' ',
            media,
          }
          socket.emit('message', newMessage);
        })
      };

      recorder.start();
      setRecording(true);
    } else {
      // stop recording
      recorderRef.current.stop();
      setRecording(false);
    }
  }

  function onEmojiClick(emojiData) {
    setMessage(prev => prev + emojiData.emoji);
  }

  return (
    <div className="chat-box">
      { files.length > 0 && <MediaMessagePreview files={files} setFiles={setFiles} selectedChat={selectedChat}/> }
      {clickedMedia && <MediaView media={clickedMedia} setClickedMedia={setClickedMedia}/>}
      { selectedChat && <ChatInfo selectedChat={selectedChat} setSelectedChat={setSelectedChat} chatInfoClass={chatInfoClass} setChatInfoClass={setChatInfoClass} setMessages={setMessages}/> }
      { selectedChat &&
        (<div className='chat-heading-and-btns-container'>
            <h3 className='chat-box-heading'>{selectedChat.chatName}</h3>
            <p className='chat-live-count'><img className='chat-live-count-img' src={eyeIcon}/> {chatLiveCount}</p>
            <div className='chat-btns-container'>
              <button className='chat-info-btn' onClick={() => setChatInfoClass('')}><img className='chat-info-img' src={dotsImg}/></button>
              <button className='chat-close-btn' onClick={handleCloseChat}><img className='chat-close-img' src={closeImg}/></button>
            </div>
          </div>)
      }
      <div className='messages-box'>

        {/* ✅ Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        )}

        {[...messages].reverse().map((msg, index) => { 
          
          const sender = selectedChat.participants.find( p => p._id === msg.from );
          
          return msg.type === 'text' ? (               
            <TextMessage key={index} msg={msg} sender={sender} setMessages={setMessages} selectedChat={selectedChat}/>      
          ) : ( msg.type === 'media' && msg.media.length > 0 ) ? (
            <MediaMessage msg={msg} sender={sender} setMessages={setMessages} setClickedMedia={setClickedMedia} selectedChat={selectedChat}/>
          ) : msg.type === 'audio' ? (
            <AudioMessage msg={msg} setMessages={setMessages} sender={sender} selectedChat={selectedChat}/>
          ) : msg.type === 'chatInfo' && (
            <ChatInfoMessage msg={msg}/>
          )
        })}
      </div>  
      { selectedChat && selectedChat.participants.some(p => p._id === user.id) && (
          <form className='msg-input-form' onSubmit={sendMessage}>
            <AttachmentMenu setFiles={setFiles}/>
            <button className='emoji-btn' ref={refs.setReference} onClick={() => setShowEmoji(v => !v)}>😊</button>

            {showEmoji && (
              <div ref={refs.setFloating} style={floatingStyles}>
                <EmojiPicker onEmojiClick={onEmojiClick} theme='dark' defaultSkinTone='white'/>
              </div>
            )}

            { recording ? (
              <div className='recording-indicator'>
                <img src={recordingIcon} className='recoding-img'/>
                Recording......
              </div>
            ) : (
              <input
                type="text"
                value={message}
                placeholder="Type a message..."
                onChange={(e) => handleInputChange(e)}
                className='msg-input'
              /> )
            }
            { !!message ? (
                <button className='msg-send-btn' onClick={sendMessage}><img className='msg-send-img' src={sendImg}/></button> 
              ) : (
                <button className='audio-msg-btn' onClick={handleAudioMessage}><img className='audio-btn-img' src={micImg}/></button>
              )
            }
          </form> )
      }
    </div>
  )
}


export default ChatBox;