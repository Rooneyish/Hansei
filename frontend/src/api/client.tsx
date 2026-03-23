import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.2.71:3000/api'; // for emulator 
// const API_BASE_URL = 'http://192.168.2.13:3000/api'; // for device
// const API_BASE_URL = 'http://localhost:3000/api';
// const API_BASE_URL = 'http://0.0.0.0:3000/api'; // for device

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;