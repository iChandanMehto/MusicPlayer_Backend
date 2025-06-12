import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from '../models/user.models.js'
import {uploadOnCloudinary} from '../utils/cloudinary.js'
import {ApiResponse} from '../utils/ApiResponse.js'



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

const avatarLocalPath = req.files?.avatar[0]?.path //=> coding this for fetching avatr of user from cloudinary.
const coverImageLocalPath = req.files?.coverImage[0]?.path  //=> creating this for fetching images of user's cover image from  cloudinary.

if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is missing")
}

const avatar = await uploadOnCloudinary(avatarLocalPath) //=> this is for user's avatr

let coverImage = ""
if(coverImage){
 await uploadOnCloudinary(coverImageLocalPath) //=> this is for user's coverImag
}


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

})

export{
    registerUser 
}