const express = require('express');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // For hashing passwords

const app = express();

dotenv.config();

app.use(express.json());

// Simple logger middleware
const logger = (req, res, next) => {
    console.log(`${req.method} request to ${req.url}`);
    next();
};
app.use(logger);

// Dummy user data (for demonstration purposes)
let users = [
    {
        id: 1,
        email: 'test@example.com',
        password: bcrypt.hashSync('123456', 10) // Password is hashed using bcrypt
    }
];

// Login route to generate JWT token
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Find user by email
    const user = users.find(user => user.email === email);
    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
});

// Authentication middleware
const auth = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }
    try {
        const decoded = jwt.verify(token.split(' ')[1], process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Protected profile route
app.get('/profile', auth, (req, res) => {
    res.json({ message: `Welcome, user with ID: ${req.user.id}` });
});

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Server Error!' });
};
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on PORT: ${PORT}`);
});
