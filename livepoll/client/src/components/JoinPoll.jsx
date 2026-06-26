import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import { Link, useNavigate } from 'react-router-dom'; // Keep only what you use

// REMOVED: Unused imports (Login, Dashboard, Register, api)

const JoinPoll = () => {
    const [joinCode, setJoinCode] = useState('');
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    
    const socket = useSocket();
    const navigate = useNavigate(); // FIXED: Added this line

    const handleJoin = (e) => {
        e.preventDefault();
        if (!joinCode) return setError("Please enter a room code");
        

        let token = localStorage.getItem('voterToken');
        // ... after setting the token ...
    localStorage.setItem('voterName', nickname || 'Anonymous'); // SAVE THE NAME
        if (!token) {
            token = crypto.randomUUID();
            localStorage.setItem('voterToken', token);
        }

        socket.emit('session:join', { 
            sessionCode: joinCode.toUpperCase(), 
            voterName: nickname 
        });
    };

    useEffect(() => {
        if (!socket) return;

        socket.on('error', (data) => {
            setError(data.message);
        });

        socket.on('session:joined', (data) => {
            // We use the code from the state to ensure the URL is correct
            navigate(`/poll/${joinCode.toUpperCase()}`, { 
                state: { initialData: data } 
            });
        });

        return () => {
            socket.off('error');
            socket.off('session:joined');
        };
    }, [socket, joinCode, navigate]); // Added dependencies for safety

    return (
        <div className="join-container">
            <h1>Join a Poll</h1>
            <form onSubmit={handleJoin}>
                <input 
                    type="text" 
                    placeholder="6-Digit Code (e.g. ABC123)" 
                    value={joinCode} 
                    onChange={(e) => setJoinCode(e.target.value)}
                />
                <input 
                    type="text" 
                    placeholder="Your Nickname (Optional)" 
                    value={nickname} 
                    onChange={(e) => setNickname(e.target.value)}
                />
                <button type="submit">Enter Room</button>
            </form>
            {error && <p style={{color: 'red'}}>{error}</p>}
            <p>Are you a presenter? <Link to="/login">Login here</Link></p>
            
        </div>
    );
};

export default JoinPoll;