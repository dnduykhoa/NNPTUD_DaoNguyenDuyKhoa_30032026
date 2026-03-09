let jwt = require('jsonwebtoken')
module.exports = {
    checkLogin: async function (req, res, next) {
        let token = req.headers.authorization;
        if (!token || !token.startsWith("Bearer")) {
            res.status(403).send("ban chua dang nhap")
            return;
        }
        token = token.split(' ')[1];
        let result = jwt.verify(token, 'secret');
        if (result && result.exp * 1000 > Date.now()) {
            req.userId = result.id;
            next();
        } else {
            res.status(403).send("ban chua dang nhap")
        }
    }
}