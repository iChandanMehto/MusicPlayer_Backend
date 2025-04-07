import { Router } from "express";

import { registerUser } from "../controllers/user.controllers";
import {upload} from '../middlewares/multer.middlewares.js'

const router = Router()

// api/v1/healthcheck/test
router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount: 1
        }, {
            name:"coverImage",
            maxCount: 1
        }
    ]),    //=> we are using fileds because we are required avater and cover image of user.
     registerUser )

export default router
