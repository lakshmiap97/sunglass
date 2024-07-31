const mongoose = require('mongoose');
// mongoose.connect('mongodb://127.0.0.1:27017/MyShade' );
mongoose.connect('mongodb+srv://lakshmiap97:Lakshmi%40107@cluster0.zilp8md.mongodb.net/' )
.then(() => console.log("MongoDB connected"));
require('dotenv').config()
const path = require('path')
const session = require('express-session')
const PORT=process.env.PORT||7000
const cors=require('cors')
//------------Express importing-------------------
const express = require('express');
const app = express(); 
// const path=require('path')
//========================================

app.set("view engine","ejs")
app.use(express.static(path.join(__dirname,'./public')));

app.use("/assets",express.static(path.join(__dirname,'/assets')))
app.use("/assets",express.static(path.join(__dirname,'/assets')))


app.use(session({
    secret:process.env.secret,
    resave:false,
    saveUninitialized:true
}))



//------------user-----------------
const userRouter =require('./routes/userRouter');
app.use('/',userRouter);


const adminRouter=require('./routes/adminRouter')
app.use('/',adminRouter)

app.listen(7000,()=>console.log('Server running on localhost:7000'))
