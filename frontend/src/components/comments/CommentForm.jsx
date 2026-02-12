import React, { useState } from 'react';
import { FiSend, FiUser, FiMail, FiMessageSquare, FiTag, FiCheck, FiAlertCircle } from 'react-icons/fi';
import { publicAPI } from '../../services/api';

const CommentForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    reason: '',
    message: '',
    category: 'suggestion',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  // Email validation
  const isValidEmail = (email) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };

  // Validate current step
  const validateStep = (currentStep) => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.name.trim()) {
        newErrors.name = 'Name is required';
      } else if (formData.name.trim().length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      }

      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!isValidEmail(formData.email.trim())) {
        newErrors.email = 'Please enter a valid email (e.g., example@gmail.com)';
      }
    }

    if (currentStep === 2) {
      if (!formData.reason.trim()) {
        newErrors.reason = 'Subject/Reason is required';
      } else if (formData.reason.trim().length < 3) {
        newErrors.reason = 'Subject must be at least 3 characters';
      }
    }

    if (currentStep === 3) {
      if (!formData.message.trim()) {
        newErrors.message = 'Comment is required';
      } else if (formData.message.trim().length < 10) {
        newErrors.message = 'Comment must be at least 10 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Go to next step
  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      setServerError('');
    }
  };

  // Go to previous step
  const prevStep = () => {
    setStep(step - 1);
    setErrors({});
    setServerError('');
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setLoading(true);
    setServerError('');

    try {
      const response = await publicAPI.submitComment({
        name: formData.name.trim(),
        email: formData.email.trim(),
        reason: formData.reason.trim(),
        message: formData.message.trim(),
        category: formData.category,
      });

      if (response.data?.success) {
        setSuccess(true);
        setFormData({ name: '', email: '', reason: '', message: '', category: 'suggestion' });
        setStep(1);

        // Reset success after 5 seconds
        setTimeout(() => setSuccess(false), 5000);
      }
    } catch (error) {
      setServerError(error.response?.data?.error || 'Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update form field
  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear error for this field
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  // Success state
  if (success) {
    return (
      <div className="bg-white dark:bg-dark-200 rounded-2xl p-8 border border-gray-200 dark:border-dark-100 text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiCheck className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Thank You!
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Your comment has been submitted successfully. It will be visible after admin approval.
        </p>
      </div>
    );
  }

  const categories = [
    { value: 'suggestion', label: '💡 Suggestion', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
    { value: 'feedback', label: '💬 Feedback', color: 'bg-green-500/10 text-green-500 border-green-500/20' },
    { value: 'bug', label: '🐛 Bug Report', color: 'bg-red-500/10 text-red-500 border-red-500/20' },
    { value: 'feature', label: '✨ Feature Request', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
    { value: 'complaint', label: '⚠️ Complaint', color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    { value: 'other', label: '📝 Other', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' },
  ];

  return (
    <div className="bg-white dark:bg-dark-200 rounded-2xl border border-gray-200 dark:border-dark-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 dark:border-dark-100 bg-gray-50 dark:bg-dark-300">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FiMessageSquare className="w-5 h-5 text-primary-500" />
          Share Your Thoughts
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          We'd love to hear your suggestions and feedback
        </p>
      </div>

      {/* Progress Steps */}
      <div className="px-6 pt-5">
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  step >= s
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-200 dark:bg-dark-100 text-gray-500'
                }`}
              >
                {step > s ? <FiCheck className="w-4 h-4" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`flex-1 h-1 rounded-full transition-all ${
                    step > s ? 'bg-primary-600' : 'bg-gray-200 dark:bg-dark-100'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between mb-4">
          <span className={step >= 1 ? 'text-primary-500 font-medium' : ''}>Your Info</span>
          <span className={step >= 2 ? 'text-primary-500 font-medium' : ''}>Subject</span>
          <span className={step >= 3 ? 'text-primary-500 font-medium' : ''}>Message</span>
        </div>
      </div>

      {/* Server Error */}
      {serverError && (
        <div className="mx-6 mb-4 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
          <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-400 text-sm">{serverError}</p>
        </div>
      )}

      {/* Form Content */}
      <div className="px-6 pb-6">
        {/* Step 1: Name & Email */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Name *
              </label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="John Doe"
                  className={`w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-dark-100 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                    errors.name ? 'border-red-500' : 'border-gray-200 dark:border-dark-100'
                  }`}
                  autoFocus
                />
              </div>
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address *
              </label>
              <div className="relative">
                <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="example@gmail.com"
                  className={`w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-dark-100 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                    errors.email ? 'border-red-500' : 'border-gray-200 dark:border-dark-100'
                  }`}
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              <p className="text-gray-500 text-xs mt-1">Your email won't be displayed publicly</p>
            </div>

            {/* Next Button */}
            <button
              onClick={nextStep}
              className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all mt-2"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2: Reason/Subject & Category */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => updateField('category', cat.value)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                      formData.category === cat.value
                        ? cat.color + ' ring-2 ring-offset-1 ring-offset-transparent'
                        : 'bg-gray-50 dark:bg-dark-100 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-dark-100 hover:bg-gray-100 dark:hover:bg-dark-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject/Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject / Reason *
              </label>
              <div className="relative">
                <FiTag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => updateField('reason', e.target.value)}
                  placeholder="e.g., Add dark mode, Fix video player"
                  className={`w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-dark-100 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all ${
                    errors.reason ? 'border-red-500' : 'border-gray-200 dark:border-dark-100'
                  }`}
                  autoFocus
                />
              </div>
              {errors.reason && <p className="text-red-500 text-xs mt-1">{errors.reason}</p>}
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={prevStep}
                className="flex-1 py-3 bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-dark-200 transition-all"
              >
                ← Back
              </button>
              <button
                onClick={nextStep}
                className="flex-1 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Message */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in">
            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Comment / Suggestion *
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => updateField('message', e.target.value)}
                placeholder="Share your thoughts, ideas, or feedback..."
                rows={5}
                className={`w-full px-4 py-3 bg-gray-50 dark:bg-dark-100 border rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none transition-all ${
                  errors.message ? 'border-red-500' : 'border-gray-200 dark:border-dark-100'
                }`}
                autoFocus
              />
              {errors.message && <p className="text-red-500 text-xs mt-1">{errors.message}</p>}
              <p className="text-gray-500 text-xs mt-1 text-right">
                {formData.message.length}/2000
              </p>
            </div>

            {/* Summary */}
            <div className="bg-gray-50 dark:bg-dark-100 rounded-xl p-4 space-y-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-medium">Summary</p>
              <div className="text-sm">
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="text-gray-500">From:</span> {formData.name}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="text-gray-500">Subject:</span> {formData.reason}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                  <span className="text-gray-500">Category:</span> {categories.find(c => c.value === formData.category)?.label}
                </p>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 mt-2">
              <button
                onClick={prevStep}
                className="flex-1 py-3 bg-gray-100 dark:bg-dark-100 text-gray-700 dark:text-gray-300 font-medium rounded-xl hover:bg-gray-200 dark:hover:bg-dark-200 transition-all"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FiSend className="w-4 h-4" />
                    Submit
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentForm;