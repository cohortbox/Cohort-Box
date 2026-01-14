import './MediaView.css';
import closeImg from '../images/close-gray.png'
import { useState, useEffect } from 'react';

// ---------- media-view === mv ----------
function MediaView({ msg, media, setClickedMedia }){

    const [index, setIndex] = useState(0)

    useEffect(() => {
        function handleKeydown(e){
            if(e.key === 'ArrowRight'){
                setIndex(prev => Math.min(prev + 1, media.length - 1));
            }else if(e.key === 'ArrowLeft'){
                setIndex(prev => Math.max(prev - 1, 0));
            }
        }
        document.addEventListener('keydown', handleKeydown)

        return () => {
            document.removeEventListener('keydown', handleKeydown)
        }
    }, [])

    return (
        <div className='mv-container'>
            <div className='mv-header'>
                <div className='mv-sender-info'>
                    <div className='img-container'>
                        <img src={msg?.from?.dp}/>
                    </div>
                    <div className='mv-send-info'>
                        <h1>{msg?.from?.firstName + ' ' + msg?.from?.lastName}</h1>
                        <p>{msg?.timestamp}</p>
                    </div>
                </div>
                <div className='mv-close-btn-container'>
                    <button className='mv-close-btn'><img src={closeImg} className='mv-close-img' onClick={() => setClickedMedia(null)}/></button>
                </div>
            </div>
            <div className='mv-main-media-container'>
                {
                    media[index].type === 'image' ? (
                        <img src={media[index].url} className='mv-main-media'/>
                    ) : (
                        <video src={media[index].url} className='mv-main-media' controls/>
                    )
                }
            </div>
            <div className='mv-preview-container'>
                {
                    media.map((mediaItem, index) => {
                        return mediaItem.type === 'image' ? (
                            <img key={index} src={mediaItem.url} className='mv-preview' onClick={() => setIndex(index)}/>
                        ) : (
                            <video key={index} src={mediaItem.url} className='mv-preview' onClick={() => setIndex(index)}/>
                        )
                    })
                }
            </div>
        </div>
    )
}

export default MediaView;