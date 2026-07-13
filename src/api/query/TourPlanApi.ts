import { useMutation } from "@tanstack/react-query";
import axiosClient from "../AxiosClient";
import { API_ENDPOINT } from "../ApiUrls";


export const useMutateTourPlanApi = () => {
    return useMutation({
        mutationFn: () =>
            axiosClient.get(
                API_ENDPOINT.TOUR_PLAN_GET
            ),
    });
};

export const getTourObjectivesApi = () =>
  axiosClient.get(API_ENDPOINT.TOUR_OBJECTIVES);

export const normalizeTourObjectives = (payload: any) => {
  const list =
    payload?.data?.data ??
    payload?.data?.objectives ??
    payload?.objectives ??
    payload?.data ??
    [];

  return (Array.isArray(list) ? list : []).map((item: any) => {
    const label = typeof item === 'string'
      ? item
      : item?.label || item?.name || item?.objective || item?.title || item?.objective_name;

    return {
      label,
      value: label,
    };
  }).filter((item: any) => item.label && item.value);
};


export const useMutateTourPlanSelectApi = () => {
    return useMutation({
        mutationFn: (payload: any) =>
            axiosClient.get(
                API_ENDPOINT.TOUR_PLAN_GET + `?user_id=${payload}`
            ),
    });
};

// api/query/TourPlanApi.ts  (or wherever this hook lives)

export const useMutateTourPlanSelectUserApi = () => {
  return useMutation({
    mutationFn: (payload: { user_id: any; start_date?: string; end_date?: string }) => {
      let url = `${API_ENDPOINT.TOUR_PLAN_GET}?user_id=${payload.user_id}`;

      if (payload.start_date) {
        url += `&start_date=${payload.start_date}`;
      }
      if (payload.end_date) {
        url += `&end_date=${payload.end_date}`;
      }

      return axiosClient.get(url);
    },
  });
};


export const useMutateChangeTourStatusApi = () => {
  return useMutation({
    mutationFn: (payload: {
      tour_id: number;
      status: number;
      remark?: string;
    }) =>
      axiosClient.post(API_ENDPOINT.TOUR_PLAN_CHANGE_STATUS, payload),
  });
};
