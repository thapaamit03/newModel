const uploadToCloud = require("../helper/cloudinaryUpload");
const userModel=require('../models/userModel')
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken');
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");

const registerUser=async(req,res)=>{
   const {userName,email,password}=req.body;

   if(!userName||!email||!password){
    return res.status(404).json({
        success:false,
        message:"All fields are required"
    })
   }

   const avatarLocalPath=req.files?.avatar[0]?.path;
   const coverImageLocalPath=req.files?.coverImage[0]?.path;
    console.log(avatarLocalPath);
    console.log(coverImageLocalPath);
    
   if(!avatarLocalPath){
        return res.status(400).json({
            sucess:false,
            message:"Avatar file is required"
        })
   }
    const [avatarUrl,coverImageUrl]=await Promise.all([
        uploadToCloud(avatarLocalPath),
        uploadToCloud(coverImageLocalPath)
    ]
    )
  

   const hashedPassword=await bcrypt.hash(password,10);

   const newUser=await userModel.create({
        userName,
        email,
        password:hashedPassword,
        avatar:avatarUrl,
        coverImage:coverImageUrl || ""


   })
   const createdUser=await userModel.findById(newUser._id)
   .select("-password -refreshToken") //remove this field from db

   if(!createdUser){
    return res.status(500).json({
        success:false,
        message:"something went wrong while registering user"
    })
   }
   return res.status(200).json({
    success:true,
    message:"user registered successfully"
   })
}
const login=async(req,res)=>{
    try{
    const{userName,email,password}=req.body;
    if(!email||!password){
        return res.status(404).json({
            success:false,
            message:"all field is required"
        })
    }
    const user=await userModel.findOne({ $or:[{userName},{email}]}); //username or email check
    if(!user){
        return res.status(404).json({
            success:false,
            message:"user not found"
        })
    }

    const isPassowrdMatched=await bcrypt.compare(password,user.password);
    if(!isPassowrdMatched){
        return res.status(401).json({
            success:false,
            message:"incorrect password"
        })
    }
    const accessToken= jwt.sign({email:user.email,_id:user._id},
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn:"15m"}
    )
    const refreshToken=jwt.sign({_id:user._id},
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn:"15d"}
    )
    user.refreshToken=refreshToken;
    await user.save({validateBeforeSave:false});

    const loggedinUser=await userModel.findById(user._id).select("-password -refreshToken")
    const options={
        httpOnly:true,
        secure:true
    }  //object help to protect cookie from client modification and only server can modify

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json({
        message:"user loggedin successfully",
        user:loggedinUser,
        refreshToken:refreshToken,
        accessToken:accessToken
    })
}catch(e){
    console.log("internal server error",e.message);
    
    return res.status(500).json({
        success:false,
        message:"loggedIn failed"
    })
    
}
}
const logout=async(req,res)=>{
    await userModel.findByIdAndUpdate(req.user._id,{
        $set:{
            refreshToken:undefined
        },
    },{ 
      new:true 
    }
    )
    const options={
        httpOnly:true,
        secure:true
    }
    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json({
        success:true,
        message:("user logged out successfully")
    })
}

const refreshAccessToken=async(req,res)=>{
    const incommingRefreshToken=req.cookies.refreshToken || req.body.refreshToken;
        console.log(incommingRefreshToken);
        
    if(!incommingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }

   try {
     const decodedToken=jwt.verify(incommingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
 
     if(!decodedToken){
         throw new ApiError(403,"invalid token")
     }
     
     const user=await userModel.findById(decodedToken._id);
 
     if(!user){
         throw new ApiError(401,"invlaid refresh token")
     }
    
     if(incommingRefreshToken !== user?.refreshToken){
         throw new ApiError(401,"refresh token is expired or used")
     }
     const options={
          httpOnly:true,
         secure:true 
     }
 
     const newRefreshToken=jwt.sign({_id:user._id,email:user.email},
         process.env.REFRESH_TOKEN_SECRET,
         {expiresIn:'6d'}
     )
 
     const accessToken=jwt.sign({_id:user._id},
         process.env.ACCESS_TOKEN_SECRET,
         {expiresIn:"15m"}
     )
 
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newRefreshToken,options)
    .json(new ApiResponse(200,
     {accessToken,refreshToken:newRefreshToken},
     "Accesstoken refreshed successfully"))
 
 
   } catch (e) {
        throw new ApiError(401,e.message || "invalid refresh token ")
   }
}
module.exports={registerUser,login,logout,refreshAccessToken};