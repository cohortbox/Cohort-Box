import './Dashboard.css';
import NavBar from '../components/NavBar';

export default function Dashbooard(){
    return (
        <div className='dashboard'>
            <NavBar />
            <div className='dashboard-container'>
                <h1>
                    Hello
                </h1>
            </div>
        </div>
    )
}