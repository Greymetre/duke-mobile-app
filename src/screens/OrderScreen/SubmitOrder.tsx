import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
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
            Rate{'\n'}
            <AppText size={10} color="#000000" family='InterSemiBold' width={'20%'} align='center'>(pre GST)</AppText>
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
}

const customerTypeData = [
    { label: 'Retailer', value: 'retailer' },
    { label: 'Distributor', value: 'distributor' },
];


const SubmitOrder = () => {
    const route = useRoute();
    const { cartItems, updateCart, routeData } = route.params;
    const retailerId = routeData?.retailer_id;
    const distributorId = routeData?.distributor_id;
    const type = routeData?.type;
    const [customerType, setCustomerType] = useState<string | null>(null);
    const [customerList, setCustomerList] = useState<DropdownItem[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<number | string | null>(null);
    const navigation = useNavigation<NavigationProp<ParamListBase>>();
    const [retailerList, setRetailerList] = useState<DropdownItem[]>([]);
    const [distributorList, setDistributorList] = useState<DropdownItem[]>([]);
    const [loader, setLoader] = useState(false);

    const [selectedRetailer, setSelectedRetailer] = useState<number | string | null>(null);
    const [selectedDistributor, setSelectedDistributor] = useState<number | string | null>(null);
    const [remark, setRemark] = useState('');


    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

    useEffect(() => {
        if (type === 'Retailer') {
            setCustomerType('retailer');
            setSelectedRetailer(retailerId);
            fetchRetailers();
            fetchDistributors();
        }

        if (type === 'Distributor') {
            setCustomerType('distributor');
            setSelectedDistributor(Number(distributorId))
            fetchDistributors();
        }

        setCustomerType('retailer');

        setSelectedRetailer(null);
        setSelectedDistributor(null);
        fetchRetailers();

    }, []);

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


    const fetchRetailers = async () => {
        const token = store.getState().auth?.token;

        try {
            const res = await fetch(
                'http://localhost:8000/api/order/secondary-customers',
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: 'application/json',
                    },
                }
            );

            const json = await res.json();

            const formatted = json?.data?.map((item: any) => ({
                label: item.shop_name,
                value: item.id,
            }));

            setRetailerList(formatted || []);
            if (retailerId) {
                setSelectedRetailer(retailerId);
            }

        } catch (error) {
            console.log('Retailer error', error);
        }
    };
    const fetchDistributors = async () => {
        const token = store.getState().auth?.token;

        try {
            const res = await fetch(
                'http://localhost:8000/api/order/distributors',
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            const json = await res.json();

            const formatted = json?.data?.map((item: any) => ({
                label: `${item.distributor_code} - ${item.legal_name}`,
                value: item.id,
            }));

            setDistributorList(formatted || []);
            if (distributorId) {
                console.log(distributorId, 'distributorId');
                setSelectedDistributor(Number(distributorId));
            }
        } catch (error) {
            console.log('Distributor error', error);
        }
    };
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
    }, [orderItems]);


    const submitOrder = async () => {

        // ✅ Validation
        if (!customerType) {
            Toast.show({
                type: 'error',
                text1: 'Please select type',
            });
            return;
        }
        if (orderItems.length == 0 && orderItems) {
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

        if (customerType === 'retailer' && !selectedRetailer) {
            Toast.show({
                type: 'error',
                text1: 'Please select retailer',
            });
            return;
        }

        if (!selectedDistributor) {
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

            // ✅ Payload
            const body = {
                buyer_id: customerType === 'retailer' ? selectedRetailer : null,
                seller_id: selectedDistributor,
                remark: remark || "NA",
                orderdetail: orderdetail,
            };

            console.log('Order Payload:', body);

            const res = await fetch(
                'http://localhost:8000/api/insertOrder',
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

                {/* <View style={[styles.row, { gap: 10, marginVertical: 20 }]}>
                    <View style={{ flex: 1, gap: 10 }}>
                        <Dropdown
                            style={styles.selectUser}
                            placeholderStyle={{ color: '#718096', fontSize: 14 }}
                            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
                            inputSearchStyle={{ height: 40, fontSize: 14 }}
                            data={customerTypeData}
                            search
                            maxHeight={300}
                            labelField="label"
                            valueField="value"
                            placeholder="Select Customer"
                            searchPlaceholder="Select Customer..."
                            value={customerType}
                            onChange={(item) => {
                                setCustomerType(item.value);

                                setSelectedRetailer(null);
                                setSelectedDistributor(null);

                                if (item.value === 'retailer') {
                                    fetchRetailers();
                                }

                                if (item.value === 'distributor') {
                                    fetchDistributors();
                                }
                            }}
                            renderRightIcon={() => <ArrowDownIcon />}
                        />

                    </View>
                </View> */}


                <View style={{ flex: 1, marginVertical: 20 }}>
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
                        placeholder="Select Retailer"
                        searchPlaceholder={"Select Retailer"}
                        value={selectedRetailer}
                        onChange={(item) => {
                            setSelectedRetailer(item.value);

                            fetchDistributors();
                        }}
                        renderRightIcon={() => <ArrowDownIcon />}
                    />

                </View>


                {((customerType === 'retailer' && selectedRetailer) || customerType === 'distributor') && (

                    <View style={{ flex: 1 }}>
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
                            placeholder="Select Distributor"
                            searchPlaceholder={"Select Distributor"}
                            value={selectedDistributor}
                            onChange={(item) => {
                                setSelectedDistributor(item.value);
                            }}
                            renderRightIcon={() => <ArrowDownIcon />}
                        />

                    </View>
                )
                }

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
                    <View style={{ top: -10 }}>
                        <AppText size={12} color={'#333333'} family={'InterRegular'}>
                            (pre GST Value)
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
