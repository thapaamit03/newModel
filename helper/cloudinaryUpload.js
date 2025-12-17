const cloudinary=require('../config/cloudinary');
const fs=require('fs')
const uploadToCloud=async(filePath)=>{
    try{
        if(!filePath){
            throw new Error("file path is required")
        }
       const response= await cloudinary.uploader.upload(filePath,{
            folder:'public',
            resource_type:"auto"
        })
        fs.unlinkSync(filePath);

        return response.secure_url;
    }catch(e){
        console.log("cloudinary upload error  ",e.message);
        
    }

}

module.exports=uploadToCloud;