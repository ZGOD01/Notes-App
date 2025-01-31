require("dotenv").config();

const config = require("./config.json");
const mongoose = require("mongoose")

mongoose.connect(config.connectionString)

const User = require("./models/user.model")

const express = require('express')
const cors = require('cors');
const app = express()   

const jwt = require("jsonwebtoken")
const { authenticateToken} = require("./utilities")

app.use(express.json())

app.use(
    cors({
        origin : '*',
    })
)

app.get('/',(req , res) =>{
    res.json({ data : "hello" })
} )

// Create Account
app.post('/create-account', async (req , res) =>{ 
    const { fullName , email , password} = req.body;

    if(!fullName) {
        return res
            .status(400)
            .json({ error : true , message : "Please enter your full name" })
    }

    if(!email) {
        return res
            .status(400)
            .json({ error : true , message : "Please enter your email" })
    }

    if(!password) {
        return res
            .status(400)
            .json({ error : true , message : "Please enter your password" })
    }

    const isUser = await User.findOne({ email: email})

    if(isUser){
        return res
            .status(400)
            .json({ error : true , message : "User already exists" })
    }

    const user = new User({
        fullName,
        email,
        password
    });

    await user.save();

    const accessToken = jwt.sign({ user} , process.env.ACCESS_TOKEN_SECRET , {
        expiresIn : '36000m'
    })

    return res.json({
        error : false,
        user,
        accessToken,
        message : "Registration successful"
    })
})

app.post('/login', async (req , res) =>{
    const {email, password} = req.body;

    if(!email) {
    return res
     .status(400)
     .json({ error : true , message : "Email is required" })
    }

    if(!password) {
    return res
     .status(400)
     .json({ error : true , message : "Password is required" })
    }

    const userInfo = await User.findOne({
        email : email,
    })

    if(!userInfo) {
    return res
     .status(401)
     .json({  message : "User not Found" })
    }

    if(userInfo.email === email  && userInfo.password === password) {
        const user = { user : userInfo}
        const accessToken = jwt.sign(user , process.env.ACCESS_TOKEN_SECRET, {
            expiresIn : "36000m",
        });

        return res.json({
            error : false,
            message : "Login Successful",
            email,
            accessToken,
        })
    } else{
        return res
         .status(401)
         .json({ error : true, message : "Invalid Credentials" })    
    }
})

app.listen(8000)

module.exports = app;