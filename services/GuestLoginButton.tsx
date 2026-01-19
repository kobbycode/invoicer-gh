import React, { useState } from 'react';
import { loginAsGuest } from '../services/authService';
import { useNavigate } from 'react-router-dom';

export const GuestLoginButton: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleGuestLogin = async () => {
        setLoading(true);
        try {
            await loginAsGuest();
            navigate('/dashboard');
        } catch (error) {
            console.error("Guest login failed", error);
            alert("Failed to continue as guest. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleGuestLogin}
            disabled={loading}
            className="w-full mt-4 bg-gray-50 hover:bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700"
        >
            {loading ? 'Entering...' : 'Continue as Guest'}
        </button>
    );
};