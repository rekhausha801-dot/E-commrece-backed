import FAQ from '../models/FAQ.model.js';

export const getFAQs = async (req, res) => {
  try {
    const { category } = req.query;
    const query = { status: 'active' };
    if (category) query.category = category;

    const faqs = await FAQ.find(query).sort({ sortOrder: 1, createdAt: -1 });
    res.status(200).json({ success: true, data: faqs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const getFAQById = async (req, res) => {
  try {
    const faq = await FAQ.findOne({ _id: req.params.id, status: 'active' });
    if (!faq) return res.status(404).json({ success: false, message: 'FAQ not found' });
    res.status(200).json({ success: true, data: faq });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const createFAQ = async (req, res) => {
  try {
    const { question, answer, category, sortOrder, status } = req.body;
    if (!question || !answer) return res.status(400).json({ success: false, message: 'Question and answer are required' });
    
    const newFaq = new FAQ({
      question, answer, category, sortOrder, status, createdBy: req.user._id
    });
    await newFaq.save();
    res.status(201).json({ success: true, message: 'FAQ created', data: newFaq });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const updateFAQ = async (req, res) => {
  try {
    const updated = await FAQ.findByIdAndUpdate(
      req.params.id, 
      { ...req.body, updatedBy: req.user._id }, 
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: 'FAQ not found' });
    res.status(200).json({ success: true, message: 'FAQ updated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const deleteFAQ = async (req, res) => {
  try {
    const deleted = await FAQ.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'FAQ not found' });
    res.status(200).json({ success: true, message: 'FAQ deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
