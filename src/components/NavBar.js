import './NavBar.css';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import plusImg from '../images/plus.png';
import settingsImg from '../images/settings.png';
import profileImg from '../images/profile-user.png';
import peopleImg from '../images/group.png';
import logoImg from '../images/logo.png';
import menuImg from '../images/menu.png'; // hamburger/menu icon
import { useAuth } from '../context/AuthContext';

function NavBar(){

    const { user } = useAuth();
    const [open, setOpen] = useState(false);

    return (
        <nav className={`nav-container ${open ? 'open' : ''}`}>
            {/* Toggle button */}
            

            <section className="nav-btn-container">
                
                <button className="nav-toggle" onClick={() => setOpen(!open)}>
                    <img src={menuImg} alt="Menu" className="nav-btn-img" />
                </button>

                <Link to="/">
                    <button className="nav-btn">
                        <img src={logoImg} alt="Home" className="nav-btn-img"/>
                        <span>Home</span>
                    </button>
                </Link>
                <Link to="/posts">
                    <button className="nav-btn">
                        <img src={plusImg} alt="New Post" className="nav-btn-img"/>
                        <span>New Post</span>
                    </button>
                </Link>
                <Link to="/new-cohort-box">
                    <button className="nav-btn">
                        <img src={peopleImg} alt="Cohort" className="nav-btn-img"/>
                        <span>Cohorts</span>
                    </button>
                </Link>
            </section>

            <section className="nav-btn-container">
                <Link to={user ? `/profile/${user.id}` : '/login'}>
                    <button className="nav-btn">
                        <img src={profileImg} alt="Profile" className="nav-btn-img"/>
                        <span>Profile</span>
                    </button>
                </Link>
                <button className="nav-btn">
                    <img src={settingsImg} alt="Settings" className="nav-btn-img"/>
                    <span>Settings</span>
                </button>
            </section>
        </nav>
    );
}

export default NavBar;
