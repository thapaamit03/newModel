const mongoose=require('mongoose');

const userSchema=mongoose.Schema({
    userName:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    avatar:{
        type:String
    },
    coverImage:{
        type:String
    },
    watchedHistory:{
        type:[
        ]
    },
    refreshToken:{
        type:String
    }

},{timestamps:true})

const userModel=mongoose.model('user',userSchema);

module.exports=userModel