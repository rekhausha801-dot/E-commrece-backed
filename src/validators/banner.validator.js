export const validateBanner = (req, res, next) => {
  const { title, type } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, message: 'Title is required' });
  }
  if (!req.file && req.method === 'POST') {
    return res.status(400).json({ success: false, message: 'Image is required' });
  }
  next();
};
