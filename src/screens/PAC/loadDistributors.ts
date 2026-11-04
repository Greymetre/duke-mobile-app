import axiosClient from '../../api/AxiosClient';
import { API_ENDPOINT } from '../../api/ApiUrls';

export type Distributor = { label: string; value: number };

// Distributor/dealer customers assigned to the logged-in user (master and secondary types excluded).
export const loadDistributors = async (): Promise<Distributor[]> => {
  const typeResponse = await axiosClient.get(API_ENDPOINT.GET_CUSTOMER_TYPE_LIST);
  const typePayload = typeResponse?.data;
  const typeRows = typePayload?.data?.data
    ?? typePayload?.data?.customer_types
    ?? typePayload?.data
    ?? typePayload?.customer_types
    ?? [];
  const sellerTypes = (Array.isArray(typeRows) ? typeRows : []).filter((item: any) => {
    const name = String(item?.customertype_name ?? item?.type_name ?? item?.type ?? item?.customer_type ?? item?.name ?? '').toLowerCase();
    return (name.includes('distributor') || name.includes('dealer'))
      && !name.includes('master') && !name.includes('secondary');
  });
  const sellerResponses = await Promise.all(sellerTypes.map((type: any) =>
    axiosClient.get(API_ENDPOINT.GET_CUSTOMER_LIST, {
      params: {
        customer_type_id: type?.id ?? type?.customer_type_id ?? type?.customertype ?? type?.value,
        pageSize: 100,
        page: 1,
      },
    })));
  const seen = new Set<string>();
  return sellerResponses.flatMap(response => {
    const payload = response?.data?.data;
    return Array.isArray(payload) ? payload : (payload?.data || []);
  }).map((item: any) => ({
    label: item?.name || item?.shop_name || item?.legal_name || item?.customer_name || `Customer ${item?.customer_id ?? item?.id}`,
    value: item?.customer_id ?? item?.id,
  })).filter((item: Distributor) => {
    const key = String(item.value);
    if (!item.value || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
