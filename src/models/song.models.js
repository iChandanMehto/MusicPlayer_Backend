import mongoose, {Schema} from "mongoose";
/*
title string
description string
thumbnail string
Artist ObjectId artist
AddedBy ObjectId users
Genre string
albumId ObjectId albums
AudioFile URL string
createdAt Date
updatedAt Date

*/

const songSchema = new Schema(
{
    AudioFile:{
        type:String,  //cloudinary url
        required:true,

    },
    thumbnail:{
        type:String, //cloudinary url
        required:true,
    },
    title:{
        type:String, 
        required:true,
    },
    description :{
        type:String,
        required:true,
    },
 duration:{
    type:String,
    required:true,
 },
 Genre :{
    type:Schema.Types.ObjectId,
    ref:"Genre",
 },
 owner:{
    type:Schema.Types.ObjectId,
    ref:"User"
 }

},
{
timestamps:true,
}
)

export const Song = mongoose.model("Song",songSchema )