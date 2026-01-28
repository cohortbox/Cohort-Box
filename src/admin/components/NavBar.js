    import './NavBar.css';
    import { Link } from 'react-router-dom';
    import { useState } from 'react';
    import reportImg from '../../images/report.png';
    import profileImg from '../../images/profile-user.png';
    import peopleImg from '../../images/group.png';
    import logoImg from '../../images/logo.png';
    import menuImg from '../../images/menu.png';

    function NavBar(){
        const [open, setOpen] = useState(false);

        return (
            <nav className={`nav-container ${open ? 'open' : ''}`}>
                {/* Toggle button */}
                

                <section className="nav-btn-container">
                    
                    <button className="nav-toggle" onClick={() => setOpen(!open)}>
                        <img src={menuImg} alt="Menu" className="nav-btn-img" />
                    </button>

                    <Link to="/admin" style={{textDecoration: 'none'}}>
                        <button className="nav-btn">
                            <img src={logoImg} alt="Home" className="nav-btn-img"/>
                            <span>HOME</span>
                        </button>
                    </Link>
                    <Link to="/admin/reports" style={{textDecoration: 'none'}}>
                        <button className="nav-btn">
                            <img src={reportImg} alt="New Post" className="nav-btn-img"/>
                            <span>Reports</span>
                        </button>
                    </Link>
                    <Link to="/admin/users" style={{textDecoration: 'none'}}>
                        <button className="nav-btn">
                            <img src={profileImg} alt="Cohort" className="nav-btn-img"/>
                            <span>Users</span>
                        </button>
                    </Link>
                </section>
            </nav>
        );
    }

    export default NavBar;
