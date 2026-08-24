import express from 'express';
import {
  getOffers,
  getOfferById,
  createOffer,
  updateOffer,
  deleteOffer
} from '../controllers/offerController.js';

const router = express.Router();

// Public route for customers
router.get('/', getOffers);

// Protected routes for Admins
router.post('/', createOffer);
router.get('/:id', getOfferById);
router.put('/:id', updateOffer);
router.delete('/:id', deleteOffer);

export default router;
