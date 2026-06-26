import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import ResultsChart from './ResultsChart';
import Leaderboard from './Leaderboard';

const LiveVote = () => {
    const { code } = useParams(); // Gets 'ABC123' from the URL
    const location = useLocation();
    const navigate = useNavigate();
    const socket = useSocket();
    const joinedRef = useRef(false);

    // The state of our current poll
    const [pollData, setPollData] = useState(location.state?.initialData || null);
    const [hasVoted, setHasVoted] = useState(false);
    const [isEnded, setIsEnded] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);

    useEffect(() => {
        if (!socket) return;

        if (!joinedRef.current) {
            const voterName = localStorage.getItem('voterName') || 'Guest';
            socket.emit('session:join', { sessionCode: code, voterName });
            joinedRef.current = true;
        }

        // 2. Listen for the initial data or refresh data
        socket.on('session:joined', (data) => {
            setPollData(data);
        });

    

        // 3. Listen for the presenter pushing a NEW question
socket.on('question:new', (data) => {
    console.log("New question received:", data);

    setPollData(prev => ({
        ...prev,           // Keep the session name and other stable info
        status: 'active',  // Ensure we are in active mode
        question: {
            id: data.question.id,
            // Check your console: if the backend sends 'question_text', 
            // map it to 'text' here so your JSX doesn't break!
            text: data.question.question_text || data.question.text, 
            options: data.options
        }
    }));

    // This is the most important line! 
    // It flips the screen from "Results" back to "Buttons"
    setHasVoted(false); 
});

        // 4. Listen for real-time result updates
        // 4. Listen for real-time result updates
socket.on('results:update', (data) => {
    console.log("Incoming socket data:", data);
    
    setPollData(prev => {
        // Use == (double equals) to ignore string vs number differences
        if (prev?.question?.id == data.questionId) {
            return {
                ...prev,
                question: {
                    ...prev.question,
                    options: data.totals
                }
            };
        }
        return prev;
    });

    if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
    }
});

socket.on('session:ended', (data) => {
        if (data?.leaderboard) {
            setLeaderboard(data.leaderboard);
        }
        setIsEnded(true);
    });


        return () => {
            socket.off('session:joined');
            socket.off('question:new');
            socket.off('results:update');
            socket.off('session:ended');
        };
    }, [socket, code, pollData]);

    const handleVote = (optionId) => {
        const voterToken = localStorage.getItem('voterToken');
         const voterName = localStorage.getItem('voterName'); 
        
        socket.emit('vote:cast', {
            sessionCode: code,
            questionId: pollData.question.id,
            optionId: optionId,
            voterToken: voterToken,
            voterName: voterName
        });

        setHasVoted(true); // Hide the buttons and show results
    };

    const calculateTotalVotes = () => {
    if (!pollData || !pollData.question.options) return 0;
    
    return pollData.question.options.reduce((sum, opt) => {
        // Convert string to number safely
        return sum + parseInt(opt.count || 0);
    }, 0);
};


const totalVotes = calculateTotalVotes();

    // ... inside LiveVote.jsx ...

if (!pollData) return <div>Connecting to Poll...</div>;

// 1. Check if the session is ended first
if (isEnded) {
    return (
        <div className="vote-container animated-fade-in">
            <h1>Session Finalized</h1>
            <p>Final results for <strong>{pollData.sessionName}</strong></p>
            
            <div className="total-badge">
                {totalVotes} Total Votes Cast
            </div>

            <div className="results-view">
                <ResultsChart data={pollData.question.options} />
                <Leaderboard data={leaderboard} />
                <button onClick={() => navigate('/')} className="btn-secondary">Back to Home</button>
            </div>
        </div>
    );
}

// 2. Check if it's waiting
if (pollData.status === 'waiting') return <div>Waiting for presenter to start...</div>;

// 3. Otherwise, show the live poll
return (
    <div className="vote-container">
        <h2>{pollData.sessionName}</h2>
        <h3 className="question-title">{pollData.question.text}</h3>

        {!hasVoted ? (
            <div className="options-grid">
                {pollData.question.options.map(opt => (
                    <button key={opt.id} onClick={() => handleVote(opt.id)}>
                        {opt.option_text}
                    </button>
                ))}
            </div>
        ) : (
            <div className="results-view">
                <p>Thanks for voting! Current Results:</p>
                {/* Cleaned up: Removed the <ul> and just show the chart */}
                <ResultsChart data={pollData.question.options} />
                <Leaderboard data={leaderboard} />
                <p className="footer-note">Waiting for the next question...</p>
            </div>
        )}
    </div>
);
};

export default LiveVote;