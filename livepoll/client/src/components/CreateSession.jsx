import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const CreateSession = () => {
    const [name, setName] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // This hits the POST /api/sessions route we built in the backend
            const response = await api.post('/sessions', { name });
            console.log("Session Created:", response.data);
            
            // On success, go back to the dashboard to see the new poll
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || "Failed to create session");
        }
    };

    return (
        <div className="auth-container">
            <h1>Create a New Poll</h1>
            <form onSubmit={handleSubmit}>
                <input 
                    type="text" 
                    placeholder="e.g. Weekly Team Trivia" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                />
                <button type="submit">Create Session</button>
            </form>
            {error && <p className="error-msg">{error}</p>}
        </div>
    );
};

export default CreateSession;