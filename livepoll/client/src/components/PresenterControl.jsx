import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import ResultsChart from './ResultsChart';
import AddQuestionForm from './AddQuestionForm'; // FIXED: Using the correct component

const PresenterControl = () => {
    const { sessionId } = useParams();
    const socket = useSocket();
    
    const [session, setSession] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [activeQuestion, setActiveQuestion] = useState(null);

    // FIXED: Wrapped in useCallback so we can pass it to children without unnecessary re-renders
    const fetchData = useCallback(async () => {
        try {
            const res = await api.get(`/sessions/${sessionId}`);
            setSession(res.data.session);
            setQuestions(res.data.questions);
            
            // Join socket room once session data is available


             if (res.data.activeQuestion) {
            setActiveQuestion(res.data.activeQuestion);
        }

            if (socket && res.data.session) {
                socket.emit('session:join', { 
                    sessionCode: res.data.session.join_code,
                    voterName: 'PRESENTER' 
                });
            }
        } catch (err) {
            console.error("Fetch error:", err);
        }
    }, [sessionId, socket]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (!socket) return;

        // FIXED: We use a functional update to avoid needing 'activeQuestion' in the dependency array
        // This prevents the "Doorbell Speaker" problem (adding new listeners every time someone votes)
        socket.on('results:update', (data) => {
            setActiveQuestion(prev => {
                if (prev && prev.id === data.questionId) {
                    return { ...prev, options: data.totals };
                }
                return prev;
            });
        });

        socket.on('question:new', (data) => {
            setActiveQuestion({ ...data.question, options: data.options });
        });

        return () => {
            socket.off('results:update');
            socket.off('question:new');
        };
    }, [socket]); // Removed activeQuestion from here for better performance

    const handleStartQuestion = (questionId) => {
        if (!session) return;
        socket.emit('question:open', { 
            questionId, 
            sessionCode: session.join_code 
        });
    };

    const handleEndSession = () => {
    // We ask for confirmation because this is a permanent action
    if (window.confirm("Are you sure you want to end this session? All voting will stop.")) {
        socket.emit('session:end', { sessionCode: session.join_code });
        // Optionally redirect the presenter back to the dashboard
        // navigate('/dashboard');
    }
};

    if (!session) return <div className="loading">Loading Control Panel...</div>;
    const totalVotes = activeQuestion?.options?.reduce((sum, opt) => sum + parseInt(opt.count || 0), 0) || 0;

    return (
        <div className="presenter-control animated-fade-in" style={{ width: '100%' }}>
            <header className="presenter-control-header">
                <div>
                    <h1>Control Panel: {session.name}</h1>
                    <p style={{ marginTop: '0.5rem' }}>
                        Invite code: <span className="highlight">{session.join_code}</span>
                    </p>
                </div>
                <button 
                    onClick={handleEndSession} 
                    className="btn-logout"
                    style={{ minHeight: '3rem', padding: '0.8rem 1.5rem', fontSize: '0.95rem', borderRadius: 'var(--radius-md)' }}
                >
                    End Session
                </button>
            </header>

            <div className="main-layout">
                {/* LEFT SIDE: Management */}
                <div className="question-list-container">
                    <h2>Questions</h2>
                    <div className="q-list">
                        {questions.length === 0 ? (
                            <p className="empty-msg">No questions added yet.</p>
                        ) : (
                            questions.map(q => (
                                <div key={q.id} className="q-card">
                                    <p>{q.question_text}</p>
                                    <button onClick={() => handleStartQuestion(q.id)}>
                                        Launch Question
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                    
                    <hr className="divider" />
                    
                    <h3>+ Add New Question</h3>
                    {/* FIXED: Passing the refresh function as a prop */}
                    <AddQuestionForm sessionId={sessionId} onQuestionAdded={fetchData} />
                </div>

                {/* RIGHT SIDE: Live Results */}
                <div className="live-results-container">
                    {activeQuestion ? (
                        <div className="chart-box">
                            <h2>Live: {activeQuestion.question_text}</h2>
                            {activeQuestion && (
    <div className="presenter-stats">
        
        <div className="total-badge">{totalVotes} Votes Received</div>
    </div>
)}
                            <ResultsChart data={activeQuestion.options} />
                        </div>
                    ) : (
                        <div className="placeholder">
                            <p>Click "Launch" to start a question.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PresenterControl;