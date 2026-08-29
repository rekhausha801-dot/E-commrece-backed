import Guide from '../models/Guide.model.js';

export const getGuides = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { status: 'active' };
    if (category) query.category = category;

    const guides = await Guide.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: guides });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getGuideBySlug = async (req, res) => {
  try {
    const guide = await Guide.findOne({ slug: req.params.slug, status: 'active' });
    if (!guide) return res.status(404).json({ success: false, message: 'Guide not found' });
    res.status(200).json({ success: true, data: guide });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const createGuide = async (req, res) => {
  try {
    const { title, slug, content } = req.body;
    if (!title || !slug || !content) return res.status(400).json({ success: false, message: 'Title, slug and content required' });

    const existing = await Guide.findOne({ slug });
    if (existing) return res.status(409).json({ success: false, message: 'Slug already exists' });

    const newGuide = new Guide({ ...req.body, createdBy: req.user._id });
    await newGuide.save();
    res.status(201).json({ success: true, message: 'Guide created', data: newGuide });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updateGuide = async (req, res) => {
  try {
    const updated = await Guide.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user._id }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Guide not found' });
    res.status(200).json({ success: true, message: 'Guide updated', data: updated });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'Slug already exists' });
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const deleteGuide = async (req, res) => {
  try {
    const deleted = await Guide.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Guide not found' });
    res.status(200).json({ success: true, message: 'Guide deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
