import React, { useState, useEffect } from 'react';
import { IoArrowBack } from 'react-icons/io5';
import { BsChatDots, BsClock, BsFilm } from 'react-icons/bs';
// import { IoLocation } from 'react-icons/io5';
import { NavLink } from 'react-router-dom';
import { toast } from 'react-toastify';
import hangoutService from '../../services/hangoutService';
import { useHangout } from '../../context/HangoutContext';

/**
 * PlanDetailCard Component
 *
 * Displays detailed information about a hangout with join functionality.
 * When hangoutId is provided, uses real API to join hangouts.
 * When onJoin callback is provided, calls it for backward compatibility.
 *
 * @param {Object} plan - Hangout plan data
 * @param {string} hangoutId - Hangout ID for API calls (required for API integration)
 * @param {function} onClose - Callback when modal is closed
 * @param {function} onApproach - Callback when approach is clicked
 * @param {function} onChat - Callback when chat is clicked
 * @param {boolean} join - Initial join state (for backward compatibility)
 * @param {function} onJoin - Callback when join is clicked (optional)
 */
function PlanDetailCard({ plan, hangoutId, onClose, onApproach, onChat, join, onJoin }) {
  if (!plan) return null;

  const { hasUserJoinedHangout } = useHangout();
  const [isJoining, setIsJoining] = useState(false);
  const [hasRequested, setHasRequested] = useState(join);
  const [hasJoined, setHasJoined] = useState(false);
  const [checkingJoinStatus, setCheckingJoinStatus] = useState(false);

  // Sync local state with join prop when it changes externally
  useEffect(() => {
    setHasRequested(join);
  }, [join]);

  // Check if user has joined this hangout
  useEffect(() => {
    const checkJoinStatus = async () => {
      if (hangoutId) {
        setCheckingJoinStatus(true);
        try {
          const joined = await hasUserJoinedHangout(hangoutId);
          setHasJoined(joined);
        } catch (error) {
          console.error('Error checking join status:', error);
          setHasJoined(false);
        } finally {
          setCheckingJoinStatus(false);
        }
      }
    };

    checkJoinStatus();
  }, [hangoutId, hasUserJoinedHangout]);

  const handleJoin = async (e) => {
    e.stopPropagation();

    // If already requested or currently joining, don't do anything
    if (hasRequested || isJoining) {
      return;
    }

    // Call onJoin callback if it exists (for backward compatibility)
    if (onJoin) {
      onJoin(e, false); // Pass false to indicate not using API
      return;
    }

    // If no hangoutId provided, show error
    if (!hangoutId) {
      toast.error('Unable to join hangout - missing hangout information');
      return;
    }

    try {
      setIsJoining(true);

      // Make API call to join hangout using POST /api/hangouts/:id/join
      const response = await hangoutService.joinHangout(hangoutId);

      // Update local state to show "Requested" status
      setHasRequested(true);

      // If join was approved immediately, mark as joined
      if (response.status === 'approved') {
        setHasJoined(true);
      }

      // Notify parent component of the change
      if (onJoin) {
        onJoin(e, true); // Pass true to indicate successful join
      }

      toast.success(`Join request sent for ${plan.name}'s hangout!`, {
        position: 'top-center',
        autoClose: 3000,
      });

      console.log('Join request successful:', response);
    } catch (error) {
      console.error('Error joining hangout:', error);

      let errorMessage = 'Failed to send join request';
      if (error.response?.status === 401) {
        errorMessage = 'Please log in to join hangouts';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to join this hangout';
      } else if (error.response?.status === 404) {
        errorMessage = 'Hangout not found or no longer available';
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, {
        position: 'top-center',
        autoClose: 4000,
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleApproach = (e) => {
    e.stopPropagation();
    if (onApproach) onApproach();
  };

  const handleChat = (e) => {
    e.stopPropagation();

    // Only allow chat access if user has joined the hangout
    if (!hasJoined) {
      toast.error('You must join the hangout first to access the chat!', {
        position: 'top-center',
        autoClose: 3000,
      });
      return;
    }

    if (onChat) onChat();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-[360px] bg-white rounded-2xl shadow-lg overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar - Only back button */}
        <div className="p-4 flex items-center justify-start">
          <button
            onClick={onClose}
            className="text-gray-700 p-2 rounded-full hover:bg-gray-100 cursor-pointer"
            aria-label="Back"
          >
            <IoArrowBack className="w-5 h-5" />
          </button>
        </div>

        {/* Header with Movie Reels */}
        <div className="relative h-40">
          {/* Decorative Movie Reels */}
          <div className="absolute inset-0 opacity-70">
            <img src={plan.bannerImage} alt="" className="w-full h-full object-cover" />
            {/* <div className="absolute top-4 left-4 w-20 h-20 rounded-full border-4 border-white/30"></div>
            <div className="absolute bottom-4 right-4 w-20 h-20 rounded-full border-4 border-white/30"></div> */}
          </div>

          {/* Profile Image */}
          <div className="absolute -bottom-16 left-6 w-28 h-28">
            <NavLink to={`/user/${plan.id}`}>
              <img
                src={plan.avatarUrl || "/profile.jpg"}
                alt={plan.name}
                className="w-full h-full rounded-full object-cover border-4 border-white shadow-md"
              />
            </NavLink>
            {/* Name */}
            <NavLink to={`/user/${plan.id}`}>
              <div className=" relative left-[120px] bottom-[60px] flex items-center text-stone-900 text-xl text-nowrap">
                <span>{plan.host.name || 'Annynomous'}</span>
              </div>
            </NavLink>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 pt-20 pb-6">
          {/* Name
          <div className="flex items-center text-gray-700">
            <span>{plan.name || 'Selmon Bhai'}</span>
          </div> */}

          {/* Event Details */}
          <div className="space-y-2 mb-8">
            <h3 className="text-xl text-nowrap text-[#1c1c1c] mt-6 mb-2 flex justify-start items-center font-semibold"><BsFilm className="w-5 h-5 mr-3" />{plan.subtitle}</h3>
            <div className="flex items-center text-[#1c1c1c] opacity-60">
              <BsClock className="w-5 h-5 mr-3 " />
              <span>{plan.start_time}</span>
            </div>
            <div className=" text-[#1c1c1c] flex items-center gap-1">
              <span role="img" aria-label="place">📍</span>
              <span className="opacity-60 text-sm">
                {plan.location.length > 30 ? `${plan.location.slice(0, 30)}...` : plan.location}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center w-full space-x-4">
            {/* <button
              onClick={handleJoin}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors cursor-pointer ${
                hasRequested || isJoining
                  ? 'bg-[#909090] text-white hover:bg-[#575757] cursor-not-allowed'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
              disabled={hasRequested || isJoining}
            >
              {isJoining ? 'Sending...' : hasRequested ? 'Requested' : 'Join'}
            </button> */}
            <button
              onClick={handleChat}
              disabled={!hasJoined && !checkingJoinStatus}
              className={`w-fit flex-1 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center ${
                hasJoined
                  ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <BsChatDots className="w-5 h-5 mr-2" />
              {checkingJoinStatus ? 'Checking...' : hasJoined ? 'Chat' : 'Join to Chat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlanDetailCard;
