import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, TextInput, TouchableOpacity, View } from 'react-native';
import { ArrowDownIcon } from '../../assets/svgs/SvgsFile';
import AppText from '../../components/AppText/AppText';
import { styles } from './styles';
import { rw } from '../../utils/responsive';
import { colors } from '../../utils/Colors';
import { NavigationProp, ParamListBase, useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import store from '../../components/redux/Store';
import { Dropdown } from 'react-native-element-dropdown';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import axiosClient from '../../api/AxiosClient';
import { API_ENDPOINT } from '../../api/ApiUrls';


interface OrderItem {
    id: string;               // unique key
    productName: string;
    quantity: number;
    rate: number;             // editable
    amount: number;           // calculated = qty × rate
}

const TableHeader = () => (
    <View style={[styles.tableHeader]}>
        <AppText size={14} color="#000000" family='InterSemiBold' width={'45%'} align='center'>
            Product
        </AppText>
        <AppText size={14} color="#000000" family='InterSemiBold' width={'15%'} align='center'>
            Qty
        </AppText>
        <AppText size={14} color="#000000" family='InterSemiBold' width={'20%'} align='center'>
            Rate
        </AppText>
        <AppText size={14} color="#000000" family='InterSemiBold' width={'20%'} align='center'>
            Amount
        </AppText>
    </View>
);

interface TableRowProps {
    label: string;
    value?: string | number;
    isQty?: boolean;
    qty?: number;
    onQtyChange?: (newQty: number) => void;
    rate?: number;
    amount?: number;
}

interface TableRowProps {
    item: OrderItem;
    onRateChange: (id: string, newRate: number) => void;
    onQuantityChange?: (id: string, newQty: number) => void; // optional for future
    onRemove: (id: string) => void;
}

const TableRow: React.FC<TableRowProps> = ({ item, onRateChange, onRemove }) => {

    const [rateInput, setRateInput] = useState<string>(String(item.rate));
    // Sync input when item.rate changes externally (if needed later)
    useEffect(() => {
        setRateInput(String(item.rate));
    }, [item.rate]);

    const handleRateChange = (text: string) => {
        const cleaned = text.replace(/[^0-9]/g, ''); // only numbers

        setRateInput(cleaned);

        const num = Number(cleaned);

        if (!isNaN(num)) {
            onRateChange(item.id, num);
        }
    };

    return (
        <View style={styles.tableRows}>
            <TouchableOpacity
                style={{ height: 22, width: 22, backgroundColor: colors.blue, borderRadius: 50, alignItems: 'center' }}
                onPress={() => onRemove(item.id)}
            >
                <AppText size={14} color="white">-</AppText>
            </TouchableOpacity>
            <View style={{ width: '36%', marginLeft: 10 }}>
                <AppText size={14} color="#333333" family="InterRegular">
                    {item.productName}
                </AppText>
            </View>

            <View style={{ width: '15%', alignItems: 'center' }}>
                <AppText size={14} color="#333333" family="InterRegular">
                    {item.quantity}
                </AppText>
            </View>

            {/* Editable Rate */}
            <View style={{ width: '20%', alignItems: 'center' }}>
                <TextInput
                    style={{
                        fontSize: 14,
                        color: '#333333',
                        fontFamily: 'InterRegular',
                        textAlign: 'center',
                        borderBottomWidth: 1,
                        borderBottomColor: '#ccc',
                        width: '90%',
                    }}
                    value={rateInput}
                    onChangeText={handleRateChange}
                    keyboardType="number-pad"
                    maxLength={10}
                    placeholder="0.00"
                    placeholderTextColor={'#ddd'}
                />
            </View>

            <AppText size={14} color="#333333" family="InterBold" width="20%" align="center">
                {item.amount.toFixed(2)}
            </AppText>


        </View>
    );
};

interface DropdownItem {
    label: string;
    value: number | string;
    customerTypeId?: number | string;
    customerTypeName?: string;
    raw?: any;
}

interface CustomerTypeOption {
    label: string;
    value: number | string;
    name: string;
    raw?: any;
}

const getCustomerLabel = (item: any) =>
    item?.shop_name ||
    item?.name ||
    item?.legal_name ||
    item?.owner_name ||
    item?.customer_name ||
    item?.mobile_number ||
    `Customer ${item?.id}`;

const getCustomerTypeName = (item: any) =>
    item?.customer_type ||
    item?.customertype_name ||
    item?.customertypes?.customertype_name ||
    item?.type ||
    '';

const normalizeCustomerTypes = (payload: any) => {
    const list =
        payload?.data?.data ??
        payload?.data?.customer_types ??
        payload?.data ??
        payload?.customer_types ??
        [];

    return (Array.isArray(list) ? list : []).map((item: any) => {
        const id = item?.id ?? item?.customer_type_id ?? item?.customertype ?? item?.value;
        const name = String(
            item?.customertype_name ??
            item?.type_name ??
            item?.type ??
            item?.customer_type ??
            item?.name ??
            item?.title ??
            ''
        );

        return {
            id,
            name,
            label: name,
            value: id,
            raw: item,
        };
    }).filter((item: any) => item?.id && item?.name);
};

const isSameId = (a?: number | string | null, b?: number | string | null) =>
    a != null && b != null && String(a) === String(b);

const isRetailerType = (typeId: any, typeName: any, retailerId?: number | string) =>
    isSameId(typeId, retailerId) || String(typeName || '').toLowerCase().includes('retailer');

const isDistributorOrDealerType = (typeName: any) => {
    const normalized = String(typeName || '').toLowerCase();
    return normalized.includes('distributor') || normalized.includes('dealer');
};

const SubmitOrder = () => {
    const route = useRoute();
    const { cartItems, updateCart, routeData } = route.params;
    const retailerId = routeData?.retailer_id;
    const distributorId = routeData?.distributor_id;
    const type = routeData?.type;
    const routeCustomerTypeId = routeData?.customer_type_id || routeData?.customerTypeId;
    const routeCustomerId = routeData?.customer_id || routeData?.id;
    const routeBuyerId = retailerId || routeCustomerId || distributorId || null;
    const [customerType, setCustomerType] = useState<number | string | null>(null);
    const navigation = useNavigation<NavigationProp<ParamListBase>>();
    const [customerTypeList, setCustomerTypeList] = useState<CustomerTypeOption[]>([]);
    const [retailerList, setRetailerList] = useState<DropdownItem[]>([]);
    const [distributorList, setDistributorList] = useState<DropdownItem[]>([]);
    const [customerTypeIds, setCustomerTypeIds] = useState<{ retailer?: number | string; distributor?: number | string }>({});
    const [loader, setLoader] = useState(false);

    const [selectedRetailer, setSelectedRetailer] = useState<number | string | null>(null);
    const [selectedCustomerTypeId, setSelectedCustomerTypeId] = useState<number | string | null>(routeCustomerTypeId || null);
    const [selectedCustomerTypeName, setSelectedCustomerTypeName] = useState<string>(type || routeData?.customer_type || '');
    const [selectedDistributor, setSelectedDistributor] = useState<number | string | null>(null);
    const [remark, setRemark] = useState('');


    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

    const selectedCustomerIsRetailer = isRetailerType(
        selectedCustomerTypeId,
        selectedCustomerTypeName,
        customerTypeIds.retailer
    );

    const fetchCustomerTypes = useCallback(async () => {
        try {
            const res = await axiosClient.get(API_ENDPOINT.GET_CUSTOMER_TYPE_LIST);
            const types = normalizeCustomerTypes(res?.data);
            const retailer = types.find((item: any) => item.name.toLowerCase().includes('retailer'));
            const distributor = types.find((item: any) => item.name.toLowerCase().includes('distributor'));
            const routeType =
                types.find((item: any) => isSameId(item.value, routeCustomerTypeId)) ||
                types.find((item: any) => String(type || routeData?.customer_type || '').toLowerCase() === item.name.toLowerCase());

            setCustomerTypeList(types);
            setCustomerTypeIds({
                retailer: retailer?.id,
                distributor: distributor?.id,
            });

            if (routeType) {
                setCustomerType(routeType.value);
                setSelectedCustomerTypeId(routeType.value);
                setSelectedCustomerTypeName(routeType.name);
                return;
            }

            setCustomerType(null);
            setSelectedCustomerTypeId(null);
            setSelectedCustomerTypeName('');
        } catch (error) {
            console.log('Customer type list error', error);
        }
    }, [routeCustomerTypeId, routeData?.customer_type, type]);

    const getCustomersByType = useCallback(async (customerTypeId?: number | string) => {
        if (!customerTypeId) return [];
        try {
            const res = await axiosClient.get(API_ENDPOINT.GET_CUSTOMER_LIST, {
                params: {
                    customer_type_id: customerTypeId,
                    pageSize: 100,
                    page: 1,
                },
            });

            const listPayload = res?.data?.data;
            const list = Array.isArray(listPayload) ? listPayload : (listPayload?.data || []);
            const formatted = list?.map((item: any) => ({
                label: getCustomerLabel(item),
                value: item?.customer_id || item?.id,
                customerTypeId: item?.customer_type_id || item?.customertype,
                customerTypeName: getCustomerTypeName(item),
                raw: item,
            }));

            return formatted || [];
        } catch (error) {
            console.log('Customer list error', error);
            return [];
        }
    }, []);

    const fetchCustomersForSelectedType = useCallback(async (customerTypeId?: number | string) => {
        const formatted = await getCustomersByType(customerTypeId);
        setRetailerList(formatted);

        if (routeBuyerId && (!routeCustomerTypeId || isSameId(customerTypeId, routeCustomerTypeId))) {
            setSelectedRetailer(routeBuyerId);
        }
    }, [getCustomersByType, routeBuyerId, routeCustomerTypeId]);

    const fetchDistributorDealerOptions = useCallback(async () => {
        const sellerTypeIds = customerTypeList
            .filter((item) => isDistributorOrDealerType(item.name))
            .map((item) => item.value);

        if (!sellerTypeIds.length) {
            setDistributorList([]);
            return;
        }

        const responses = await Promise.all(sellerTypeIds.map((typeId) => getCustomersByType(typeId)));
        const seen = new Set<string>();
        const merged = responses.flat().filter((item) => {
            const key = String(item.value);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        setDistributorList(merged);
        if (distributorId) {
            setSelectedDistributor(Number(distributorId));
        }
    }, [customerTypeList, distributorId, getCustomersByType]);

    useEffect(() => {
        fetchCustomerTypes();
    }, [fetchCustomerTypes]);

    useEffect(() => {
        if (!selectedCustomerTypeId) {
            setRetailerList([]);
            setDistributorList([]);
            setSelectedRetailer(null);
            setSelectedDistributor(null);
            return;
        }

        setCustomerType(selectedCustomerTypeId);
        fetchCustomersForSelectedType(selectedCustomerTypeId);
        if (selectedCustomerIsRetailer) {
            fetchDistributorDealerOptions();
        } else {
            setDistributorList([]);
            setSelectedDistributor(null);
        }
    }, [
        fetchCustomersForSelectedType,
        fetchDistributorDealerOptions,
        selectedCustomerTypeId,
        selectedCustomerIsRetailer,
    ]);

    useEffect(() => {
        if (cartItems?.length) {
            const mappedItems: OrderItem[] = cartItems.map((item: any) => {
                const price = Number(item.price || 0); // fallback to 0 if missing
                return {
                    id: item.productId,
                    productName: item.productName,
                    quantity: item.quantity,
                    rate: price,
                    amount: item.quantity * price,    // ← correct calculation
                };
            });

            setOrderItems(mappedItems);
        }
    }, [cartItems]);

    const totalOrderValue = orderItems.reduce((sum, item) => {
        return sum + item.amount;
    }, 0);

    const totalQuantity = orderItems.reduce((sum, item) => sum + item.quantity, 0);

    const handleRateChange = (id: string, newRate: number) => {
        setOrderItems((prev) =>
            prev.map((item) =>
                item.id === id
                    ? { ...item, rate: newRate, amount: item.quantity * newRate }
                    : item
            )
        );
    };

    const handleRemoveItem = (id: string | number) => {
        setOrderItems(prev => prev.filter(item => item.id !== id));
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', () => {

            const updatedCart = orderItems.map((item: any) => ({
                productId: item.id,
                productName: item.productName,
                quantity: item.quantity,
            }));

            if (updateCart) {
                updateCart(updatedCart);
            }
        });

        return unsubscribe;
    }, [navigation, orderItems, updateCart]);


    const submitOrder = async () => {

        // ✅ Validation
        if (!customerType) {
            Toast.show({
                type: 'error',
                text1: 'Please select type',
            });
            return;
        }
        if (orderItems.length === 0 && orderItems) {
            Toast.show({
                type: 'error',
                text1: 'Please select any order',
            });
            navigation.goBack()
            return;
        }

        // ✅ NEW VALIDATION: Check if any item has price/rate = 0
        const zeroPriceItems = orderItems.filter((item: any) =>
            !item.rate || Number(item.rate) <= 0
        );

        if (zeroPriceItems.length > 0) {
            Toast.show({
                type: 'error',
                text1: 'Price cannot be 0',
                text2: `Found ${zeroPriceItems.length} item(s) with zero price`,
            });
            return;
        }

        if (!selectedRetailer) {
            Toast.show({
                type: 'error',
                text1: 'Please select customer',
            });
            return;
        }

        if (selectedCustomerIsRetailer && !selectedDistributor) {
            Toast.show({
                type: 'error',
                text1: 'Please select distributor',
            });
            return;
        }


        const token = store.getState().auth?.token;

        try {
            setLoader(true)
            // ✅ Order Details
            const orderdetail = orderItems.map((item: any) => ({
                product_id: item.id,
                product_detail_id: item.id,
                quantity: item.quantity,
                price: item.rate,
                ebd_amount: item.rate,
                line_total: item.amount,
            }));

            const sellerId = selectedCustomerIsRetailer ? selectedDistributor : selectedRetailer;

            // ✅ Payload
            const body = {
                buyer_id: selectedRetailer,
                seller_id: sellerId,
                remark: remark || "NA",
                orderdetail: orderdetail,
            };

            console.log('Order Payload:', body);

            const res = await fetch(
                'https://duke.fieldkonnect.in/api/insertOrder',
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                }
            );

            const json = await res.json();

            console.log('Order Response:', json);

            if (json?.status) {
                Toast.show({
                    type: 'success',
                    text1: 'Order placed successfully',
                });

                navigation.navigate('BottomTab')
            } else {
                Toast.show({
                    type: 'error',
                    text1: json?.message || 'Order failed',
                });
            }

            setLoader(false)
        } catch (error) {
            setLoader(false)
            console.log('Order API Error:', error?.response);

            Toast.show({
                type: 'error',
                text1: 'Something went wrong',
            });
        }
    };

    return (
        <View style={styles.container}>
            <KeyboardAwareScrollView
                style={[styles.container, { paddingHorizontal: rw(18) }]} keyboardDismissMode='on-drag' showsVerticalScrollIndicator={false}
                bottomOffset={50}
            // contentContainerStyle={{ padding: 16 }}


            >

                <View style={[styles.row, { gap: 10, marginVertical: 20 }]}>
                    <View style={{ flex: 1, gap: 10 }}>
                        <Dropdown
                            style={styles.selectUser}
                            placeholderStyle={{ color: '#718096', fontSize: 14 }}
                            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
                            inputSearchStyle={{ height: 40, fontSize: 14 }}
                            data={customerTypeList}
                            search
                            maxHeight={300}
                            labelField="label"
                            valueField="value"
                            placeholder="Select Customer Type"
                            searchPlaceholder="Select Customer Type..."
                            value={customerType}
                            onChange={(item) => {
                                setCustomerType(item.value);
                                setSelectedCustomerTypeId(item.value);
                                setSelectedCustomerTypeName(item.name || item.label);
                                setSelectedRetailer(null);
                                setSelectedDistributor(null);
                            }}
                            renderRightIcon={() => <ArrowDownIcon />}
                        />

                    </View>
                </View>


                {selectedCustomerTypeId && (
                <View style={{ flex: 1, marginBottom: 20 }}>
                    <Dropdown
                        style={styles.selectUser}
                        placeholderStyle={{ color: '#718096', fontSize: 14 }}
                        selectedTextStyle={{ color: colors.black, fontSize: 14 }}
                        inputSearchStyle={{ height: 40, fontSize: 14 }}
                        data={retailerList}
                        search
                        maxHeight={300}
                        labelField="label"
                        valueField="value"
                        placeholder={`Select ${selectedCustomerTypeName || 'Customer'}`}
                        searchPlaceholder={`Select ${selectedCustomerTypeName || 'Customer'}`}
                        value={selectedRetailer}
                        onChange={(item) => {
                            setSelectedRetailer(item.value);
                            setSelectedCustomerTypeId(item.customerTypeId || selectedCustomerTypeId);
                            setSelectedCustomerTypeName(item.customerTypeName || selectedCustomerTypeName);
                            setSelectedDistributor(null);
                        }}
                        renderRightIcon={() => <ArrowDownIcon />}
                    />

                </View>
                )}


                {selectedCustomerIsRetailer && (
                    <View style={{ flex: 1, marginTop: 0 }}>
                        <Dropdown
                            style={styles.selectUser}
                            placeholderStyle={{ color: '#718096', fontSize: 14 }}
                            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
                            inputSearchStyle={{ height: 40, fontSize: 14 }}
                            data={distributorList}
                            search
                            maxHeight={300}
                            labelField="label"
                            valueField="value"
                            placeholder="Select Distributor / Dealer"
                            searchPlaceholder={"Select Distributor / Dealer"}
                            value={selectedDistributor}
                            onChange={(item) => {
                                setSelectedDistributor(item.value);
                            }}
                            renderRightIcon={() => <ArrowDownIcon />}
                        />

                    </View>
                )}

                <View style={styles.tableContainers}>
                    <TableHeader />
                    <View style={{
                        borderBottomWidth: 1,
                        borderBottomColor: '#eee',
                        marginBottom: 10
                    }} />
                    {orderItems?.map((item) => (
                        <TableRow
                            key={item.id}
                            item={item}
                            onRateChange={handleRateChange}
                            onRemove={handleRemoveItem}
                        />
                    ))}

                </View>

                <View style={[styles.tableContainers, { paddingHorizontal: 14 }]}>
                    <View style={[styles.tableRow, { paddingTop: rw(10), justifyContent: 'space-between', paddingRight: 20 }]}>
                        <AppText size={14} color={'#333333'} family={'InterRegular'}>
                            Total Quantity
                        </AppText>
                        <AppText size={16} color={colors.blue} family="InterBold">
                            {totalQuantity}
                        </AppText>
                    </View>
                    <View style={[styles.tableRow, { paddingTop: rw(10) }]}>
                        <AppText size={14} color={'#333333'} family={'InterRegular'}>
                            Total Order Value
                        </AppText>
                        <AppText size={16} color={colors.blue} family="InterBold" horizontal={20}>
                            {totalOrderValue.toFixed(2)}
                        </AppText>
                    </View>
                </View>

                <View style={styles.remarkContainer}>
                    <TextInput
                        style={styles.remarkInput}
                        placeholder="Enter Remark"
                        placeholderTextColor="#718096"
                        value={remark}
                        onChangeText={setRemark}
                    />
                </View>
                <Pressable style={styles.buttonView} disabled={loader} onPress={submitOrder}>
                    {
                        loader ? (
                            <ActivityIndicator size="small" color="white" />
                        ) : (
                            <AppText color='white' family='InterBold' size={16}>SUBMIT</AppText>

                        )
                    }
                </Pressable>
                <View style={{ height: 90 }} />
            </KeyboardAwareScrollView>
        </View>
    );
}


export default SubmitOrder;
