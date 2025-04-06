
/*
owner ObjectId users
songs ObjectId[] songs
name string
description string
isPublic boolean
createdAt Date
updatedAt Date

*/

import mongoose, {Schema} from "mongoose";


const playlistSchema = new Schema(
    {
        name:{
            type:String,
            required:true,
        },
        description:{
            type:String,
            required:true,
        },
        songs:{
            type:Schema.Types.ObjectId,
            ref:"Song",
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User",
        },
    },
    {timestamps:true}
)

export const Playlist = mongoose.model("Playlist", playlistSchema);