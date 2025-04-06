/*
  avatar string
  fullName string
  songs ObjectId[] songs
  createdAt Date
  updatedAt Date
*/

import mongoose, {Schema} from "mongoose";

const artistSchema = new Schema(
{
avatar:{
  type:String, // //Cloudinary URL
  required:true,
},
fullName:{
  type:String,
  required:true,
  trim:true,
  index:true

},
song:{
  type:Schema.Types.ObjectId,
  ref:"Song"
},


},{timestamps:true}
)


export const Artist = mongoose.model("Artist", artistSchema)