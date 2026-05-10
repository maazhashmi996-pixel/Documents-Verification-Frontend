import axios from 'axios';

// ============================================================
// API INSTANCE CONFIGURATION (PRODUCTION READY)
// ============================================================

const api = axios.create({
    // Agar .env mein URL hai to wo use karega, warna fallback localhost par
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    // Production mein cookies/sessions ke liye true hona zaroori hai
    withCredentials: true
});

/**
 * REQUEST INTERCEPTOR
 * Har request ke sath 'x-auth-token' header automatic attach karega
 */
api.interceptors.request.use(
    (config) => {
        // SSR (Next.js) safe check: Check if window is defined
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers['x-auth-token'] = token;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

/**
 * RESPONSE INTERCEPTOR (Optional but Recommended)
 * Agar 401 (Unauthorized) error aaye to logout ya redirect handle karne ke liye
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Token expire ho gaya ho to redirect logic yahan aa sakti hai
            console.warn("Session expired or Unauthorized access.");
        }
        return Promise.reject(error);
    }
);

export default api;