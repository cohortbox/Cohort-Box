import './Notification.css';
import sampleImg from '../images/sample.png';

export default function Notification(){
    return (
        <div className='notification-container'>
            <img className='notification-img' src={sampleImg}/>
            <p className='notification-msg'>React Hook useEffect has a spread element in its dependency array.</p>
        </div>
    )
}