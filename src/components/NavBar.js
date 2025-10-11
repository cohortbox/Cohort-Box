import './NavBar.css';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import plusImg from '../images/plus.png';
import settingsImg from '../images/settings.png';
import profileImg from '../images/profile-user.png';
import peopleImg from '../images/group.png';
import logoImg from '../images/logo.png';
import menuImg from '../images/menu.png';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

function NavBar({ selectedChat }){
    const { socket } = useSocket();
    const { user } = useAuth();
    const [open, setOpen] = useState(false);

    function handleHomeClick(e) {
        e.preventDefault();
        if (socket && selectedChat?._id) {
            socket.emit("leaveChat", selectedChat._id);
            console.log("Emitted leaveChat for:", selectedChat._id);
        }
        window.location.href = "/";
    }

    return (
        <nav className={`nav-container ${open ? 'open' : ''}`}>
            {/* Toggle button */}
            

            <section className="nav-btn-container">
                
                <button className="nav-toggle" onClick={() => setOpen(!open)}>
                    <img src={menuImg} alt="Menu" className="nav-btn-img" />
                </button>

                <Link to="/" style={{textDecoration: 'none'}} onClick={handleHomeClick}>
                    <button className="nav-btn">
                        <img src={logoImg} alt="Home" className="nav-btn-img"/>
                        <span>HOME</span>
                    </button>
                </Link>
                <Link to="/posts" style={{textDecoration: 'none'}}>
                    <button className="nav-btn">
                        <img src={plusImg} alt="New Post" className="nav-btn-img"/>
                        <span>NEW POST</span>
                    </button>
                </Link>
                <Link to="/new-cohort-box" style={{textDecoration: 'none'}}>
                    <button className="nav-btn">
                        <img src={peopleImg} alt="Cohort" className="nav-btn-img"/>
                        <span>COHORTS</span>
                    </button>
                </Link>
            </section>

            <section className="nav-btn-container">
                <Link to={user ? `/profile/${user.id}` : '/login'} style={{textDecoration: 'none'}}>
                    <button className="nav-btn">
                        <img src={profileImg} alt="Profile" className="nav-btn-img"/>
                        <span>PROFILE</span>
                    </button>
                </Link>
                <button className="nav-btn">
                    <img src={settingsImg} alt="Settings" className="nav-btn-img"/>
                    <span>SETTINGS</span>
                </button>
            </section>
        </nav>
    );
}

export default NavBar;
