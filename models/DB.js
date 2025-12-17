const mongoose=require('mongoose')

const connectToDB=async()=>{
    try{
        await mongoose.connect("mongodb+srv://amitthapa8:12345@cluster0.2vs4oiv.mongodb.net/")
        console.log("database connected successfully");
        
    }catch(e){
        console.log("cannot connect to db",e.message);
     
    }
}

module.exports=connectToDB