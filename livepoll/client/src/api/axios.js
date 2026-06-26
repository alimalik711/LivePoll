import axios from 'axios';
console.log("Connecting to API at:", import.meta.env.VITE_API_URL);

const instance = axios.create({
    baseURL: import.meta.env.VITE_API_URL + '/api',
    withCredentials: true // IMPORTANT: This tells Axios to send the JWT cookie back to the server!
});

export default instance;