const  mongoose  = require("mongoose");

const videoSchema=mongoose.Schema({
    videoFile:{
        type:String,
        required:true
    },
    thumbNail:{
        type:String
    },
    owner:{
        type:mongoose.Types.ObjectId,
        ref:"users"
    },
    title:{
        type:String
    },
    description:{
        type:String
    },
    duration:{
        type:Number
    },
    views:{
        type:Number
    },
    isPublished:{
        type:Boolean,
        default:false
    }
    
},{timestamps:true})

const videoModel=mongoose.model('video',videoSchema);   

module.exports=videoModel;