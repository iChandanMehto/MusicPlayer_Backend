// name string
// description string
// createdAt Date
// updatedAt Date

import mongoose, {Schema} from "mongoose";

const genreSchema = new Schema({
    name: {
         type: String, required: true, unique: true
         }, 
    description:{
        type:String, 
    }

},{timestamps:true})

export const Genre = mongoose.model("Genre", genreSchema)