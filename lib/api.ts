import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Agar localstorage mein token ho to har request ke sath jaye
api.interceptors.request.use((config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
        config.headers['x-auth-token'] = token;
    }
    return config;
});

export default api;