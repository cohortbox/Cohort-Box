import './ChatInfoMediaView.css';
import { useState, useEffect } from 'react';
import closeImg from '../images/close-gray.png';
import right from '../images/right-arrow.png';
import left from '../images/left-arrow.png';
import AudioPlayer from './AudioPlayer';

export default function ChatInfoMediaView({items, index, setShowMediaView}){
    const safeInitialIndex = Math.min(Math.max(index, 0), items.length - 1);
    const [mainIndex, setMainIndex] = useState(safeInitialIndex);

    // Keep in sync when parent changes the selected index
    useEffect(() => {
        console.log(items[index])
        setMainIndex(Math.min(Math.max(index, 0), items.length - 1));
    }, [index, items.length]);

    const prev = () => {
        setMainIndex((p) => (p <= 0 ? items.length - 1 : p - 1)); // wrap-around
    };

    const next = () => {
        setMainIndex((p) => (p >= items.length - 1 ? 0 : p + 1)); // wrap-around
    };

    useEffect(() => {
        function handleKeyDown(e) {
            if (!items || items.length === 0) return;

            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prev();
            }

            if (e.key === 'ArrowRight') {
                e.preventDefault();
                next();
            }

            // optional (recommended)
            if (e.key === 'Escape') {
                e.preventDefault();
                setShowMediaView(false);
            }
        }

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [items, prev, next, setShowMediaView]);

    if (!items || items.length === 0) return null;

    return (
        <div className='chat-media-view-container'>
            <div className='chat-media-header'>
                <div className='chat-media-info'>
                    <div className='img-container'>
                        <img src={items[mainIndex]?.from?.dp}/>
                    </div>
                    <div className='chat-media-send-info'>
                        <h1>{items[mainIndex]?.from?.firstName + ' ' + items[mainIndex]?.from?.lastName}</h1>
                        <p>{items[mainIndex]?.timestamp}</p>
                    </div>
                </div>
                <div className='chat-media-btns'>
                    <button onClick={(e) => setShowMediaView(false)}><img src={closeImg}/></button>
                </div>
            </div>
            <div className='main-media-view'>
                <button onClick={prev} disabled={items.length <= 1}><img src={left}/></button>
                <div className='main-media'>
                    { items[mainIndex].type === 'image' ? 
                        (<img src={items[mainIndex].url}/>) : 
                        items[mainIndex].type === 'video' ? 
                        (<video src={items[mainIndex].url} controls/>) : 
                        (<AudioPlayer src={items[mainIndex].url}/>)
                    }
                </div>
                <button onClick={next} disabled={items.length <= 1}><img src={right}/></button>
            </div>
            <div className='chat-media-scroll'>
                {
                    items.map((item, index) => {
                        return item.type === 'image' ? (
                            <img key={index} src={item.url} className='chat-media-item' onClick={() => setMainIndex(index)} />
                        ) : (
                            <video key={index} src={item.url} className='chat-media-item' onClick={() => setMainIndex(index)} />
                        )
                    })
                }
            </div>
        </div>
    )
}