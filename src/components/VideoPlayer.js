//import ReactPlayer from "react-player";
import "./VideoPlayer.css";

export default function VideoPlayer({ src }) {
    console.log('Video Src: ', src)
  return (
    <div className="video-wrapper">
      {/* <div className="player-container">
        <ReactPlayer
          url={src}
          controls
          width="100%"
          height="100%"
        />
      </div> */}
    </div>
  );
}
