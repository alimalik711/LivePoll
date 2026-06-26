const express = require('express');
const http = require('http'); // Built-in Node module
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const cors = require('cors');
const pool = require('./db'); // This connects the "Ear" (Socket) to the "Brain" (Database)


console.log("SERVER FILE LOADED");
console.log("CORS origin: http://localhost:5175");


const authRoutes = require('./routes/authRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const { protect } = require('./middleware/authMiddleware');

const app = express();
// Create an HTTP server using Express
const server = http.createServer(app);

// Initialize Socket.io on top of the HTTP server
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5175",
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(
    cors({
        origin: "http://localhost:5175",
        credentials: true,
    })
);
app.use(express.json());
app.use(cookieParser());


app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes); // Protect all session routes with JWT auth



// --- SOCKET.IO LOGIC START ---





// --- SOCKET.IO LOGIC START ---
io.on('connection', (socket) => {
    console.log(`⚡ User connected: ${socket.id}`);

    // Listen for a user trying to join a poll session
    socket.on('session:join', async (data) => {
        const { sessionCode, voterName } = data;

        try {
            // 1. Validate the session code against the database
            const result = await pool.query(
                'SELECT * FROM sessions WHERE join_code = $1',
                [sessionCode]
            );

            if (result.rows.length === 0) {
                // Tell the user the code is invalid
                return socket.emit('error', { message: "Session not found" });
            }

            const session = result.rows[0];

            // 2. Put the socket into a "Room" named after the sessionCode
            socket.join(sessionCode);
            console.log(`👤 User ${voterName || socket.id} joined room: ${sessionCode}`);

            // 3. TODO: Send the current state of the poll to the user who just joined
            const questionResult = await pool.query(
                'SELECT * FROM questions WHERE session_id = $1 AND status = $2',
                [session.id, 'open']
            );

            const activeQuestion = questionResult.rows[0];

            if (!activeQuestion) {
                // What do we send to the user if no question is open?
                return socket.emit('session:joined', { status: 'waiting', sessionName: session.name });
            }

            // TODO: If we DID find a question, we still need its options! 
            const optionResult = await pool.query(
                'SELECT id, option_text FROM options WHERE question_id = $1',
                [activeQuestion.id]
            );

            const totalsResult = await pool.query(
                'SELECT  o.id, o.option_text, COUNT(v.id) AS count FROM options o LEFT JOIN votes v ON o.id = v.option_id WHERE o.question_id = $1 GROUP BY o.id',
                [activeQuestion.id]
            );


            socket.emit('session:joined', {
                status: 'active',
                sessionName: session.name,
                question: {
                    id: activeQuestion.id,
                    text: activeQuestion.question_text,
                    options: totalsResult.rows
                }
            });

        } catch (err) {
            console.error("Socket Join Error:", err);
            socket.emit('error', { message: "Failed to join session" });
        }
    });

    socket.on('vote:cast', async (data) => {

        console.log("VOTE DATA ARRIVED:", data); // DEBUG HERE
        const { optionId, questionId, voterToken, sessionCode, voterName } = data;

        try {

            // 1. Validate the vote (Is the option valid? Is the question still open?)
            const optionResult = await pool.query(
                'SELECT * FROM options WHERE id = $1 AND question_id = $2',
                [optionId, questionId]
            );

            if (optionResult.rows.length === 0) {
                return socket.emit('error', { message: "Invalid option" });
            }

            // We also need to check if the question is still open for voting
            const questionResult = await pool.query(
                'SELECT * FROM questions WHERE id = $1',
                [questionId]
            );
            const question = questionResult.rows[0];

            if (!question || question.status !== 'open') {
                return socket.emit('error', { message: "Question is not open for voting" });
            }

            // 2. Record the vote in the database
            await pool.query(
                'INSERT INTO votes (question_id, option_id, voter_token, voter_name) VALUES ($1, $2, $3, $4)',
                [questionId, optionId, voterToken, voterName]
            );

            // 3. Get the updated vote totals for the question
            const totalsResult = await pool.query(
                'SELECT o.id, o.option_text, COUNT(v.id) AS count FROM options o LEFT JOIN votes v ON o.id = v.option_id WHERE o.question_id = $1 GROUP BY o.id',
                [questionId]
            );

            // 4. Emit the updated vote totals to all connected clients
            const leaderboardResult = await pool.query(`
            SELECT COALESCE(v.voter_name, 'Anonymous') AS voter_name,
                   voter_token,
                   COUNT(*) AS points
            FROM votes v
            WHERE question_id IN (
                SELECT id FROM questions WHERE session_id = (
                    SELECT id FROM sessions WHERE join_code = $1
                )
            )
            GROUP BY voter_token, voter_name
            ORDER BY points DESC
            LIMIT 10
        `, [sessionCode]);

            io.to(sessionCode).emit('results:update', {
                questionId: questionId,
                totals: totalsResult.rows,
                leaderboard: leaderboardResult.rows
            });
        } catch (err) {
            console.error("Socket Vote Error:", err);
            socket.emit('error', { message: "Failed to cast vote" });
        }
    });

    socket.on('question:open', async (data) => {
        const { questionId, sessionCode } = data;

        try {
            // 1. STATE MANAGEMENT: Close any currently open question in this session
            // We find the session_id first so we only affect this specific room
            await pool.query(
                "UPDATE questions SET status = 'closed' WHERE session_id = (SELECT session_id FROM questions WHERE id = $1) AND status = 'open'",
                [questionId]
            );

            // 2. OPEN THE NEW QUESTION
            await pool.query(
                "UPDATE questions SET status = 'open' WHERE id = $1",
                [questionId]
            );

            // 3. FETCH THE DATA (Corrected the WHERE clause)
            const questionResult = await pool.query('SELECT * FROM questions WHERE id = $1', [questionId]);

            const optionsResult = await pool.query(
                'SELECT * FROM options WHERE question_id = $1', // FIXED: searching by question_id
                [questionId]
            );

            // 4. BROADCAST to everyone in the room
            io.to(sessionCode).emit('question:new', {
                question: questionResult.rows[0],
                options: optionsResult.rows
            });

        } catch (err) {
            console.error("Error opening question:", err);
            socket.emit('error', { message: "Failed to open question" });
        }
    });


    socket.on('session:end', async (data) => {
        const { sessionCode } = data;
        try {
            // 1. Mark session as ended
            await pool.query("UPDATE sessions SET status = 'ended' WHERE join_code = $1", [sessionCode]);

            // 2. Close all questions
            await pool.query(
                "UPDATE questions SET status = 'closed' WHERE session_id = (SELECT id FROM sessions WHERE join_code = $1)",
                [sessionCode]
            );

            const leaderboardResult = await pool.query(`
            SELECT COALESCE(v.voter_name, 'Anonymous') AS voter_name,
                   voter_token,
                   COUNT(*) AS points
            FROM votes v
            WHERE question_id IN (
                SELECT id FROM questions WHERE session_id = (
                    SELECT id FROM sessions WHERE join_code = $1
                )
            )
            GROUP BY voter_token, voter_name
            ORDER BY points DESC
            LIMIT 10
        `, [sessionCode]);

            // 3. Tell everyone to show the final screen with the leaderboard
            io.to(sessionCode).emit('session:ended', {
                leaderboard: leaderboardResult.rows
            });
        } catch (err) {
            console.error("Session end error:", err);
        }
    });

    socket.on('disconnect', () => {
        console.log('🔥 User disconnected');
    });


});
// --- SOCKET.IO LOGIC END ---



const PORT = process.env.PORT || 5000;

// IMPORTANT: We now listen on 'server', not 'app'
server.listen(PORT, () => {
    console.log(`🚀 Server and WebSockets running on port ${PORT}`);
});