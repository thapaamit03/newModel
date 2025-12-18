const uploadToCloud = require("../helper/cloudinaryUpload");
const userModel = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const ApiResponse = require("../utils/ApiResponse");



const registerUser = async (req, res) => {
  const { userName, email, password } = req.body;

  if (!userName || !email || !password) {
    return res.status(404).json({
      success: false,
      message: "All fields are required",
    });
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  console.log(avatarLocalPath);
  console.log(coverImageLocalPath);

  if (!avatarLocalPath) {
    return res.status(400).json({
      sucess: false,
      message: "Avatar file is required",
    });
  }
  const [avatarUrl, coverImageUrl] = await Promise.all([
    uploadToCloud(avatarLocalPath),
    uploadToCloud(coverImageLocalPath),
  ]);

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await userModel.create({
    userName,
    email,
    password: hashedPassword,
    avatar: avatarUrl,
    coverImage: coverImageUrl || "",
  });
  const createdUser = await userModel
    .findById(newUser._id)
    .select("-password -refreshToken"); //remove this field from db

  if (!createdUser) {
    return res.status(500).json({
      success: false,
      message: "something went wrong while registering user",
    });
  }
  return res.status(200).json({
    success: true,
    message: "user registered successfully",
  });
};
const login = async (req, res) => {
  try {
    const { userName, email, password } = req.body;
    if (!email || !password) {
      return res.status(404).json({
        success: false,
        message: "all field is required",
      });
    }
    const user = await userModel.findOne({ $or: [{ userName }, { email }] }); //username or email check
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }

    const isPassowrdMatched = await bcrypt.compare(password, user.password);
    if (!isPassowrdMatched) {
      return res.status(401).json({
        success: false,
        message: "incorrect password",
      });
    }
    const accessToken = jwt.sign(
      { email: user.email, _id: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );
    const refreshToken = jwt.sign(
      { _id: user._id },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "15d" }
    );
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    const loggedinUser = await userModel
      .findById(user._id)
      .select("-password -refreshToken");
    const options = {
      httpOnly: true,
      secure: true,
    }; //object help to protect cookie from client modification and only server can modify

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json({
        message: "user loggedin successfully",
        user: loggedinUser,
        refreshToken: refreshToken,
        accessToken: accessToken,
      });
  } catch (e) {
    console.log("internal server error", e.message);

    return res.status(500).json({
      success: false,
      message: "loggedIn failed",
    });
  }
};
const logout = async (req, res) => {
  await userModel.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json({
      success: true,
      message: "user logged out successfully",
    });
};

const refreshAccessToken = async (req, res) => {
  const incommingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  console.log(incommingRefreshToken);

  if (!incommingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }

  try {
    const decodedToken = jwt.verify(
      incommingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    if (!decodedToken) {
      throw new ApiError(403, "invalid token");
    }

    const user = await userModel.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "invlaid refresh token");
    }

    if (incommingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "refresh token is expired or used");
    }
    const options = {
      httpOnly: true,
      secure: true,
    };

    const newRefreshToken = jwt.sign(
      { _id: user._id, email: user.email },
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "6d" }
    );

    const accessToken = jwt.sign(
      { _id: user._id },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "15m" }
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Accesstoken refreshed successfully"
        )
      );
  } catch (e) {
    throw new ApiError(401, e.message || "invalid refresh token ");
  }
};
const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await userModel.findById(req.user?._id); //middleware bata req.user

  const isPassowrdMatched = await bcrypt.compare(oldPassword, user.password);

  if (!isPassowrdMatched) {
    throw new ApiError(400, "incorrect password");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"));
};
const getCurrentUser = async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
};
const updateAccountDetails = async (req, res) => {
  const { userName, email } = req.body;

  if (!userName || !email) {
    throw new ApiError(400, "all fields are required");
  }

  try {
    const user = await userModel
      .findByIdAndUpdate(
        req?.user?._id,
        {
          $set: {
            userName,
            email,
          },
        },
        { new: true }
      )
      .select("-password");

    return res
      .status(200)
      .json(new ApiResponse(200, user, "Account details updated successfully"));
  } catch (e) {
    throw new ApiError(400, e.message);
  }
};
const updateUserAvatar = async (req, res) => {
  const avatarLocalPath = req?.file.path;

  if (!avatarLocalPath) {
    throw new ApiError(404, "avatar image file is required");
  }

  
  const { avatarUrl } = await uploadToCloud(avatarLocalPath);

  if (!avatarUrl) {
    throw new ApiError(404, "error while uploading avatar");
  }
  const user = await userModel.findByIdAndUpdate(
    req?.user._id,
    {
      $set: {
        avatar: avatarUrl,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar image updated successfully"));
};

const updateCoverImage = async (req, res) => {
  const coverImagelocalPath = req?.file.path;

  if (!coverImagelocalPath) {
    throw new ApiError(404, "coverimage file is missing");
  }

  const { coverImageUrl } = await uploadToCloud(coverImagelocalPath);

  if (!coverImageUrl) {
    throw new ApiError(404, "error while uploading cover image");
  }

  const user = userModel.findByIdAndUpdate(
    req?.user?._id,
    {
      $set: {
        coverImage: coverImageUrl,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, user, "user coverimage updated successfully "));
};

const getUserChanelProfile=async(req,res)=>{

      const userName=req.params;
      if(!userName){
        throw new ApiError(400,"username is missing");
      }

      const channel=await userModel.aggregate([
        {
          $match:{
            userName:userName     //return one matched document
          }
        },{
          $lookup:{  // user model and subscription model are joined based on id and channel field 
                            //and return new subscribers document
                                      
            from:"subscriptions",
            localField:"_id",
            foreignField:"channel",
            as:"subscribers"
          }
        },{
            $lookup:{     //retrun subscribedTo document
              from:"subscriptions",
              localField:"_id",
              foreignField:"subscriber",
              as:"subscribedTo"
            }
        },{
          $addFields:{        //add new field 
            subscribersCount:{ 
              $size:"$subscribers"  //count from field subscribers
            },
            channelSubscribedCount:{    //count from field subscribedTo
              $size:"$subscribedTo"
            },
            isSubscribed:{          
              $cond:{
                if:{$in:[req.user?._id,"$subscribers.subscriber"]},  //check whether the  user is available in the subscribers document or not
                then:true,
                else:false
              }
            }
            
          }
        },
        {
          $project:{          //provied only prjected field   
            userName:1,
            subscribersCount:1,
            channelSubscribedCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1,
            email:1
          }
        }
        
      ])
      console.log(channel);

      if(!channel?.length){
        throw new ApiError(404,"channel doesnot exist")
      }

      return res.status(200)
      .json(new ApiResponse(200,channel[0],"user channel fetched successfully"))
      

}
const getWatchedHistory=async(req,res)=>{
        const user=await userModel.aggregate([
          {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },{
          $lookup:{
              from:"videos",
              localField:"watchHistory",
              foreignField:"_id",
              as:"watchHistory",
              pipeline:[
                {
                  $lookup:{
                    from:"users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"owner",
                    pipeline:[
                      {
                        $project:{
                          userName:1,
                          avatar:1
                        }
                      },{
                        $addFields:{
                          owner:{
                            $first:"$owner"     //return owner array first element or object 
                          }
                        }
                      }
                    ]
                  }
                }
              ]
          }
        }
      
      ])

      return res.status(200).
      json(new ApiResponse(200,user[0].watchHistory,"Watched history fetched successfully"))
}
module.exports = {
  registerUser,
  login,
  logout,
  refreshAccessToken,
  changePassword,
  updateAccountDetails,
  getCurrentUser,
  updateUserAvatar,
  updateCoverImage,
  getUserChanelProfile,
  getWatchedHistory
};
