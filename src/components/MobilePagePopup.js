import './MobilePagePopup.css';
import cobooImg from '../images/coboo-wecloming.png';

export default function MobilePagePopup({setSelfState}){
    return (
        <div className='mobile-popup-container'>
            <div className='mobile-popup-body'>
                <div className='heading-container'>
                    <h1>Hey Welcome!</h1>
                </div>
                <div className='mid-container'>
                    <div className='paragraph-container'>
                        <p className='extra-bold'>We’re in testing right now!</p>
                        <p>
                            Explore freely, vibe with it, if you
                            have any feedback or find any bugs
                            or issues, drop us a note at <span className='green'>feedback@cohortbox.com</span>
                        </p>
                    </div>
                    <div className='coboo-img-container'>
                        <img src={cobooImg}/>
                    </div>
                </div>
                <div className='button-container'>
                    <button onClick={() => setSelfState(false)}>Let's Go</button>
                </div>
            </div>
            <div className='mobile-popup-bg'></div>
        </div>
    )
}