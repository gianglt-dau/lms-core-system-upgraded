const admissionModel = require('../models/admissionModel');

function validateAdmissionPayload(payload) {
  const { fullName, email, course } = payload;

  if (!fullName || !email || !course) {
    const error = new Error('Vui lòng điền đầy đủ thông tin!');
    error.statusCode = 400;
    throw error;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const error = new Error('Email không hợp lệ!');
    error.statusCode = 400;
    throw error;
  }
}

async function submitAdmission(payload) {
  validateAdmissionPayload(payload);

  return admissionModel.createAdmission({
    fullName: payload.fullName.trim(),
    email: payload.email.trim().toLowerCase(),
    course: payload.course
  });
}

async function listAdmissions() {
  return admissionModel.getAllAdmissions();
}

module.exports = {
  submitAdmission,
  listAdmissions
};
