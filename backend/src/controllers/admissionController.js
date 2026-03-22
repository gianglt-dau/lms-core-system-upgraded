const admissionService = require('../services/admissionService');

async function createAdmission(req, res, next) {
  try {
    const admission = await admissionService.submitAdmission(req.body);
    return res.status(201).json({
      message: 'Đăng ký thành công!',
      data: admission
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ message: error.message });
    }
    return next(error);
  }
}

async function getAdmissions(req, res, next) {
  try {
    const admissions = await admissionService.listAdmissions();
    return res.status(200).json({
      total: admissions.length,
      data: admissions
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createAdmission,
  getAdmissions
};
