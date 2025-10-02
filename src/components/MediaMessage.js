import './MediaMessage.css';
import { useState } from 'react';
import closeImg from '../images/close-gray.png';
import sendImg from '../images/send.png'
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

function MediaMessage({ files, setFiles, selectedChat }){
    const { socket } = useSocket();
    const filesArr = Array.from(files);
    const [message, setMessage] = useState('');
    const [index, setIndex] = useState(0);
    const { user, accessToken } = useAuth();

    function handleClose() {
        setFiles([]); // clear selected files
        setIndex(0);
    }

    function sendMessage(e) {
        e.preventDefault();
        if(!message.trim()) return;
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
              message: message.trim(),
              media,
            }
            socket.emit("message", newMessage);
            setMessage("");
            setIndex(0);
            setFiles([]);
          })
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