const jwt = require("jsonwebtoken");

const secret = "worldsbestsecret";
const expiration = "2h";

module.exports = {
    signToken: function({username, email, _id}) {
        const payload = {username, email, _id}
        return jwt.sign({data: payload}, secret, {expiresIn: expiration});
    },

    authMiddleware: function({req}) {
        let token = req.body.token || req.query.token || req.headers.authorization;

        // Remove "Bearer" from "<tokenvalue>"
        if(req.headers.authorization) {
            token = token.split(" ").pop().trim();
        }

        // If no token, return request object as is
        if(!token) {
            return req;
        }

        try {
            const {data} = jwt.verify(token, secret, {maxAge: expiration});
            req.user = data;
        }
        catch {
            console.log("Invalid token");
        }

        // Return the updated request object
        return req;
    }
}