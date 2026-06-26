const jwt = require('jsonwebtoken');

const protect = async (req, res, next) => {
    let token;

    // 1. Look for the token in cookies OR headers
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    // 2. If no token, stop them!
    if (!token) {
        return res.status(401).json({ message: "Not authorized, no token" });
    }

    try {
        // 3. Verify the "Signature" on the ticket
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 4. Attach the user ID to the request object
        // Now, every controller this passes through will know WHO is asking.
        req.user = decoded;

        next(); // The ticket is valid, move to the next function!
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: "Not authorized, token failed" });
    }
};

module.exports = { protect };