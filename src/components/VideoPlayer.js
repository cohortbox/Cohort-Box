import './VideoPlayer.css';
import { useState, useRef } from 'react';
import playIcon from '../images/play.png';
import pauseIcon from '../images/pause.png';

export default function VideoPlayer({src}){

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
        <div className="video-wrapper">
            <video
                className="video"
                src={src}
                ref={videoRef}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
            />
            <div className="video-controls">
                <button className="control-btn" onClick={togglePlay}>
                    <img 
                        src={isPlaying ? pauseIcon : playIcon} 
                        alt={isPlaying ? "Pause" : "Play"} 
                        className="control-icon"
                    />
                </button>
                <span className="time-display">{formatTime(currentTime)}</span>
                <input
                    type="range"
                    className="progress-bar"
                    min="0"
                    max={duration}
                    value={currentTime}
                    onChange={handleSeek}

                />
                <span className="time-display">{formatTime(duration)}</span>
                <input
                    type="range"
                    className="volume-bar"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={handleVolume}
                />
            </div>
        </div>
    )
}