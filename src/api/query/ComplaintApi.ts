import axiosClient from '../AxiosClient';
import axiosClientForm from '../AxiosForm';

export const getComplaintCreateOptions = () =>
  axiosClient.get('api/complaint/create-options');

export const getComplaints = () =>
  axiosClient.get('api/complaint/mobile-list');

export const getComplaintDetail = (id: number | string) =>
  axiosClient.get(`api/complaint/mobile-detail/${id}`);

export const createComplaint = (payload: FormData) =>
  axiosClientForm.post('api/complaint/mobile-store', payload);

export const updateComplaint = (id: number | string, payload: FormData) =>
  axiosClientForm.post(`api/complaint/mobile-update/${id}`, payload);
