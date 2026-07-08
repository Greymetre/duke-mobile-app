import axios from "axios";
import store from "../components/redux/Store";
export const BASE_URL = "https://ksb-pr.fieldkonnect.in/";
// export const BASE_URL = 'http://192.168.1.4:8000/';

const axiosClientForm = axios.create({ baseURL: BASE_URL });

axiosClientForm.interceptors.request.use(async (config) => {
  const token = store.getState().auth?.token;
  console.log(token)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers["Content-Type"] = "multipart/form-data";
  return config;
});

axiosClientForm.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error?.response?.status === 400) {
      return error?.response?.data?.message;
    }

    return Promise.reject(error);
  }
);

export default axiosClientForm; 
