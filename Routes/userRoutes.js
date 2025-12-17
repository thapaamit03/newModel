const router=require('express').Router();
const {registerUser,login,logout, refreshAccessToken} = require('../controller/userController');
const multerMiddleware=require('../middleware/multerMiddleware')
const jwtVerify=require('../middleware/authMiddleware');
router.post('/register',
    multerMiddleware.fields([
        {name:'avatar', maxCount:1},
        {name:'coverImage',maxCount:1}
    ])
    ,registerUser);

router.post('/login',login);
router.post('/logout',jwtVerify,logout);
router.post('/refresh-token',refreshAccessToken)

module.exports=router;