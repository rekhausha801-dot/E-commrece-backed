import KnowledgeBase from '../models/KnowledgeBase.model.js';

export const getArticles = async (req, res) => {
  try {
    const articles = await KnowledgeBase.find({ status: 'active' }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: articles });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getArticleBySlug = async (req, res) => {
  try {
    const article = await KnowledgeBase.findOneAndUpdate(
      { slug: req.params.slug, status: 'active' },
      { $inc: { views: 1 } },
      { new: true }
    );
    if (!article) return res.status(404).json({ success: false, message: 'Article not found' });
    res.status(200).json({ success: true, data: article });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const articleFeedback = async (req, res) => {
  try {
    const { helpful } = req.body;
    if (helpful === undefined) return res.status(400).json({ success: false, message: 'Helpful status required' });

    const update = helpful ? { $inc: { helpfulCount: 1 } } : { $inc: { notHelpfulCount: 1 } };
    const article = await KnowledgeBase.findByIdAndUpdate(req.params.id, update, { new: true });
    
    if (!article) return res.status(404).json({ success: false, message: 'Article not found' });
    res.status(200).json({ success: true, message: 'Feedback submitted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const createArticle = async (req, res) => {
  try {
    const { title, slug, content } = req.body;
    if (!title || !slug || !content) return res.status(400).json({ success: false, message: 'Title, slug and content required' });

    const existing = await KnowledgeBase.findOne({ slug });
    if (existing) return res.status(409).json({ success: false, message: 'Slug already exists' });

    const newArticle = new KnowledgeBase({ ...req.body, createdBy: req.user._id });
    await newArticle.save();
    res.status(201).json({ success: true, message: 'Article created', data: newArticle });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updateArticle = async (req, res) => {
  try {
    const updated = await KnowledgeBase.findByIdAndUpdate(req.params.id, { ...req.body, updatedBy: req.user._id }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: 'Article not found' });
    res.status(200).json({ success: true, message: 'Article updated', data: updated });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'Slug already exists' });
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const deleteArticle = async (req, res) => {
  try {
    const deleted = await KnowledgeBase.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Article not found' });
    res.status(200).json({ success: true, message: 'Article deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
