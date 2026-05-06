const collegeEmailMiddleware = (req, res, next) => {
  const { email } = req.body;

  if (!email || !email.endsWith("@nie.ac.in")) {
    return res.status(403).json({
      message: "Only @nie.ac.in college emails are allowed", //this middleware is used to check if the email provided by the user ends with @nie.ac.in. If not, it returns a 403 error with a message. This is to ensure that only students from NIE can register on the platform.
    });
  }

  next();
};

module.exports = collegeEmailMiddleware;