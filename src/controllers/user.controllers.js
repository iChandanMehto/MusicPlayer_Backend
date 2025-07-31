import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User } from '../models/user.models.js'
import {uploadOnCloudinary, deleteFromCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async(userId)=>{
try {
        const user  = await User.findById(userId)
        // small  check for user existence
        if(!user){
            throw new ApiError(401, "User is not registerd due to regresh token issue!");
        }
    
        const accessToken = user.generateAccessToken()
       const refreshToken =  user. generateRefreshToken()
    
       user.refreshToken = refreshToken
       await user.save({validateBeforeSave:false})
       return {accessToken, refreshToken}
} catch (error) {
    throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
}
   
}

const registerUser = asyncHandler(async (req , res)=>{
const {fullname , email , username, password}  = req.body

//=> validation part : 
if(
[fullname , email , username, password].some((field=>field?.trim()===""))
){
throw new ApiError(400, "All rields are required")

}

const existedUser = await User.findOne({
    $or:[{username}, {email}]
})

if(existedUser){
    throw new ApiError(409, "User with email or username already exists")
}
console.warn(req.files)
const avatarLocalPath = req.files?.avatar?.[0]?.path //=> coding this for fetching avatar of user from cloudinary.
const coverImageLocalPath = req.files?.coverImage?.[0]?.path  //=> creating this for fetching images of user's cover image from  cloudinary.

if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is missing")
}

// const avatar = await uploadOnCloudinary(avatarLocalPath) //=> this is for user's avatr

// let coverImage = ""
// if(coverImage){
//  await uploadOnCloudinary(coverImageLocalPath) //=> this is for user's coverImag
// }

let avatar ;

try {

   avatar =  await uploadOnCloudinary(avatarLocalPath)
   console.log("Upload avatar", avatar)
} catch (error) {
    console.log("Error uploading avatar:", error)
        throw new ApiError(500, " Failed to upload avatar ")
}


let  coverImage ;

try {

 coverImage =  await uploadOnCloudinary(coverImageLocalPath)
   console.log("Upload avatar", coverImage)
} catch (error) {
    console.log("Error uploading coverImage", error)
        throw new ApiError(500, " Failed to upload coverImage ")
}



try {
    const user = await  User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email, 
        password,
        username: username.toLowerCase()
    })  //=> in this its all coming from database
    
    const createdUser = await User.findById(user._id).select( //=> for deselecting we have to use select() method 
    "-password -refreshToken"
    )   //=> this is for veryfing wether this user was created or not.
    
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering  a user ")
    
    }
    
    return res
    .status(201)
    .json(new ApiResponse(201, "User registerd succesfully"))
    
} catch (error) {
    console.log("User creation failed");
    if(avatar){
        deleteFromCloudinary(avatar.public_id)
    }
    if(coverImage){
        deleteFromCloudinary(coverImage.public_id)
    }

        throw new ApiError(500, "Something went wrong while registering  a user  and images were deleted");

}
})

const loginUser = asyncHandler(async(req, res)=>{
// get data from body
const {email, username, password} = req.body

//validation
if(!email){
    throw new ApiError(400,"email is required");
}

const user = await User.findOne({
    $or:[{username}, {email}]
})

if(!user){
    throw new ApiError(404, "User not found")

}

const isPasswordValid = await user.isPasswordCorrect (password)

if(!isPasswordValid){
    throw new ApiError(404, "Invalid credentials");
}

const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

const loggedInUser = await User.findById(user._id)
.select("-password,  -refreshToken");
//=> here create is use log in or not.

const options = {
    httpOnly:true,
    secure:process.env.NODE_ENV ==="production",
}


    return res
    .status(200)
    .cookie("accesToken", accessToken, options )
    .cookie("refreshToken", refreshToken, options )
    .json(new ApiResponse(
        200, 
        {  user:loggedInUser,accessToken, refreshToken},
        "User logged in successfully"
    ))  //=> this is for mobile visit because when we use website in moble it react towards cookie diffrently.

})

const logoutUser = asyncHandler(async(req, res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined,
            }
        },
        {new:true}

    )

    const options = {
        httpOnly:true,
        secure:process.env.NODE_ENV === "production"
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async(req, res)=>{
    const incomingRefreshToken = req.cookie.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401, "Refresh toke is required"); 
    }

    try {
   const decodedToken =  jwt.verify(
         incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
    )

    const user = await  User.findById(decodedToken?._id)
    if(!user){
        throw new ApiError(401,"Invalid refresh token");  
    }

    if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401, "Invalid refresh token");
       
    }

    const options = {
        httpOnly:true,
        secure:process.env.NODE_ENV === "production",
    }

   const {accessToken, refreshToken:newRefreshToken} = generateAccessAndRefreshToken(user._id)
return res
.status()
.cookie("accessToken", accessToken, options)
.json(
    new ApiResponse(
        200, 
        {
            accessToken,
            refreshToken:newRefreshToken,

        },
        "Access token refreshed successfully"
    )
);
    

    } catch (error) {
        throw new ApiError(500,"Something went wrong while refreshing  access token");
        
    }
})

const changeCurrentPassword = asyncHandler(async(req, res)=>{
    const {oldPassword, newPassword} = req.body

    const user = await User.findByIdAndDelete(req.user?._id)

    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if(!isPasswordValid){
        throw new ApiError(401, "Old password is incorrect")
    }

    user.password = newPassword;

    await user.save({validateBeforeSave:false})

    return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))

})

const getCurrentUser = asyncHandler(async(req, res)=>{
    return res.status(200).json(new ApiResponse(200, req.user, "Current user details"))
})

const updateAccountDetails = asyncHandler(async(req, res)=>{
const {fullname, email} = req.body

if(!fullname || !email){
    throw new ApiError(400, "Fullname and email are required");
}

const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            fullname,
            email: email
        }
    },
    {new:true}
).select("-password -refreshToken")

return res.status(200).json( new ApiResponse(200, user , "Account details updated successfully"))
})

const updateUserAvatar= asyncHandler(async(req, res)=>{
   const avatarLocalPath =  req.file?.path

   if(!avatarLocalPath){
    throw new ApiError(400,"File is required");
   }

 const avatar =   await uploadOnCloudinary(avatarLocalPath)

 if(!avatar.url){
    throw new ApiError(500,"Something went wrong while uploading avatar");
 }

 const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            avatar:avatar.url
        }
    },
    {new:true}
 ).select("-password -refreshToken")

 res.status(200).json(new ApiResponse(200, user, "Avatar updated successfully"))
})



const updateUserCoverImage= asyncHandler(async(req, res)=>{
    const coverImageLocalPath =req.file?.path

    if(!coverImageLocalPath){
        throw new ApiError(400,"File is required");  
    }
   const coverImage =  uploadOnCloudinary(coverImageLocalPath)

   if(!coverImage){
    throw new ApiError(500, "Something went wrong while uploading cover image");
   }
   const user  = await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
            coverImage: coverImage.url
        }
    },
    {new:true}
   ).select("-password -refreshToken")

   return res.status(200).json(new ApiResponse(200, user, "Cover image updated succcessfully"))

})


const getUserChannelProfile = asyncHandler(async(req, res)=>{
   const {username} =  req.params
   if(!username?.trim()){
    throw new ApiError(400, "username is required")
   }

   const channel = await User.aggregate(
    [
      {
          $match:{
            username: username?.toLowerCase()
        }
      },
    ]
   )
})


export{
    registerUser ,
    loginUser,
    refreshAccessToken,
    logoutUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile
}
