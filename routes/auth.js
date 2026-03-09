var express = require('express');
var router = express.Router();
let userController = require('../controllers/users');
let jwt = require('jsonwebtoken')
let { checkLogin } = require('../utils/authHandler.js')

/* GET home page. */
//localhost:3000
router.post('/register', async function (req, res, next) {
    let newUser = await userController.CreateAnUser(
        req.body.username,
        req.body.password,
        req.body.email,
        "69a5462f086d74c9e772b804"
    )
    res.send({
        message: "dang ki thanh cong"
    })
});
router.post('/login', async function (req, res, next) {
    let result = await userController.QueryByUserNameAndPassword(
        req.body.username, req.body.password
    )
    let token = jwt.sign({
        id: result.id
    }, 'secret', {
        expiresIn:'1h'
    })
    res.send(token)
});
router.get('/me', checkLogin,async function(req,res,next){
    console.log(req.userId);
    let getUser = await userController.FindUserById(req.userId);
    res.send(getUser);
})


module.exports = router;
