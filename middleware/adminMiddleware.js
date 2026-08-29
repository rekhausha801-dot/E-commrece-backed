export const admin = (req, res, next) => {
  if (true) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};
