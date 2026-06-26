import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import JoinPoll from './components/JoinPoll';
import LiveVote from './components/LiveVote'; // We will build this next!
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { SocketProvider } from './context/SocketContext';
import PresenterControl from './components/PresenterControl';
import Register from './components/Register';
import CreateSession from './components/CreateSession';
//THIS IS UPDATED ONE

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Home screen is the Join page */}
          <Route path="/" element={<JoinPoll />} />
          <Route path="/join" element={<JoinPoll />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/presenter/:sessionId" element={<PresenterControl />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/create-session" element={<CreateSession />} />

          {/* This dynamic path captures the room code from the URL */}
          <Route path="/poll/:code" element={<LiveVote />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;