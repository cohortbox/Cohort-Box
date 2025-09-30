// components/AudioPlayer.js
import './AudioPlayer.css';
import { useState, useRef, useEffect } from "react";
import playIcon from "../images/play-black.png";
import pauseIcon from "../images/pause-black.png";

function AudioPlayer({ src }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // percentage (0-100)
  const [duration, setDuration] = useState("0:00");
  const [currentTime, setCurrentTime] = useState("0:00");
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;

    const updateProgress = () => {
      if (!audio || !audio.duration) return;
      const percent = (audio.currentTime / audio.duration) * 100;
      setProgress(percent || 0);
      setCurrentTime(formatTime(audio.currentTime));
    };

    const setAudioData = () => {
      if (!audio || isNaN(audio.duration)) return;
      setDuration(formatTime(audio.duration));
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime("0:00");
      audio.currentTime = 0;
    }

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", setAudioData);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", setAudioData);
      audio.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    const newTime = (e.target.value / 100) * audio.duration;
    audio.currentTime = newTime;
    setProgress(e.target.value);
  };

  const handleMouseDown = () => {
    if (audioRef.current) audioRef.current.pause();
  };

  const handleMouseUp = () => {
    if (audioRef.current && isPlaying) audioRef.current.play();
  };

  function formatTime(time) {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button className="audio-btn" onClick={togglePlay}>
        <img
          src={isPlaying ? pauseIcon : playIcon}
          alt={isPlaying ? "Pause" : "Play"}
          className="audio-play-icon"
        />
      </button>
      <input
        type="range"
        className="audio-slider"
        value={progress}
        onChange={handleSeek}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        style={{ "--progress": `${progress}%` }}
      />
      <span className="audio-time">
        {currentTime} / {duration}
      </span>
    </div>
  );
}

export default AudioPlayer;
