const express = require('express');
const admissionController = require('../controllers/admissionController');

const router = express.Router();

router.post('/', admissionController.createAdmission);
router.get('/', admissionController.getAdmissions);

module.exports = router;
