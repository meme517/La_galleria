const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const checkinController = require('../controllers/checkinController');

// Validation rules
const checkinValidation = [
  body('mood').isString().notEmpty().withMessage('Mood is required and must be a string'),
  body('energy').isInt({ min: 1, max: 10 }).withMessage('Energy must be an integer between 1 and 10'),
  body('date').optional().isISO8601().withMessage('Date must be a valid ISO 8601 date'),
  body('notes').optional().isString().withMessage('Notes must be a string')
];

const idValidation = [
  param('id').isMongoId().withMessage('Invalid checkin ID')
];

// Routes
router.get('/', checkinController.getAllCheckins);
router.post('/', checkinValidation, checkinController.createCheckin);
router.put('/:id', idValidation.concat(checkinValidation), checkinController.updateCheckin);
router.delete('/:id', idValidation, checkinController.deleteCheckin);

module.exports = router;
