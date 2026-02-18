const express = require('express');
const { body } = require('express-validator');
const bookingController = require('../controllers/bookingController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

// Validation rules
const bookingValidation = [
  body('room')
    .isMongoId()
    .withMessage('Valid room ID is required'),
  body('checkInDate')
    .isISO8601()
    .withMessage('Valid check-in date is required')
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error('Check-in date cannot be in the past');
      }
      return true;
    }),
  body('checkOutDate')
    .isISO8601()
    .withMessage('Valid check-out date is required')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.checkInDate)) {
        throw new Error('Check-out date must be after check-in date');
      }
      return true;
    }),
  body('numberOfGuests')
    .isInt({ min: 1, max: 10 })
    .withMessage('Number of guests must be between 1 and 10'),
  body('phone')
    .notEmpty()
    .withMessage('Phone number is required')
    .trim(),
  body('specialRequests')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Special requests cannot exceed 500 characters')
    .trim()
];

const bookingUpdateValidation = [
  body('room')
    .optional()
    .isMongoId()
    .withMessage('Valid room ID is required'),
  body('checkInDate')
    .optional()
    .isISO8601()
    .withMessage('Valid check-in date is required'),
  body('checkOutDate')
    .optional()
    .isISO8601()
    .withMessage('Valid check-out date is required'),
  body('numberOfGuests')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('Number of guests must be between 1 and 10'),
  body('phone')
    .optional()
    .trim(),
  body('specialRequests')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Special requests cannot exceed 500 characters')
    .trim()
];

// All routes require authentication
router.use(authenticateToken);

// Customer routes
router.post('/', authorizeRoles('customer'), bookingValidation, bookingController.createBooking);
router.get('/my-bookings', authorizeRoles('customer'), bookingController.getCustomerBookings);
router.put('/:id/cancel', authorizeRoles('customer'), bookingController.cancelBooking);

// Admin/Service provider routes
router.get('/', authorizeRoles('admin', 'serviceProvider'), bookingController.getAllBookings);
router.put('/:id', authorizeRoles('admin', 'serviceProvider'), bookingUpdateValidation, bookingController.updateBooking);
router.delete('/:id', authorizeRoles('admin', 'serviceProvider'), bookingController.deleteBooking);

// Shared routes
router.get('/:id', bookingController.getBooking);

module.exports = router;
