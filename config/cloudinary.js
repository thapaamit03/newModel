const cloudiary=require('cloudinary').v2;

cloudiary.config({
    api_key:process.env.API_KEY,
    api_secret:process.env.API_SECRET,
    cloud_name:process.env.CLOUD_NAME

})

module.exports=cloudiary