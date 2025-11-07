import jwt from "jsonwebtoken";

export function verifyToken(req, res, next) {
  const token = req.cookies.auth_token; //  browser automatically sent it


  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "No token provided" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // verify signature + expiration
    req.user = decoded; // make user info available to route
    next(); // continue to controller
  } catch (err) {
    return res
      .status(403)
      .json({ success: false, message: "Invalid or expired token" });
  }
}
