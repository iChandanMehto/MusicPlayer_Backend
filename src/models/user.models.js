import mongoose, { Schema} from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new Schema(
    {
username:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true,
    index:true
},
email:{
    type:String,
    required:true,
    unique:true,
    lowercase:true,
    trim:true,

},
fullname:{
    type:String,
    required:true,
    trim:true,
    index:true
},

avatar:{
    type:String, //Cloudinary URL
    required:true,
},
coverImage:{
    type:String, //Cloudinary URL
},

password:{
    type:String,
    required:[true, "password is required"]
},
refreshToken:{
    type:String,
}

    },
    {
        timestamps:true, 
    }
)

userSchema.pre("Save", async function (next){
    //=> fixed in 
if(!this.isModified("password")) return next() //=> if modified field is not password than it will return.
    
    this.password = bcrypt.hash(this.password, 10) //=> here we are using 10 round of hasing.
    next()
})  //=> this is using for encrypting password of user before saving.


userSchema.methods.isPasswordCorrect = async function (password){
    return await bcrypt.compare(password , this.password)
}

userSchema.methods.generateAccessToken = function (){
    // this is short lived token
    jwt.sign({ 
        _id:this.id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
     }, 
     process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
}


userSchema.methods.generateAccessToken = function (){
    // this is short lived token
    jwt.sign({ 
        _id:this.id,
        email: this.email,
        username: this.username,
        fullname: this.fullname
     }, 
     process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
}


export const User = mongoose.model("User", userSchema);



