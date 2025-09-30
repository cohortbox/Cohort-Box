import './MediaView.css';
import closeImg from '../images/close-gray.png'
import { useState } from 'react';

// ---------- media-view === mv ----------
function MediaView({ media, setClickedMedia }){

    const [index, setIndex] = useState(0)

    return (
        <div className='mv-container'>
            <div className='mv-close-btn-container'>
                <button className='mv-close-btn'><img src={closeImg} className='mv-close-img' onClick={() => setClickedMedia(null)}/></button>
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