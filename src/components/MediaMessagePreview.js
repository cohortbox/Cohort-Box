import './MediaMessagePreview.css';
import { useEffect, useMemo, useState } from 'react';
import closeImg from '../images/close-gray.png';
import sendImg from '../images/send.png'
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNavigate } from 'react-router-dom';

function MediaMessage({ files, setFiles, selectedChat }){
    const { socket } = useSocket();
    const filesArr = Array.from(files);
    const [message, setMessage] = useState('');
    const [index, setIndex] = useState(0);
    const { user, accessToken } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        function handleKeydown(e){
            if(e.key === 'ArrowRight'){
                setIndex(prev => Math.min(prev + 1, filesArr.length - 1));
            }else if(e.key === 'ArrowLeft'){
                setIndex(prev => Math.max(prev - 1, 0));
            }
        }
        document.addEventListener('keydown', handleKeydown)

        return () => {
            document.removeEventListener('keydown', handleKeydown)
        }
    }, [])

    function handleClose() {
        setFiles([]); // clear selected files
        setIndex(0);
    }

    function sendMessage(e) {
        e.preventDefault();
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
              console.log(media)
              const newMessage = {
                  from: user.id,
                  chatId: selectedChat._id,
                  type: 'media',
                  message: message.trim() ? message.trim() : ' ',
                  media,
              }

              fetch('/api/message', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'authorization': `Bearer ${accessToken}`,
                  },
                  body: JSON.stringify(newMessage),
              }).then(res => {
                  if (!res.ok) {
                      throw new Error();
                  }
                  return res.json();
              }).then(data => {
                  if (data.message) {
                    socket.emit("message", {message: data.message});
                  }
                  setMessage("");
                  setIndex(0);
                  setFiles([]);
              }).catch(err => {
                  console.error(err);
                  navigate('/crash')
              });
          }).catch(err => {
              console.error(err);
              navigate('/crash')
          });
    }


    // ---------- Media Message = mmsg ---------- 
    return (
        <div className='mmsg-container'>
            <div className='mmsg-close-btn-container'>
                <button className='mmsg-close-btn'><img src={closeImg} className='mmsg-close-img' onClick={handleClose}/></button>
            </div>
            <div className='mmsg-main-media-container'>
                {
                    files[index].type.startsWith('image/') ? (
                        <img src={URL.createObjectURL(files[index])} className='mmsg-main-media'/>
                    ) : (
                        <video src={URL.createObjectURL(files[index])} className='mmsg-main-media' controls/>
                    )
                }
            </div>
            <div className='mmsg-preview-container'>
                {
                    filesArr.map((file, index) => {
                        return file.type.startsWith('image/') ? (
                            <img key={index} src={URL.createObjectURL(file)} className='mmsg-preview' onClick={() => setIndex(index)}/>
                        ) : (
                            <video key={index} src={URL.createObjectURL(file)} className='mmsg-preview' onClick={() => setIndex(index)}/>
                        )
                    })
                }
            </div>
            <form className='msg-input-form' onSubmit={sendMessage}>
                <input
                type="text"
                value={message}
                placeholder="Type a caption"
                onChange={(e) => setMessage(e.target.value)}
                className='msg-input'
                />
                <button className='msg-send-btn' onClick={(e) => sendMessage(e)}><img className='msg-send-img' src={sendImg}/></button>
            </form>
        </div>
    )
}

export default MediaMessage