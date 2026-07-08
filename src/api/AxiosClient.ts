import axios from 'axios';
import Toast from 'react-native-toast-message';
import store from '../components/redux/Store';
import { logout, setToken, setUser } from '../components/redux/slice/AuthSlice';
import { navigationRef } from '../services/NavigationService';
import { attachAxiosLogging } from './ApiLogger';
export const BASE_URL = 'https://duke.fieldkonnect.in/';
export const IMAGE_BASE_URL = 'https://fieldkonnect.in/ksb-pr/';
// export const BASE_URL = 'http://192.168.1.4:8000/';

const axiosClient = axios.create({ baseURL: BASE_URL });
attachAxiosLogging(axiosClient, 'axiosClient');

axiosClient.interceptors.request.use(async config => {
  const token = store.getState()?.auth?.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    config.headers['Content-Type'] = 'application/json';
  }
  return config;
});

axiosClient.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    const status = error?.response?.status;
    const message = error?.response?.data?.message;
    const errorMsg = error?.response?.data?.error;
    if (
      status == 500 ||
      message == 'Server error: Unauthenticated.' ||
      errorMsg == 'Unauthenticated.'
    ) {

      Toast.show({
        type: 'error',
        text1: 'Session expired. Please login again',
      });
      // navigation.navigate('LoginScreen')
      store.dispatch(logout());
      store.dispatch(setUser(null))
      store.dispatch(setToken(null))
      // ✅ clear redux auth
      store.dispatch(logout());

      // ✅ navigate to login
      navigationRef.current?.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      });

      return Promise.reject(error);
    }
    if (error?.response?.status === 400) {
      Toast.show({
        type: 'error',
        text1: error?.response?.data?.message || error?.response?.data?.reminders[0]?.message || error?.response?.data ||
          error?.response?.data?.errorMessage ||
          error?.response?.data?.message ||
          error?.response?.data?.errors[0]?.error || 'Something went wrong',
        visibilityTime: 5000
      });

      return error?.response?.data?.message || error?.response?.data?.error;
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
