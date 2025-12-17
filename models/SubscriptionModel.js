const mongoose=require('mongoose');

const subSchema=mongoose.Schema({
    subscriber:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    },
    channel:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user"
    }
})

const subModel=mongoose.model('subscription',subSchema)

module.exports=subModel;