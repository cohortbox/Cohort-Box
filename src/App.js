import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home'
import Signup from './SignUp'
import Login from './login'
import Posts from './login';
import Profile from './Profile';
import NewCohortBox from './NewCohortBox';
import VerifyEmail from './VerifyEmail';
import PhotoStep from './PhotoStep';
import FriendRequestPopup from './components/FriendRequestPopup'

function App() {
  return (
    <Router>
      <FriendRequestPopup/>
      <Routes>
        <Route path='/:chatId?' element={<Home/>}/>
        <Route path='/signup' element={<Signup/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/posts' element={<Posts/>}/>
        <Route path='/profile/:id' element={<Profile/>}/>
        <Route path='/new-cohort-box' element={<NewCohortBox/>}/>
        <Route path='/verify-email/:token' element={<VerifyEmail/>}/>
        <Route path='/change-dp/:method/:id' element={<PhotoStep/>}/>
      </Routes>
    </Router>
  );
}

export default App;
