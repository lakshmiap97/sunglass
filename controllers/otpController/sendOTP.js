const nodemailer = require('nodemailer');
require('dotenv').config()
// Function to send OTP to the user's email
async function sendOtpMail(email, otp) {
    // Create a transporter object using SMTP transport
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.NODEMAIL, // Your Gmail email address
            pass: process.env.NODEPASS // Your generated password
        }
    });

    // Email content
    let mailOptions = {
        from: process.env.NODEMAIL,
        to: email,
        subject: 'OTP for Registration',
        text: `Your OTP for registration is: ${otp}. It expires in 1 minute.`
    };

  transporter.sendMail(mailOptions,(error,info)=>{
    if(error){
        console.log(error.message);
    }else{
        console.log("OTP has send ")
        const otpExpiration =  Date.now() + 60*1000;
         req.session.otpExpiration = otpExpiration
        res.status(200).json({message: 'resend success'})
        
    }
  })
}




module.exports = sendOtpMail
