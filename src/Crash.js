import { useNavigate } from 'react-router-dom';
import './Crash.css';
import crash from './images/Crash.png'

export default function Crash(){
    const navigate = useNavigate();

    return (
        <div className='crash-container'>
            <h1><span className='text-green'>Sorry,</span> our app has crashed!</h1>
            <img src={crash}/>
            <p>relax cohortians our homies are tryna fix this.</p>
            <button onClick={() => navigate('/')}>Go to Home</button>
        </div>
    )
}