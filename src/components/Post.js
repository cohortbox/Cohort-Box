import './Post.css';
import userImg from '../images/sample.png';
import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import left from '../images/left-arrow.png';
import right from '../images/right-arrow.png';
import playIcon from '../images/play.png';
import pauseIcon from '../images/pause.png';
import VideoPlayer from './VideoPlayer';

function Post({ post }) {
    const [mainIndex, setMainIndex] = useState(0);

    // video states
    const videoRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (isPlaying) {
            videoRef.current.pause();
        } else {
            videoRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    const handleSeek = (e) => {
        const newTime = e.target.value;
        if (videoRef.current) {
            videoRef.current.currentTime = newTime;
        }
        setCurrentTime(newTime);
    };

    const handleVolume = (e) => {
        const newVolume = e.target.value;
        if (videoRef.current) {
            videoRef.current.volume = newVolume;
        }
        setVolume(newVolume);
    };

    // format time mm:ss
    const formatTime = (time) => {
        if (isNaN(time)) return "00:00";
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes < 10 ? "0" + minutes : minutes}:${seconds < 10 ? "0" + seconds : seconds}`;
    };

    return (
        <div className='post-container'>
            <div className='post-heading-container'>
                <div className='chat-img-container'>
                    <img className='chat-img' src={userImg} alt="user"/>
                </div>
                <div className='post-names-container'>
                    <h3 className='chat-name'><Link to={'/'+post.chatId._id.toString()} style={{textDecoration: 'none', color: '#c5cad3'}}>{post.chatId.chatName}</Link></h3>
                    <p className='post-username'>posted by <Link to={'/profile/'+post.from._id.toString()} style={{textDecoration: 'none', color: '#878792'}}>{post.from.firstName + ' ' + post.from.lastName}</Link></p>
                </div>
            </div>
            <div className='post-media-container'>
                { post.media[mainIndex].type === 'image' ? (
                    <img className='post-media' src={post.media[mainIndex].url} alt="media"/>
                ) : (
                    // <div className="video-wrapper">
                    //     <video
                    //         className="post-media"
                    //         src={post.media[mainIndex].url}
                    //         ref={videoRef}
                    //         onTimeUpdate={handleTimeUpdate}
                    //         onLoadedMetadata={handleLoadedMetadata}
                    //     />
                    //     <div className="video-controls">
                    //         <button className="control-btn" onClick={togglePlay}>
                    //             <img 
                    //                 src={isPlaying ? pauseIcon : playIcon} 
                    //                 alt={isPlaying ? "Pause" : "Play"} 
                    //                 className="control-icon"
                    //             />
                    //         </button>
                    //         <span className="time-display">{formatTime(currentTime)}</span>
                    //         <input
                    //             type="range"
                    //             className="progress-bar"
                    //             min="0"
                    //             max={duration}
                    //             value={currentTime}
                    //             onChange={handleSeek}
                    //         />
                    //         <span className="time-display">{formatTime(duration)}</span>
                    //         <input
                    //             type="range"
                    //             className="volume-bar"
                    //             min="0"
                    //             max="1"
                    //             step="0.05"
                    //             value={volume}
                    //             onChange={handleVolume}
                    //         />
                    //     </div>
                    // </div>
                    <VideoPlayer src={post.media[mainIndex].url}/>
                )}
                { post.media.length > 1 &&
                    <div className='media-controls-container'>
                        <div className='media-images-num-container'>
                            <div className='media-images-num'>
                                { (mainIndex + 1) + '/' + (post.media.length) }
                            </div>
                        </div>
                        <div className='controls'>
                            <div className='control' onClick={(e) => {
                                e.preventDefault();
                                setMainIndex(mainIndex === 0 ? 0 : mainIndex - 1)
                            }}>
                                <img src={left} alt="left"/>
                            </div>
                            <div className='control' onClick={(e) => {
                                e.preventDefault();
                                setMainIndex(mainIndex === post.media.length - 1 ? mainIndex : mainIndex + 1)
                            }}>
                                <img src={right} alt="right"/>
                            </div>
                        </div>
                    </div>
                }
            </div>
            <div className='post-btn-container'>
                <button className='post-btn border-right'>React</button>
                <button className='post-btn'>Share</button>
            </div>
        </div>
    )
}

export default Post;
