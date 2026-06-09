import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  try {
    const token = req.cookies.access_token;

    if (!token) {
      return res.status(401).json({ message: "No token, access denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (error) {
    console.error("Token verification error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
