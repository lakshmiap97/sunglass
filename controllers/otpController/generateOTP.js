const express=require('express')

const  generateOtp = function(){
  let otp = ''
  console.log("getting otp")
  for(let i = 0; i<6; i++){
      otp += Math.floor(Math.random()*10)
  }
  return otp;
}

module.exports=generateOtp;

