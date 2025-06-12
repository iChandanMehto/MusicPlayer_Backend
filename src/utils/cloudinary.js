import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";

//configure cloudinary
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key:  process.env.CLOUDINARY_API_KEY,
    api_secret:  process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath)=>{ // => this is for whenever you upload through multer it store and go thorugh local file path / local storage.

    try {
        if(!localFilePath) return null
        const response  = await cloudinary.uploader.upload(
            localFilePath,{
                resource_type:"auto"
            }
        )
        console.log("File Uploaded On Cloudinary. File src:"  + response.url)
        //=> Once the file is uploaded we would like to delete it from our server
        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null
    }
}

export {uploadOnCloudinary}

