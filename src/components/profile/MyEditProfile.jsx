import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { userAPI } from '../../services/authService';
import { IoArrowBack } from 'react-icons/io5';

const MyEditProfile = ({ onClose, onUpdate, currentUser }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    image_url: '',
    phone_no: ''
  });

  useEffect(() => {
    // Use currentUser prop if available, otherwise fall back to user from context
    const userToUse = currentUser || user;
    if (userToUse) {
      setFormData({
        name: userToUse.name || '',
        bio: userToUse.bio || '',
        image_url: userToUse.image_url || '',
        phone_no: userToUse.phone_no || ''
      });
    }
  }, [currentUser, user]);

  //UPDATE PROFILE OF USER ONLY NAME, BIO AND PHONE NUMBER -->
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    setIsLoading(true);
    console.log("Submitting profile update:", formData);

    try {
      const response = await userAPI.updateProfile(formData);
      await userAPI.updateProfile(formData.image_url);
      
      console.log("Profile update response:", response);

      toast.success('Profile updated successfully!');

      // Pass the updated user data to the parent component
      // The response structure might be different, so handle multiple possibilities
      const updatedUser = response.user || response.data?.user || response;

      if (onUpdate && typeof onUpdate === 'function') {
        onUpdate(updatedUser);
      }

      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);

      let errorMessage = 'Failed to update profile';
      if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  //UPLOAD IMAGE -->
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image_url: reader.result
        }));
      };
      reader.onerror = () => {
        toast.error('Error reading image file');
      };
      reader.readAsDataURL(file);
      await useAuth.uploadProfilePicture(file);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const userToDisplay = currentUser || user;
  const nameFirstLetter = userToDisplay?.name?.charAt(0)?.toUpperCase() || formData.name?.charAt(0)?.toUpperCase() || '?';

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div
              className='cursor-pointer p-1 rounded-full hover:bg-orange-500 text-black hover:text-white text-2xl font-bold transition-all'
              onClick={onClose}>
              <IoArrowBack />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Edit Profile</h2>
            <button
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isLoading}
            >
              {/* <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg> */}
              <div className='w-8 h-8' />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                {formData.image_url ? (
                  <img
                    src={formData.image_url}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className="w-24 h-24 rounded-full border-2 border-gray-200 bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-600"
                  style={{ display: formData.image_url ? 'none' : 'flex' }}
                >
                  {nameFirstLetter}
                </div>
                <button
                  type="button"
                  className="absolute -bottom-2 -right-2 bg-[#ff5500] text-white rounded-full p-2 hover:bg-[#e64d00] transition-colors disabled:opacity-50"
                  onClick={() => document.getElementById('profileImage').click()}
                  disabled={isLoading}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <input
                  id="profileImage"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 pt-6 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff5500] focus:border-transparent peer"
                placeholder=" "
                required
                disabled={isLoading}
                maxLength={50}
              />
              <label className="absolute left-4 top-4 text-gray-500 transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#ff5500] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-xs">
                Name
              </label>
            </div>

            <div className="relative">
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 pt-6 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff5500] focus:border-transparent resize-none peer"
                placeholder=" "
                disabled={isLoading}
                maxLength={500}
              />
              <label className="flex justify-between w-[90%] absolute left-4 top-4 text-gray-500 transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#ff5500] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-xs">
                <span>Bio</span>
                <div className="text-[9px] text-gray-500 mt-1">
                  {formData.bio.length}/500 characters
                </div>
              </label>
            </div>

            <div className="relative">
              <input
                type="tel"
                name="phone_no"
                value={formData.phone_no}
                onChange={handleChange}
                className="w-full px-4 pt-6 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff5500] focus:border-transparent peer"
                placeholder=" "
                disabled={isLoading}
                maxLength={20}
              />
              <label className="absolute left-4 top-4 text-gray-500 transition-all duration-200 peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1.5 peer-focus:text-xs peer-focus:text-[#ff5500] peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-xs">
                Phone Number
              </label>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 cursor-pointer"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 text-white bg-[#ff5500] rounded-lg hover:bg-[#e64d00] transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={isLoading || !formData.name.trim()}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MyEditProfile;