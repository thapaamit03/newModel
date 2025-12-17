const userModel=require('../models/userModel');
const jwt=require('jsonwebtoken');

 const jwtVerify=async(req,res,next)=>{

    try {
        const Token=req.cookies.accessToken || req.headers.authorization?.replace("Bearer", "");
        console.log(Token);
        
        if(!Token){
            return res.status(401).json({
                success:false,
                message:"unauthorized token"
            })
        }
        const decodedToken=jwt.verify(Token,process.env.ACCESS_TOKEN_SECRET);
    
        const user=await userModel.findById(decodedToken._id).select("-password -refreshToken")
    
        if(!user){
            return res.status(404).json({
                success:false,
                message:"invalid access token"
            })
        }
        req.user=user;
        next()
    
    
    } catch (e) {
        return res.status(401).json({success:false,message:"invalid access token"})
        
    }
}

module.exports=jwtVerify;