require("dotenv").config();

const config = require("./config.json");
const mongoose = require("mongoose")

mongoose.connect(config.connectionString)

const User = require("./models/user.model")
const Note = require("./models/note.model")

const express = require('express')
const cors = require('cors');
const app = express()

const jwt = require("jsonwebtoken")
const { authenticateToken } = require("./utilities")

app.use(express.json())

app.use(
    cors({
        origin: '*',
    })
)

app.get('/', (req, res) => {
    res.json({ data: "hello" })
})

// Create Account
app.post('/create-account', async (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName) {
        return res
            .status(400)
            .json({ error: true, message: "Please enter your full name" })
    }

    if (!email) {
        return res
            .status(400)
            .json({ error: true, message: "Please enter your email" })
    }

    if (!password) {
        return res
            .status(400)
            .json({ error: true, message: "Please enter your password" })
    }

    const isUser = await User.findOne({ email: email })

    if (isUser) {
        return res
            .status(400)
            .json({ error: true, message: "User already exists" })
    }

    const user = new User({
        fullName,
        email,
        password
    });

    await user.save();

    const accessToken = jwt.sign({ user }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: '36000m'
    })

    return res.json({
        error: false,
        user,
        accessToken,
        message: "Registration successful"
    })
})

// Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email) {
        return res
            .status(400)
            .json({ error: true, message: "Email is required" })
    }

    if (!password) {
        return res
            .status(400)
            .json({ error: true, message: "Password is required" })
    }

    const userInfo = await User.findOne({
        email: email,
    })

    if (!userInfo) {
        return res
            .status(401)
            .json({ message: "User not Found" })
    }

    if (userInfo.email === email && userInfo.password === password) {
        const user = { user: userInfo }
        const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: "36000m",
        });

        return res.json({
            error: false,
            message: "Login Successful",
            email,
            accessToken,
        })
    } else {
        return res
            .status(401)
            .json({ error: true, message: "Invalid Credentials" })
    }
})

// Get User
app.get('/get-user', authenticateToken, async (req, res) => {
    const { user } = req.user;

    const isUser = await User.findOne({ _id: user._id });

    if (!isUser) {
        return res
            .status(401)
            .json({ error: true, message: "User not found" });
    }

    return res.json({
        error: false,
        user: { fullName: isUser.fullName, email: isUser.email, "_id": isUser._id, createdOn: isUser.createdOn },
        message: "User already exists"
    });

})

// Add Note 
app.post('/add-note', authenticateToken, async (req, res) => {
    console.log("req.user:", req.user); // Debugging step

    const { title, content, tags } = req.body;
    const { user } = req.user;


    if (!title) {
        return res
            .status(400)
            .json({ error: true, message: "Title is required" });
    }

    if (!content) {
        return res
            .status(400)
            .json({ error: true, message: "content is required" });
    }

    try {
        const note = new Note({
            title,
            content,
            tags: tags || [],
            userId: user._id,
        });

        await note.save();
        return res.json({
            error: false,
            note, message: "Note added successfully"
        });

    } catch (error) {
        return res
            .status(500)
            .json({ error: true, message: "Internal Server Error" });
    }
});

// Edit Note
app.put('/edit-note/:noteId', authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;
    const { title, content, tags, isPinned } = req.body;
    const { user } = req.user;

    if (!title && !content && !tags) {
        return res
            .status(400)
            .json({ error: true, message: "At least one field must be updated" });
    }

    try {
        const note = await Note.findOne({ _id: noteId, userId: user._id })

        if (!note) {
            return res
                .status(404)
                .json({ error: true, message: "Note not found" });
        }

        if (title) note.title = title;
        if (content) note.content = content;
        if (tags) note.tags = tags;
        if (isPinned) note.isPinned = isPinned;

        await note.save();
        return res.json({
            error: false,
            note,
            message: "Note updated successfully"
        });

    } catch (error) {
        return res
            .status(500)
            .json({
                error: true, message: "Internal Server Error"
            });
    }

})

// Get All Note 
app.get('/get-all-notes/', authenticateToken, async (req, res) => {
    const { user } = req.user;

    try {
        const notes = await Note.find({ userId: user._id }).sort({ isPinned: -1 });

        return res.json({
            error: false,
            notes,
            message: "Notes fetched successfully"
        });

    } catch (error) {
        return res
            .status(500)
            .json({
                error: true, message: "Internal Server Error"
            });
    }
})

//Delete Note
app.delete('/delete-note/:noteId', authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;
    const { user } = req.user;

    try {
        const note = await Note.findOne({ _id: noteId, userId: user._id });

        if (!note) {
            return res
                .status(404)
                .json({ error: true, message: "Note not found" });
        }

        await Note.deleteOne({ _id: noteId, userId: user._id });

        return res.json({
            error: false,
            message: "Note deleted successfully"
        });

    } catch (error) {
        return res
            .status(500)
            .json({
                error: true, message: "Internal Server Error"
            });
    }
})

// Update isPinned Value
app.get('/update-note-pinned/:noteId', authenticateToken, async (req, res) => {
    const noteId = req.params.noteId;
    const { isPinned } = req.body;
    const { user } = req.user;



    try {
        const note = await Note.findOne({ _id: noteId, userId: user._id })

        if (!note) {
            return res
                .status(404)
                .json({ error: true, message: "Note not found" });
        }

        note.isPinned = isPinned;

        await note.save();
        return res.json({
            error: false,
            note,
            message: "Note updated successfully"
        });

    } catch (error) {
        return res
            .status(500)
            .json({
                error: true, message: "Internal Server Error"
            });
    }
})

app.listen(8000)

module.exports = app;