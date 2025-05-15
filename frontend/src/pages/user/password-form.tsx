import React, { useState } from 'react';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';

export default function PasswordForm() {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: typeof formData) => ({ ...prev, [name]: value }));

    // Clear errors when typing
    if (errors[name as keyof typeof errors]) {
      setErrors((prev: typeof errors) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = () => {
    const newErrors: {
      currentPassword?: string;
      newPassword?: string;
      confirmPassword?: string;
    } = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);

    try {
      await axios.post('/api/user/pw/update', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });

      toast.success('Password updated successfully');
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Error updating password:', error.response);

        if (error.response?.status === 401) {
          setErrors({ currentPassword: 'Current password is incorrect' });
          toast.error('Current password is incorrect');
        } else {
          toast.error('Failed to update password');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="currentPassword"
          className="block text-sm font-medium text-gray-700 dark:text-slate-200"
        >
          Current Password
        </label>
        <input
          type="password"
          id="currentPassword"
          name="currentPassword"
          value={formData.currentPassword}
          onChange={handleChange}
          className={`w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-pink-400 ${
            errors.currentPassword ? 'border-red-500 dark:border-red-400' : ''
          }`}
        />
        {errors.currentPassword && (
          <p className="text-sm text-red-600 dark:text-red-400">{errors.currentPassword}</p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="newPassword"
          className="block text-sm font-medium text-gray-700 dark:text-slate-200"
        >
          New Password
        </label>
        <input
          type="password"
          id="newPassword"
          name="newPassword"
          value={formData.newPassword}
          onChange={handleChange}
          className={`w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-pink-400 ${
            errors.newPassword ? 'border-red-500 dark:border-red-400' : ''
          }`}
        />
        {errors.newPassword && (
          <p className="text-sm text-red-600 dark:text-red-400">{errors.newPassword}</p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="confirmPassword"
          className="block text-sm font-medium text-gray-700 dark:text-slate-200"
        >
          Confirm New Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className={`w-full rounded-md border px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-pink-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:focus:ring-pink-400 ${
            errors.confirmPassword ? 'border-red-500 dark:border-red-400' : ''
          }`}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-pink-500 px-4 py-2 font-medium text-white hover:bg-pink-600 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-pink-500 dark:hover:bg-pink-600 dark:focus:ring-pink-400 dark:focus:ring-offset-slate-900"
      >
        {isLoading ? 'Updating...' : 'Change Password'}
      </button>
    </form>
  );
}
