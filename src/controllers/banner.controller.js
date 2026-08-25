import Banner from '../models/banner.model.js';
import fs from 'fs';
import path from 'path';

export const createBanner = async (req, res) => {
  try {
    const { title, description, type, textPosition, placement, link, status, startDate, endDate } = req.body;
    let image = '';
    
    if (req.file) {
      image = `/uploads/banners/${req.file.filename}`;
    } else if (type !== 'text') {
      return res.status(400).json({ success: false, message: 'Media file is required for this banner type' });
    }

    const banner = await Banner.create({
      title,
      description,
      type,
      textPosition,
      placement,
      image,
      link,
      status: status === 'true' || status === true,
      startDate,
      endDate
    });

    res.status(201).json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getBanners = async (req, res) => {
  try {
    const banners = await Banner.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getActiveBanners = async (req, res) => {
  try {
    const currentDate = new Date();
    const banners = await Banner.find({
      status: true,
      $or: [
        { startDate: { $lte: currentDate }, endDate: { $gte: currentDate } },
        { startDate: null, endDate: null },
        { startDate: { $exists: false }, endDate: { $exists: false } }
      ]
    }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    let banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    const { title, description, type, textPosition, link, status, startDate, endDate } = req.body;

    const updateData = {
      title,
      description,
      type,
      textPosition,
      placement,
      link,
      status: status === 'true' || status === true,
      startDate,
      endDate
    };

    if (req.file) {
      updateData.image = `/uploads/banners/${req.file.filename}`;
      
      // Optional: remove old image file
      if (banner.image) {
        const oldImagePath = path.join(process.cwd(), banner.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
    }

    banner = await Banner.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    res.status(200).json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    if (banner.image) {
      const imagePath = path.join(process.cwd(), banner.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Banner.findByIdAndDelete(id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleBannerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);

    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    banner.status = !banner.status;
    await banner.save();

    res.status(200).json({ success: true, data: banner });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
