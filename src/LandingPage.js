import './LandingPage.css';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './images/logo.png';
import down from './images/down-fontColor.png';

export default function LandingPage(){
    const navigate = useNavigate();
    const [userNum, setUserNum] = useState(0);
    const [showIndex, setShowIndex] = useState(1000);
    console.log(showIndex)
    const questions = ['What is CohortBox?', 'Why should I join CohortBox?', 'How is CohortBox different from other Social Media apps?', "Why can I view chats I'm not part of?", 'Can anyone send messages in any chat?', 'Is this like a social media app or a messaging app?', "Why would I use this app if I'm shy or introverted?", 'Is this app mobile friendly?'];
    const answers = ["", "The app is designed like a public conversation space, similar to a podcast but in text form. You can follow people’s conversations without the pressure of participating.", "Only the participants of a chat can send messages. Non-participants can view, listen, and react (if you enable reactions), but they cannot send messages.", "Our app is designed like a public conversation space, similar to a podcast but in text form.", " No!\nYou can only send messages to the cohort box that you are a participant of.", "It is more of an app that can be used to chat and view other people's chats, think of it as your friend’s group chats made public for all viewers and like social media, you can follow public discussions.", "", ""]
    return (
        <div className='lp-container'>
            <div className='lp-welcome-container'>
                <div className='lp-logo-container'>
                    <img src={logo}/>
                </div>
                <h1><span>👋</span>Welcome to CohortBox!</h1>
                <button onClick={() => navigate('/signup')}>SignUp</button>
                <p><span>{userNum}</span> users have already joined us!</p>
            </div>
            <div className='lp-faq-section-container'> 
                <h1>FAQs:</h1>
                <div className='lp-faq-container'>
                    {
                        questions.map((question, index) => (
                            <div className='faq-inner-wrapper'>
                                <div className='faq-question-container'>
                                    <div className='faq-question'>{question}</div>
                                    <button className={'dropdown-btn' + (showIndex === index ? ' rotate-animation' : '')} onClick={() => setShowIndex(prev => prev > questions.length - 1 ? index : 1000)}><img src={down}/></button>
                                </div>
                                <div className={'answer-wrapper ' + (showIndex === index ? 'open' : '')}>
                                    <p className="answer">{answers[index]}</p>
                                </div>
                            </div>
                        ))
                    }
                </div>
            </div>
        </div>
    )
}