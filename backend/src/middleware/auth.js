const jwt = require("jsonwebtoken"); //jsonwebtoken library import ki

const protect = (req, res, next) => { //express middleware that protects route. only logged in users allowed
  let token;

  // Get token from Authorization header (Bearer <token>)
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) { //kya request ke header me authorization hai aur kya wo Bearer se start hota hai. agar haan to token nikal lo
    token = req.headers.authorization.split(" ")[1]; // Authorization header me "Bearer <token>" hota hai, hum split karke sirf token nikal rahe hain
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized to access this route" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Token is not valid" });
  }
};

module.exports = { protect };