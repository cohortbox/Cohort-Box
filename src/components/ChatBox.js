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
import {ReactComponent as MyIcon} from '../images/comment.svg';


function ChatBox({ setChats, paramChatId, selectedChat, setSelectedChat, messages, setMessages, typingUsers, setShowLiveChat }){

  const senderColors = ['#c76060', '#c79569', '#c7c569', '#6ec769', '#69c2c7', '#6974c7', '#9769c7', '#c769bf']

  console.log(selectedChat)
  const { socket } = useSocket();
  const [files, setFiles] = useState([]);
  const [chatInfoClass, setChatInfoClass] = useState(' hidden');
  const [showEmoji, setShowEmoji] = useState(false);
  const [message, setMessage] = useState('');
  const [chatLiveCount, setChatLiveCount] = useState(0);
  const { user, accessToken } = useAuth();
  const [clickedMedia, setClickedMedia] = useState(null);
  const [recording, setRecording] = useState(false);
  const [clickedMsg, setClickedMsg] = useState(null);
  const [hasMoreMsgs, setHasMoreMsgs] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isReply, setIsReply] = useState(false);
  const [repliedTo, setRepliedTo] = useState(null);

  const messagesBoxRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const emojiPickerRef = useRef(null);
  const msgRef = useRef(null);
  const caretPosRef = useRef(0);
  const PAGE_SIZE = 20;
  
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

    function handleClickOutside(e) {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target)
      ) {
        setShowEmoji(false)
      }
    }

    if (showEmoji) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmoji]);

  async function loadOlderMessages() {
    console.log('loadOlderMessages ran!')
    if (!selectedChat) return;
    if (!hasMoreMsgs) return;
    if (loadingMoreRef.current) return;

    const el = messagesBoxRef.current;
    if (!el) return;

    try {
      setLoadingMore(true);
      loadingMoreRef.current = true;

      // STATE ORDER: [ newest ... oldest ]
      const oldest = messages[messages.length - 1];
      if (!oldest?._id) return;

      const res = await fetch(
        `/api/return-messages/${encodeURIComponent(selectedChat._id)}?limit=${PAGE_SIZE}&before=${oldest._id}`,
        {
          method: "GET",
          headers: { authorization: `Bearer ${accessToken}` },
        }
      );

      if (!res.ok) throw new Error("Load older failed");
      const data = await res.json();

      const olderBatch = data.msgs || [];

      // ✅ APPEND older messages (critical fix)
      setMessages(prev => [...prev, ...olderBatch]);
      setHasMoreMsgs(Boolean(data.hasMore));

      // ✅ DO NOT touch scrollTop
    } catch (e) {
      console.error(e);
      navigate('/crash')
    } finally {
      setLoadingMore(false);
      loadingMoreRef.current = false;
    }
  }

  useEffect(() => {
  if (!selectedChat) return;

  let cancelled = false; // prevents state updates after unmount/switch

  async function loadInitialAndJoin() {
    try {
      // ---------- 1) LAZY LOAD INITIAL MESSAGES ----------
      setLoadingMore(true);
      loadingMoreRef.current = true;

      const res = await fetch(
        `/api/return-messages/${encodeURIComponent(selectedChat._id)}?limit=${PAGE_SIZE}`,
        {
          method: "GET",
          headers: { authorization: `Bearer ${accessToken}` },
        }
      );

      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();

      if (cancelled) return;

      // API returns newest->oldest (desc), reverse for render order oldest->newest
      const initialMsgs = [...(data.msgs || [])];
      setMessages(initialMsgs);
      setHasMoreMsgs(Boolean(data.hasMore));

      // scroll to bottom after first load
      setTimeout(() => {
        if (cancelled) return;
        const el = messagesBoxRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      }, 0);

      // ---------- 2) JOIN/OPEN CHAT LOGIC ----------
      const chatId = selectedChat._id;

      const isParticipant = Array.isArray(selectedChat.participants)
        ? selectedChat.participants.some((p) => p?._id === user.id)
        : false;

      // Everyone joins room (so they receive updates like reactions/live counts)
      socket.emit("joinChat", { chatId, userId: user.id });

      // Only participants trigger "opened by participant" + subscriber notifications
      if (isParticipant) {
        socket.emit("chatOpenedByParticipant", { chatId, userId: user.id });

        // Notify subscribers (your existing behavior)
        const subs = Array.isArray(selectedChat.subscribers) ? selectedChat.subscribers : [];

        // IMPORTANT: your earlier code used .map without await; this keeps your behavior
        subs.forEach((sub) => {
          // If subs are objects sometimes, normalize to id
          const subId = typeof sub === "object" ? sub?._id : sub;

          const body = {
            user: subId,
            sender: user.id,
            type: "chat_participant_joined",
            chat: chatId,
            message: null,
            text: "",
          };

          fetch(`/api/notification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${accessToken}`,
            },
            credentials: "include",
            body: JSON.stringify(body),
          })
            .then((r) => {
              if (!r.ok) throw new Error("Notification request failed");
              return r.json();
            })
            .then((d) => {
              if (cancelled) return;
              if (d?.notification) socket.emit("notification", d.notification);
            })
            .catch((err) => {
              console.error(err);
              navigate('/crash')
            });
        });
      }
    } catch (err) {
      console.error(err);
      navigate('/crash')
    } finally {
      if (!cancelled) {
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    }
  }

  loadInitialAndJoin();

  // ---------- CLEANUP: leave chat on switch/unmount ----------
  return () => {
    cancelled = true;

    if (socket && selectedChat?._id) {
      socket.emit("leaveChat", selectedChat._id);
      console.log("left chat:", selectedChat._id);
    }

    // also stop typing if user leaves while typing (optional but recommended)
    if (socket && isTypingRef.current && selectedChat?._id) {
      socket.emit("typing", { chatId: selectedChat._id, userId: user.id, typing: false });
      isTypingRef.current = false;
    }

    // clear the typing timeout (optional)
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };
}, [selectedChat, accessToken, socket, user.id]);


  useEffect(() => {
    console.log('hello')
    const el = messagesBoxRef.current;
    if (!el) return;

    function onScroll() {
      // when near top, load older
      if (el.scrollTop <= 40) {
        loadOlderMessages();
      }
    }

    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [messages, hasMoreMsgs, selectedChat, accessToken]);


   function handleSubscribe(e){
    e.preventDefault();
    fetch('/api/chat/subscribe', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ chatId: selectedChat._id })
    }).then(res => {
      if(!res.ok){
        throw new Error();
      }
      return res.json();
    }).then(data => {
      setSelectedChat(prev => ({
        ...prev,
        subscribers: data.subscribers
      }))
    }).catch(err => {
      console.error(err);
      navigate('/crash')
    })
  }

  function handleUnsubscribe(e){
    e.preventDefault();
    fetch('/api/chat/unsubscribe', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({ chatId: selectedChat._id })
    }).then(res => {
      if(!res.ok){
        throw new Error();
      }
      return res.json();
    }).then(data => {
      setSelectedChat(prev => ({
        ...prev,
        subscribers: data.subscribers
      }))
    }).catch(err => {
      console.error(err);
      navigate('/crash')
    })
  }

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
    const text = e.target.value; 
    setMessage(text);

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
          const newMessageBody =  {
            from: user.id,
            chatId: selectedChat._id,
            type: "text",
            isReply: isReply ? true : false,
            repliedTo: isReply ? repliedTo._id : null,
            media: [],
            message: message.trim(),
          }

           fetch('/api/message', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${accessToken}`,
              },
              body: JSON.stringify(newMessageBody),
            }).then(res => {
              if(!res.ok){
                throw new Error();
              }
              return res.json();
            }).then(data => {
              if(data.message){
                socket.emit("message", {message: data.message});    
              }
            }).catch(err => {
              console.error(err);
              navigate('/crash')
            });
          setIsReply(false);
          setRepliedTo(null);
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
            const newMessageBody = {
              from: user.id,
              chatId: selectedChat._id,
              type: 'media',
              message: ' ',
              media,
            }

            fetch('/api/message', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${accessToken}`,
              },
              body: JSON.stringify(newMessageBody),
            }).then(res => {
              if(!res.ok){
                throw new Error();
              }
              return res.json();
            }).then(data => {
              if(data.message){
                socket.emit("message", data.message);    
              }
            }).catch(err => {
              console.error(err);
              navigate('/crash')
            })
            socket.emit("typing", { chatId: selectedChat._id, userId: user.id, typing: false });
            setFiles([])
            setMessage("");
          }).catch(err => {
            console.error(err);
            navigate('/crash')
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
          const newMessageBody = {
            from: user.id,
            chatId: selectedChat._id,
            type: 'audio',
            message: ' ',
            media,
          }
          fetch('/api/message', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'authorization': `Bearer ${accessToken}`,
              },
              body: JSON.stringify(newMessageBody),
            }).then(res => {
              if(!res.ok){
                throw new Error();
              }
              return res.json();
            }).then(data => {
              if(data.message){
                socket.emit("message", data.message);    
              }
            }).catch(err => {
              console.error(err);
              navigate('/crash')
            })
            socket.emit("typing", { chatId: selectedChat._id, userId: user.id, typing: false });
            setFiles([])
            setMessage("");
        }).catch(err => {
          console.error(err);
          navigate('/crash')
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
    const emoji = emojiData.emoji;
    const pos = caretPosRef.current;

    const newText =
      message.slice(0, pos) + emoji + message.slice(pos);

    const newCaretPos = pos + emoji.length;
    caretPosRef.current = newCaretPos

    setTimeout(() => {
    if (msgRef.current) {
      msgRef.current.selectionStart = newCaretPos;
      msgRef.current.selectionEnd = newCaretPos;
      msgRef.current.focus();
    }}, 0)

    setMessage(newText);
  }

  function saveCaret(e){
    caretPosRef.current = e.target.selectionStart;
  }

  return (
    <div className="chat-box">
      { files.length > 0 && <MediaMessagePreview files={files} setFiles={setFiles} selectedChat={selectedChat}/> }
      {clickedMedia && clickedMsg && <MediaView msg={clickedMsg} media={clickedMedia} setClickedMedia={setClickedMedia}/>}
      { selectedChat && <ChatInfo setChats={setChats}selectedChat={selectedChat} setSelectedChat={setSelectedChat} chatInfoClass={chatInfoClass} setChatInfoClass={setChatInfoClass} setMessages={setMessages}/> }
      { selectedChat &&
        (<div className='chat-heading-and-btns-container'>
            <div className='chatName-chatDp-container'>
              <img className='chatDp' src={selectedChat.chatDp}/>
              <h3 className='chat-box-heading'>{selectedChat.chatName}</h3>
              { !selectedChat.participants.some(p => p._id === user.id) && (
                  selectedChat?.subscribers.includes(user.id) ? 
                  ( <button className='unsubscribe-btn' onClick={handleUnsubscribe}>Unsubscribe</button> ) :
                  ( <button className='subscribe-btn' onClick={handleSubscribe}>Subscribe</button> )
              )}
            </div>
            <p className='chat-live-count'><img className='chat-live-count-img' src={eyeIcon}/> {chatLiveCount}</p>
            <div className='chat-btns-container'>
              <button className='show-live-chat-btn' onClick={() => setShowLiveChat(prev => !prev)}><MyIcon fill='#c5cad3' style={{height: '15px', width: '15px', color: '#c5cad3'}}/></button>
              <button className='chat-info-btn' onClick={() => setChatInfoClass('')}><img className='chat-info-img' src={dotsImg}/></button>
              <button className='chat-close-btn' onClick={handleCloseChat}><img className='chat-close-img' src={closeImg}/></button>
            </div>
          </div>)
      }
      <div className='messages-box' ref={messagesBoxRef}>

        {/* ✅ Typing indicator */}
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        )}

        {[...messages].map((msg, index) => { 
          
          return msg.type === 'text' ? (               
            <TextMessage setIsReply={setIsReply} setRepliedTo={setRepliedTo} key={index} msg={msg} sender={msg.from} setMessages={setMessages} selectedChat={selectedChat} setClickedMsg={setClickedMsg}/>      
          ) : ( msg.type === 'media' && msg.media.length > 0 ) ? (
            <MediaMessage setIsReply={setIsReply} setRepliedTo={setRepliedTo} msg={msg} sender={msg.from} setMessages={setMessages} setClickedMedia={setClickedMedia} selectedChat={selectedChat} setClickedMsg={setClickedMsg}/>
          ) : msg.type === 'audio' ? (
            <AudioMessage setIsReply={setIsReply} setRepliedTo={setRepliedTo} msg={msg} setMessages={setMessages} sender={msg.from} selectedChat={selectedChat} setClickedMsg={setClickedMsg}/>
          ) : msg.type === 'chatInfo' && (
            <ChatInfoMessage msg={msg}/>
          )
        })}
      </div>  
      { selectedChat && selectedChat.participants.some(p => p._id === user.id) && (
          <form className='msg-input-form' onSubmit={sendMessage}>
            {
              isReply && repliedTo &&
              (
                <div className='replyee-msg-container'>
                  <div className='close-reply-container'>
                    <button type='button' onClick={() => {setIsReply(false); setRepliedTo(null)}}>
                      <img src={closeImg}/>
                    </button>
                  </div>
                  <h1 style={{color: `${senderColors[selectedChat.participants.findIndex(p => p._id === repliedTo.from._id)]}`}}>{repliedTo.from.firstName + ' ' + repliedTo.from.lastName}</h1>
                  <p>
                    {repliedTo.type === 'text' && repliedTo.message}

                    {repliedTo.type === 'media' &&
                      `${repliedTo.media?.length || 0} media`}

                    {repliedTo.type === 'audio' && 'Audio Message'}
                  </p>
                </div>
              )
            }
            <AttachmentMenu setFiles={setFiles}/>
            <button type='button' className='emoji-btn' ref={refs.setReference} onMouseDown={(e) => e.preventDefault()} onClick={() => setShowEmoji(v => !v)}>😊</button>

            {showEmoji && (
              <div ref={(el) => {
                refs.setFloating(el);
                emojiPickerRef.current = el;
              }} style={floatingStyles}>
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
                ref={msgRef}
                className="msg-input"
                value={message}
                onChange={handleInputChange}
                onClick={saveCaret}
                onKeyUp={saveCaret}
                spellCheck='false'
              />
              )
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