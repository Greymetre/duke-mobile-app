import { View, Text, Pressable, ScrollView, Alert, Platform, Linking, Modal, KeyboardAvoidingView, TextInput } from 'react-native'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { styles } from './styles'
import { rw } from '../../utils/responsive'
import AppText from '../../components/AppText/AppText'
import FastImage from 'react-native-fast-image'
import { BuyOrderIcon, CalenderAddIcon, CalenderIcon, CrossIcon, OrderBoxIcon, OrderHistoryIcon } from '../../assets/svgs/SvgsFile'
import { colors } from '../../utils/Colors'
import { useGetCustomerData, useGetSecondaryCustomerData, useGetSubmitCheckIN } from '../../api/query/CustomerApi'
import { BASE_URL, IMAGE_BASE_URL } from '../../api/AxiosClient'
import { CheckIcon } from '../../assets/svgs/HomePageSvgs'
import Toast from 'react-native-toast-message'
import Geolocation from '@react-native-community/geolocation'
import { useFocusEffect } from '@react-navigation/native'
import useLocationHook from '../../api/hooks/uselocationhook'
import Gallery, { GalleryRef } from 'react-native-awesome-gallery'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import ActionSheet, { ActionSheetRef } from 'react-native-actions-sheet'
import axios from 'axios'
import store, { useAppSelector } from '../../components/redux/Store'

type CustomerDetailsProps = {
  navigation: any
  route: any
}

type StatusType = 'APPROVED' | 'REJECTED' | 'PENDING' | 'Random';


const CustomerDetails = ({ navigation, route }: CustomerDetailsProps) => {
  const routePunchInOut = route?.params?.isPunchedIn
  const [activeTab, setactiveTab] = useState(1)
  const [loader, setLoader] = useState<boolean>(false)
  const [checkInLoading, setCheckInLoading] = useState<boolean>(false)
  const [customerData, setCustomerData] = useState<any>(null)
  const [data, setData] = useState<any>(null)
  const [checkInHanlde, seCheckInHandle] = useState<any>(null)
  const [modalVisible, setModalVisible] = useState(false);
  const [images, setImages] = useState<string[]>([]); // always array
  const galleryRef = useRef<GalleryRef>(null);
  const [initialIndex, setInitialIndex] = useState(0);
  const { user } = useAppSelector(
    (state) => state.auth
  );
  const [punchInStatus, setPunchInStatus] = useState("Random");
  // ── New states for location ────────────────────────────────

  const [locationError, setLocationError] = useState<string | null>(null)

  const routeItem = route?.params?.item
  const [statusLoading, setStatusLoading] = useState(false);
  const [hirarchyLevel, setHirarchyLevel] = useState(4);
  const [remark, setRemark] = useState('');
  const rejectSheetRef = useRef<ActionSheetRef>(null);

  // Optional: better typing
  const { mutateAsync: mutateCustomerData } = useGetCustomerData()
  const { mutateAsync: mutateSecondaryCustomerData } = useGetSecondaryCustomerData()
  const { mutateAsync: submitCheckIn } = useGetSubmitCheckIN()

  // Get customer data + location on mount
  useFocusEffect(
    useCallback(() => {
      handleGetCustomerData(routeItem?.id)
    }, [])
  )


  const updateCustomerStatus = async (status: StatusType, remarkText: string = '') => {
    if (statusLoading) return;

    setStatusLoading(true);

    const payload = {
      status: status,
      remark: status === 'REJECTED' ? remarkText.trim() : '',
    };

    try {
      // Replace with your real token source (context / storage / interceptor)
      const token = store.getState().auth?.token; // ← get from auth

      const response = await axios.put(
        `http://localhost:8000/api/secondary-customers/${routeItem?.id}/status`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      if (response?.data?.status === true) {
        setPunchInStatus(status);
        Toast.show({
          type: 'success',
          text1: `Customer ${status.toLowerCase()}`,
          position: 'top',
        });

        // Optional: refresh data
        handleGetCustomerData(routeItem?.id);
      } else {
        throw new Error(response?.data?.message || 'Update failed');
      }
    } catch (err: any) {
      console.log('Status update error:', err);
      Toast.show({
        type: 'error',
        text1: 'Failed to update status',
        text2: err?.response?.data?.message || err.message,
        position: 'top',
      });
    } finally {
      setStatusLoading(false);
      setRemark('');
      rejectSheetRef.current?.hide();
    }
  };

  // ── Fetch current location once ─────────────────────────────
  const { coords } = useLocationHook();

  // Access as
  const currentLat = coords?.latitude;
  const currentLng = coords?.longitude;

  function isCheckoutBeforeCheckin(checkinDatetime: any, checkoutDatetime: any) {
    // Using Date objects (most reliable)
    const checkin: any = new Date(checkinDatetime);
    const checkout: any = new Date(checkoutDatetime);

    // If either date is invalid → treat as not before (safe default)
    if (isNaN(checkin) || isNaN(checkout)) {
      return false;
    }

    return checkout < checkin;
  }

  const handleGetCustomerData = async (id: any) => {
    setLoader(true)

    try {
      const res = route?.params?.type
        ? await mutateSecondaryCustomerData({ id: routeItem?.id, type: routeItem?.type })
        : await mutateCustomerData(id)

      if (res?.data?.status === true) {
        console.log(res?.data, 'res?.datares?.data')
        if (route?.params?.type) {
          const data = res?.data?.data
          setPunchInStatus(data?.status)
          setData(data)
          const distributorNames = res?.data?.distributors
            ?.map((d: any) => d.shop_name)
            .filter(Boolean)
            .join(', ') || null;
          setCustomerData({
            shop_image: data?.shop_photo,
            legal_name: data?.shop_name,
            billing_address: data?.address_line,
            billing_city: data?.city?.city_name,
            contact_person: data?.owner_name,
            mobile: data?.mobile_number,
            billing_pincode: data?.pincode?.pincode,
            registration_type: data?.type,
            owner_photo: data?.owner_photo,
            check_status: res?.data?.check_status,
            state: data?.state?.state_name || '',
            district: data?.district?.district_name || '',
            city: data?.city?.city_name || '',
            distributor_name: distributorNames || '',
            beat_id: data?.beat_id || '',
            beat_name: data?.beat?.beat_name || '',
            belt_area_market_name: data?.belt_area_market_name || '',
            gps_location: data?.gps_location || '',
            gst_number: data?.gst_number || '',
            status: data?.status || '',
            pan_number: data?.pan_number || '',
            bank_account_type: data?.bank_account_type || '',
            bank_account_number: data?.bank_account_number || '',
            bank_name: data?.bank_name || '',
            ifsc_code: data?.ifsc_code || '',
            account_holder_name: data?.account_holder_name || '',
            gst_attachment: data?.gst_attachment || null,
            pan_attachment: data?.pan_attachment || null,
            bank_proof: data?.bank_proof || null,
            remark: data?.remark || '',
            created_by: data?.created_by || '',
            creator: data?.creator?.name || '',
          });

        } else {
          setData(res?.data?.data)
          setCustomerData({ ...res?.data?.data, check_status: res?.data?.check_status })
        }
        setHirarchyLevel(res?.data?.hierarchy_level)
        seCheckInHandle(
          !!res?.data?.check_status?.last_checkin?.checkin_datetime &&
          !res?.data?.check_status?.last_checkin?.checkout_datetime
        )

        const checkInDate = res?.data?.check_status?.last_checkin?.checkin_datetime
        const checkOutdate = res?.data?.check_status?.last_checkout?.checkout_datetime
        if (checkInDate && checkOutdate) {
          const result: any = isCheckoutBeforeCheckin(
            checkInDate,
            checkOutdate,
          );

          if (result != "NA") {
            seCheckInHandle(result)
          }

        } else {
          seCheckInHandle(!!checkInDate &&
            !checkOutdate)
        }
      }
    } catch (error) {
      console.log('handleGetCustomerData error:', error)
    } finally {
      setLoader(false)
    }
  }

  const handleCheckInOut = async () => {
    if (checkInLoading) return
    // Check if we have location
    if (currentLat === null || currentLng === null) {
      Toast.show({
        type: 'error',
        text1: 'Location not available',
        text2: locationError || 'Please enable location and try again',
        position: 'top',
        visibilityTime: 3500,
      })
      // Optional: try to fetch again
      // getCurrentLocation()
      return
    }

    if (checkInHanlde) {
      // Toast.show({
      //   type: 'error',
      //   text1: 'check in not available',
      //   text2: locationError || 'Please enable location and try again',
      //   position: 'top',
      //   visibilityTime: 3500,
      // })
      navigation.navigate('VisitReport', {
        checkin_id: customerData?.check_status?.last_checkin?.checkin_id,
        entity_type: route?.params?.type ? 'secondary_customer' : 'distributor',
        entity_id: routeItem?.id,
        customerData: customerData, // pass full customer data if needed in report
        latitude: currentLat,
        longitude: currentLng,
      });
      return
    } else {
      setCheckInLoading(true)
      const payload = {
        entity_type: route?.params?.type ? "secondary_customer" : 'distributor',
        entity_id: routeItem?.id,
        checkin_latitude: currentLat,
        checkin_longitude: currentLng,
      }

      try {
        const res: any = await submitCheckIn(payload)

        if (res?.data?.status === true || res?.data?.status == "success") {

          Toast.show({
            type: 'success',
            text1: checkInHanlde ? 'Checked out successfully' : 'Checked in successfully',
            position: 'top',
            visibilityTime: 2500,
          })

          // Refresh data to update button text / status
          handleGetCustomerData(routeItem?.id)
        } else {
          Toast.show({
            type: 'error',
            text1: res || 'Operation failed',
            text2: res?.data?.message || 'Please try again',
            position: 'top',
          })
        }
      } catch (error: any) {
        console.log('Check-in/out error:', error?.response)
        Toast.show({
          type: 'error',
          text1: 'Failed',
          text2: error?.response?.data?.message || 'Could not complete action',
          position: 'top',
        })
      } finally {
        setCheckInLoading(false)
      }
    }
  }

  const closeModal = () => {
    setModalVisible(false);
  };


  const hasOpenCheckIn =
    !!customerData?.check_status?.last_checkin?.checkin_datetime &&
    !customerData?.check_status?.last_checkin?.checkout_datetime

  const documents = customerData?.documents ? JSON.parse(customerData.documents) : []
  const handleLocation = async () => {
    const gps = customerData?.gps_location?.trim();
    const addr = customerData?.address_line?.trim();

    let query = '';

    // Prefer coordinates if available
    if (gps && gps.includes(',')) {
      const [lat, lng] = gps.split(',').map((s: any) => s.trim());
      if (lat && lng) {
        query = `${lat},${lng}`;
      }
    }

    // Fallback to address
    if (!query && addr) {
      query = encodeURIComponent(addr);
    }

    if (!query) {
      Alert.alert('No Location', 'No GPS or address available.');
      return;
    }

    // ────────────────────────────────────────────────
    // Android: try geo: URI first (works with most map apps)
    // iOS: use maps://
    // Fallback: browser
    // ────────────────────────────────────────────────

    const scheme = Platform.OS === 'android' ? 'geo:0,0?q=' : 'maps://?q=';
    const nativeUrl = scheme + query;
    const webUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;

    try {
      // Try native map app first
      if (await Linking.canOpenURL(nativeUrl)) {
        await Linking.openURL(nativeUrl);
        return;
      }

      // If native fails → open in browser
      await Linking.openURL(webUrl);
    } catch (err) {
      console.log('Map open failed:', err);

      Alert.alert(
        'Cannot Open Map',
        'No map application is available.\n\nThe location will open in your browser instead.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open in Browser',
            onPress: () => Linking.openURL(webUrl).catch(() => { }),
          },
        ]
      );
    }
  };

  return (
    <View style={[styles.container, { marginTop: 14 }]}>
      <ScrollView
        style={[styles.container, { paddingHorizontal: rw(20) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.tabBarView, styles.row, { marginTop: 14 }]}>
          <Pressable
            style={[
              styles.firstTab,
              styles.center,
              activeTab == 1 && styles.activeTab,
              activeTab == 2 && { width: '40%' },
            ]}
            onPress={() => setactiveTab(1)}
          >
            <AppText
              color={activeTab == 1 ? 'white' : 'black'}
              size={activeTab == 1 ? 15 : 14}
              family={activeTab == 1 ? 'InterSemiBold' : 'InterMedium'}
            >
              Dashboard
            </AppText>
          </Pressable>
          <Pressable
            style={[
              styles.firstTab,
              styles.center,
              activeTab == 2 && styles.activeTab,
              activeTab == 2 && { width: '60%' },
            ]}
            onPress={() => setactiveTab(2)}
          >
            <AppText
              color={activeTab == 2 ? 'white' : 'black'}
              size={activeTab == 2 ? 15 : 14}
              family={activeTab == 2 ? 'InterSemiBold' : 'InterMedium'}
            >
              Customer Information
            </AppText>
          </Pressable>
        </View>

        {
          activeTab == 2 && route?.params?.type && (
            <>
              <View style={[styles.approveRejectView, styles.row, { gap: 20 }]}>
                <View style={[styles.approveView, styles.row]}>
                  <Pressable
                    style={[styles.circle, styles.center]}
                    onPress={() => {
                      if (user?.id == customerData?.created_by || hirarchyLevel > 2) {
                        return
                      }
                      // If already approved → just toggle off (your existing logic)
                      if (punchInStatus === "APPROVED") {
                        setPunchInStatus('Random');
                        return;
                      }

                      // Show confirmation dialog before approving
                      Alert.alert(
                        "Confirm Approval",
                        "Are you sure you want to approve this customer?",
                        [
                          {
                            text: "Cancel",
                            style: "cancel",
                            // Optional: you can reset or do nothing
                          },
                          {
                            text: "Yes, Approve",
                            style: "default",
                            onPress: () => {
                              setPunchInStatus("APPROVED");
                              updateCustomerStatus('APPROVED');
                            }
                          }
                        ],
                        { cancelable: true }
                      );
                    }}
                  >
                    <View
                      style={[
                        styles.circleInner,
                        punchInStatus === "APPROVED" && {
                          backgroundColor: "#339D4F",
                          borderRadius: 12,
                        },
                      ]}
                    />
                  </Pressable>
                  <AppText size={14} color='#339D4F' family='InterRegular'>Approve</AppText>
                </View>

                <View style={[styles.approveView, styles.row]}>
                  <Pressable style={[styles.circle, styles.center, { borderColor: "#FF3333" }]} onPress={() => {
                    if (user?.id == customerData?.created_by || hirarchyLevel > 2) {
                      return
                    }
                    if (punchInStatus == "REJECTED") {
                      setPunchInStatus('Random')
                    } else {
                      setPunchInStatus("REJECTED")
                      rejectSheetRef.current?.show();
                    }
                  }}>
                    <View style={[styles.circleInner, punchInStatus == "REJECTED" && { backgroundColor: "#FF3333", borderRadius: 12, }]} />
                  </Pressable>
                  <AppText size={14} color='#FF3333' family='InterRegular'>Reject</AppText>
                </View>

                <View style={[styles.approveView, styles.row]}>
                  <Pressable style={[styles.circle, styles.center, { borderColor: "#d1c10c" }]} onPress={() => {
                    if (user?.id == customerData?.created_by || hirarchyLevel > 2) {
                      return
                    }
                    if (punchInStatus == "PENDING") {
                      setPunchInStatus('Random')
                    } else {
                      setPunchInStatus("PENDING")
                      updateCustomerStatus('PENDING');
                    }
                  }}>
                    <View style={[styles.circleInner, punchInStatus == "PENDING" && { backgroundColor: "#d1c10c", borderRadius: 12, }]} />
                  </Pressable>
                  <AppText size={14} color='#968a07' family='InterRegular'>Pending</AppText>
                </View>
              </View>
              {
                punchInStatus == "REJECTED" && (
                  <View>
                    <AppText size={16} color='red' underline='none' family='InterSemiBold'>Reject:
                      <AppText size={16} color='red' underline='underline' family='InterMedium'>{customerData?.remark}</AppText>
                    </AppText>
                  </View>
                )
              }
            </>
          )
        }

        {activeTab == 1 && (
          <View style={styles.activeInnerContainer}>
            <View style={styles.imageView}>
              <Pressable onPress={() => {
                if (customerData?.shop_image) {
                  setImages([`${IMAGE_BASE_URL}public/storage/${customerData.shop_image}`])
                  setInitialIndex(0);
                  setModalVisible(true)
                }

              }}>
                <FastImage
                  source={customerData?.shop_image
                    ? { uri: `${IMAGE_BASE_URL}public/storage/${customerData?.shop_image}` } : require('../../assets/images/Dummy/Customer2.png')}
                  style={styles.firstImage}

                />
              </Pressable>

              <View style={styles.textHeading}>
                <AppText color="black" size={16} family="InterMedium">
                  {customerData?.legal_name || '-'}
                </AppText>
                <AppText color="black" size={14} family="InterRegular" opacity={0.6}>
                  {customerData?.billing_address
                    ? `${customerData.billing_address}, ${(customerData.billing_city ? customerData.billing_city?.city_name : '' )|| ''}`
                    : 'Address not available'}
                </AppText>
              </View>
            </View>
            {
              customerData && (
                <Pressable
                  style={[
                    styles.button,
                    { alignSelf: 'flex-start', marginTop: 15, gap: 6 },
                    styles.row,
                    (checkInLoading) ? { opacity: 0.7 } : null,
                  ]}
                  onPress={() => {
                    if (customerData?.status == "REJECTED") {
                      Toast.show({
                        type: 'error',
                        text1: "Your customer is Rejected, you cannot check in this Customer"
                      })
                      return
                    }
                    if (routePunchInOut == true) {
                      handleCheckInOut()
                    } else {
                      if (routePunchInOut == false) {
                        Toast.show({ type: "error", text1: "Please Punch in your attendance" })
                      } else {
                        Toast.show({ type: "error", text1: "Your Today shift is end" })
                      }
                    }
                  }}
                  disabled={checkInLoading || loader}
                >
                  <CheckIcon color="white" />
                  <AppText size={12} color="#FDFDFD" family="InterSemiBold">
                    {checkInLoading
                      ? 'Processing...'
                      : checkInHanlde
                        ? 'Check Out'
                        : 'Check In'}
                  </AppText>
                </Pressable>
              )
            }


            {/* <View style={[styles.row, styles.filter]}>
              <AppText color="#1E1E1E" family="InterRegular" size={14}>
                AUG 2024 - AUG 2025
              </AppText>
              <Pressable style={styles.calender}>
                <CalenderIcon />
              </Pressable>
            </View> */}

            {/* <View style={styles.orderInformation}>
              <AppText size={16} color="black" family="InterSemiBold">
                Orders Information
              </AppText>
              <View style={[styles.row, styles.rowView]}>
                <View style={[styles.row, { gap: 13, alignItems: 'flex-start', marginTop: 18 }]}>
                  <View style={{ marginTop: 7 }}>
                    <BuyOrderIcon />
                  </View>
                  <View style={{ gap: 6 }}>
                    <AppText size={14} color="#5C5C5C" opacity={0.8} family="InterMedium">
                      Total Order Value
                    </AppText>
                    <AppText size={14} color="#000" family="InterBold">
                      API doesn't have → keep placeholder or use avg_monthly_purchase × 12 etc
                      20,000.00
                    </AppText>
                  </View>
                </View>

                <View style={[styles.row, { gap: 13, alignItems: 'flex-start', marginTop: 18 }]}>
                  <View style={{ marginTop: 7 }}>
                    <OrderBoxIcon />
                  </View>
                  <View style={{ gap: 6 }}>
                    <AppText size={14} color="#5C5C5C" opacity={0.8} family="InterMedium">
                      Total Order Qty
                    </AppText>
                    <AppText size={14} color="#000" family="InterBold">
                      40,000.00
                    </AppText>
                  </View>
                </View>
              </View>

              <View style={[styles.row, styles.rowView]}>
                <View style={[styles.row, { gap: 13, alignItems: 'flex-start', marginTop: 18 }]}>
                  <View style={{ marginTop: 7 }}>
                    <CalenderAddIcon />
                  </View>
                  <View style={{ gap: 6 }}>
                    <AppText size={14} color="#5C5C5C" opacity={0.8} family="InterMedium">
                      Last Visit Date
                    </AppText>
                    <AppText size={14} color="#000" family="InterBold">
                      {customerData?.check_status?.last_checkin?.checkin_datetime
                        ? new Date(customerData.check_status.last_checkin.checkin_datetime).toLocaleDateString()
                        : '-'}
                    </AppText>
                  </View>
                </View>

                <View style={[styles.row, { gap: 13, alignItems: 'flex-start', marginTop: 18 }]}>
                  <View style={{ marginTop: 7 }}>
                    <OrderHistoryIcon />
                  </View>
                  <View style={{ gap: 6 }}>
                    <AppText size={14} color="#5C5C5C" opacity={0.8} family="InterMedium">
                      Last Order Date
                    </AppText>
                    <AppText size={14} color="#000" family="InterBold">
                      06AUG2025 
                    </AppText>
                  </View>
                </View>
              </View>
            </View> */}

            {/* <View style={[styles.row, styles.gapView]}>
              <Pressable
                style={[styles.activityButton, styles.center, { backgroundColor: colors.blue }]}
                onPress={() => navigation.navigate('TourPlanPage')}
              >
                <FastImage
                  source={require('../../assets/images/DetailsIcon/Activity.png')}
                  style={{ height: 29, width: 29 }}
                  resizeMode="contain"
                />
                <AppText size={14} color="white" family="InterMedium">
                  Activity
                </AppText>
              </Pressable>

              <View style={[styles.activityButton, styles.center, { backgroundColor: 'rgba(57, 82, 153, 0.07)' }]}>
                <FastImage
                  source={require('../../assets/images/DetailsIcon/MenTImers.png')}
                  style={{ height: 29, width: 29 }}
                  resizeMode="contain"
                />
                <AppText size={14} color="black" opacity={0.8} family="InterMedium">
                  Order History
                </AppText>
              </View>
            </View> */}

            <View style={{ height: 40 }} />
          </View>
        )
        }

        {
          activeTab == 2 && !route?.params?.type && (
            <View style={styles.activeInnerContainer}>
              <View style={styles.imageView}>
                <AppText size={16} color="black" family="InterSemiBold">
                  Customer Details
                </AppText>
                <View style={styles.detailsView}>
                  <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                    Shop Name
                  </AppText>
                  <View style={{ height: 10 }} />
                  <AppText color="black" size={14} family="InterBold">
                    {customerData?.legal_name || '-'}
                  </AppText>
                </View>

                <View style={[styles.row, styles.detailsRow]}>
                  <View style={styles.detailsFirstRow}>
                    <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                      Person Name
                    </AppText>
                    <View style={{ height: 10 }} />
                    <AppText color="black" size={14} family="InterBold">
                      {customerData?.contact_person || '-'}
                    </AppText>
                  </View>
                  <View style={styles.detailsSecondRow}>
                    <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                      Phone Number
                    </AppText>
                    <View style={{ height: 10 }} />
                    <AppText color="black" size={14} family="InterBold">
                      {customerData?.mobile ? `+91 ${customerData.mobile}` : '+91 ---'}
                    </AppText>
                  </View>
                </View>

                <View style={[styles.row, styles.detailsRow]}>
                  <View style={styles.detailsFirstRow}>
                    <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                      Email Id
                    </AppText>
                    <View style={{ height: 10 }} />
                    <AppText color="black" size={14} family="InterBold">
                      {customerData?.email || '-'}
                    </AppText>
                  </View>
                  <View style={styles.detailsSecondRow}>
                    <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                      Customer Code
                    </AppText>
                    <View style={{ height: 10 }} />
                    <AppText color="black" size={14} family="InterBold">
                      {customerData?.distributor_code || '-'}
                    </AppText>
                  </View>
                </View>
              </View>

              <View style={[styles.imageView, { marginTop: 20 }]}>
                <View style={[styles.row, styles.headerRow]}>
                  <AppText size={16} color="black" family="InterSemiBold">
                    Location Details
                  </AppText>
                  <Pressable style={styles.button} onPress={handleLocation}>
                    <AppText size={12} color="#FDFDFD" family="InterSemiBold">
                      View Location
                    </AppText>
                  </Pressable>
                </View>

                <View style={[styles.detailsView, { marginTop: 15 }]}>
                  <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                    Shop Address
                  </AppText>
                  <View style={{ height: 10 }} />
                  <AppText color="black" size={14} family="InterBold">
                    {customerData?.billing_address || 'Indian Water Technology.com'}
                  </AppText>
                </View>

                <View style={[styles.row, styles.detailsRow]}>
                  <View style={styles.detailsFirstRow}>
                    <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                      Town Name
                    </AppText>
                    <View style={{ height: 10 }} />
                    <AppText color="black" size={14} family="InterBold">
                      {customerData?.billing_city?.city_name || '-'}
                    </AppText>
                  </View>
                  <View style={styles.detailsSecondRow}>
                    <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                      Pin Code
                    </AppText>
                    <View style={{ height: 10 }} />
                    <AppText color="black" size={14} family="InterBold">
                      {customerData?.billing_pincode?.pincode || '-'}
                    </AppText>
                  </View>
                </View>

                <View style={[styles.row, styles.detailsRow]}>
                  <View style={styles.detailsFirstRow}>
                    <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                      Type
                    </AppText>
                    <View style={{ height: 10 }} />
                    <AppText color="black" size={14} family="InterBold">
                      {customerData?.registration_type || '-'}
                    </AppText>
                  </View>
                </View>
              </View>

              <View style={[styles.imageView, { marginTop: 20 }]}>
                <AppText size={16} color="black" family="InterSemiBold">
                  Attachments
                </AppText>
                <View style={[styles.row, { flex: 1, gap: 27, marginTop: 20 }]}>
                  <Pressable style={styles.firstAttachemnt} onPress={() => {
                    setImages([`${IMAGE_BASE_URL}public/storage/${customerData.shop_image}`])
                    setInitialIndex(0);
                    setModalVisible(true)
                  }}>
                    <FastImage
                      style={styles.attImg}
                      source={customerData?.shop_image
                        ? { uri: `${IMAGE_BASE_URL}public/storage/${customerData.shop_image}` }
                        : require('../../assets/images/Dummy/Customer2.png')}
                    />
                    <AppText align="center" size={14} color="black" family="InterBold">
                      Outlet Image
                    </AppText>
                  </Pressable>

                  <View style={styles.firstAttachemnt}>
                    {
                      route?.params?.type ?
                        <FastImage
                          style={styles.attImg}
                          source={customerData?.owner_photo
                            ? { uri: `${IMAGE_BASE_URL}public/storage/${customerData?.owner_photo}` }
                            : require('../../assets/images/Dummy/Customer2.png')}
                        />
                        : (
                          <>
                            {
                              documents && Array.isArray(documents) && (
                                <FastImage
                                  style={styles.attImg}
                                  source={documents[0]
                                    ? { uri: `${IMAGE_BASE_URL}public/storage/${documents[0]}` }
                                    : require('../../assets/images/Dummy/Customer2.png')}
                                />
                              )
                            }
                          </>
                        )
                    }


                    <AppText align="center" size={14} color="black" family="InterBold">
                      Visiting Card
                    </AppText>
                  </View>
                </View>
              </View>

              <View style={[styles.imageView, { marginTop: 20 }]}>
                <AppText size={16} color="black" family="InterSemiBold">
                  Additional Information
                </AppText>

                <View style={[styles.row, styles.detailsRow]}>
                  <View style={styles.detailsFirstRow}>
                    <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                      GSTIN No.
                    </AppText>
                    <View style={{ height: 10 }} />
                    <AppText color="black" size={14} family="InterBold">
                      {customerData?.gst_number || '-'}
                    </AppText>
                  </View>
                  <View style={styles.detailsSecondRow}>
                    <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                      PAN No.
                    </AppText>
                    <View style={{ height: 10 }} />
                    <AppText color="black" size={14} family="InterBold">
                      {customerData?.pan_number || '-'}
                    </AppText>
                  </View>
                </View>

                <View style={[styles.row, styles.detailsRow]}>
                  <View style={styles.detailsFirstRow}>
                    <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                      Aadhar Card No.
                    </AppText>
                    <View style={{ height: 10 }} />
                    <AppText color="black" size={14} family="InterBold">
                      -
                    </AppText>
                  </View>
                  <View style={styles.detailsSecondRow}>
                    <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                      Other
                    </AppText>
                    <View style={{ height: 10 }} />
                    <AppText color="black" size={14} family="InterBold">
                      -
                    </AppText>
                  </View>
                </View>
              </View>
              {
                route?.params?.type && (
                  <Pressable style={styles.edit} onPress={() => {
                    if (!route?.params?.type) {
                      navigation.navigate('AddCustomer', { customer: customerData })
                    } else {
                      navigation.navigate('AddSecondaryCustomer', { customer: data, type: routeItem?.type })
                    }
                  }}>
                    <AppText color='white' family='InterSemiBold' size={16}>Edit</AppText>
                  </Pressable>
                )
              }


              <View style={{ height: 80 }} />
            </View>
          )
        }
        {
          activeTab == 2 && route?.params?.type && (
            <View style={{flex: 1, }}>
              {/* i want to show create_by name  */}
              <View style={{}}>
                <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                  Created By
                </AppText>
                <View style={{ height: 6 }} />
                <AppText color="black" size={14} family="InterBold">
                  {customerData?.creator || '-'}
                </AppText>
              </View>
            </View>
          )
        }
        {activeTab === 2 && route?.params?.type && (
          <View style={styles.activeInnerContainer}>
            <View style={styles.imageView}>
              <AppText size={16} color="black" family="InterSemiBold">
                Customer Details
              </AppText>

              {/* Shop & Owner Info */}
              <View style={styles.detailsView}>
                <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                  Shop Name
                </AppText>
                <View style={{ height: 6 }} />
                <AppText color="black" size={14} family="InterBold">
                  {customerData?.legal_name || customerData?.shop_name || '-'}
                </AppText>
              </View>

              <View style={styles.detailsView}>
                <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                  Owner Name
                </AppText>
                <View style={{ height: 6 }} />
                <AppText color="black" size={14} family="InterBold">
                  {customerData?.contact_person || customerData?.owner_name || '-'}
                </AppText>
              </View>

              <View style={styles.detailsView}>
                <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                  Mobile Numbers
                </AppText>
                <View style={{ height: 6 }} />

                {(() => {
                  if (!customerData?.mobile || !customerData.mobile.trim()) {
                    return (
                      <AppText color="black" size={14} family="InterBold">
                        -
                      </AppText>
                    );
                  }

                  const numbers = customerData.mobile
                    .split(',')
                    .map((num: string) => num.trim())
                    .filter((num: string | any[]) => num.length > 0);

                  if (numbers.length === 0) {
                    return (
                      <AppText color="black" size={14} family="InterBold">
                        -
                      </AppText>
                    );
                  }

                  return numbers.map((num: any, index: number) => (
                    <AppText
                      key={index}
                      color="black"
                      size={14}
                      family="InterBold"
                      style={{ marginBottom: 2 }} // optional spacing between lines
                    >
                      {index + 1}. +91 {num}
                    </AppText>
                  ));
                })()}
              </View>
            </View>

            {/* Address */}
            <View style={[styles.imageView, { marginTop: 20 }]}>
              <View style={[styles.row, styles.headerRow]}>
                <AppText size={16} color="black" family="InterSemiBold">
                  Location Details
                </AppText>
                <Pressable style={styles.button} onPress={handleLocation}>
                  <AppText size={12} color="#FDFDFD" family="InterSemiBold">
                    View Location
                  </AppText>
                </Pressable>
              </View>

              <View style={styles.detailsView}>
                <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                  Address Line
                </AppText>
                <View style={{ height: 6 }} />
                <AppText color="black" size={14} family="InterBold">
                  {customerData?.billing_address || customerData?.address_line || '-'}
                </AppText>
              </View>

              <View style={[styles.row, styles.detailsRow]}>
                <View style={styles.detailsFirstRow}>
                  <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                    State
                  </AppText>
                  <View style={{ height: 6 }} />
                  <AppText color="black" size={14} family="InterBold">
                    {customerData?.state || '-'}
                  </AppText>
                </View>
                <View style={styles.detailsSecondRow}>
                  <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                    District
                  </AppText>
                  <View style={{ height: 6 }} />
                  <AppText color="black" size={14} family="InterBold">
                    {customerData?.district || '-'}
                  </AppText>
                </View>
              </View>

              <View style={[styles.row, styles.detailsRow]}>
                <View style={styles.detailsFirstRow}>
                  <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                    City
                  </AppText>
                  <View style={{ height: 6 }} />
                  <AppText color="black" size={14} family="InterBold">
                    {customerData?.city || customerData?.billing_city || '-'}
                  </AppText>
                </View>
                <View style={styles.detailsSecondRow}>
                  <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                    Pincode
                  </AppText>
                  <View style={{ height: 6 }} />
                  <AppText color="black" size={14} family="InterBold">
                    {customerData?.billing_pincode || '-'}
                  </AppText>
                </View>
              </View>

              <View style={styles.detailsView}>
                <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                  GPS Location
                </AppText>
                <View style={{ height: 6 }} />
                <AppText color="black" size={14} family="InterBold">
                  {customerData?.gps_location || 'Not available'}
                </AppText>
              </View>
            </View>

            {/* Distributor & Beat */}
            <View style={[styles.imageView, { marginTop: 20 }]}>
              <AppText size={16} color="black" family="InterSemiBold">
                Additional Information
              </AppText>

              <View style={styles.detailsView}>
                <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                  Distributor Name
                </AppText>
                <View style={{ height: 6 }} />
                <AppText color="black" size={14} family="InterBold">
                  {customerData?.distributor_name || '-'}
                </AppText>
              </View>

              <View style={styles.detailsView}>
                <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                  Beat
                </AppText>
                <View style={{ height: 6 }} />
                <AppText color="black" size={14} family="InterBold">
                  {customerData?.beat_name || '-'}
                </AppText>
              </View>

              <View style={styles.detailsView}>
                <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                  Belt / Area / Market Name
                </AppText>
                <View style={{ height: 6 }} />
                <AppText color="black" size={14} family="InterBold">
                  {customerData?.belt_area_market_name || '-'}
                </AppText>
              </View>
            </View>

            {/* Bank & Tax */}
            <View style={[styles.imageView, { marginTop: 20 }]}>
              <AppText size={16} color="black" family="InterSemiBold">
                Bank & Tax Information
              </AppText>

              <View style={[styles.row, styles.detailsRow]}>
                <View style={styles.detailsFirstRow}>
                  <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                    GST Number
                  </AppText>
                  <View style={{ height: 6 }} />
                  <AppText color="black" size={14} family="InterBold">
                    {customerData?.gst_number || '-'}
                  </AppText>
                </View>
                <View style={styles.detailsSecondRow}>
                  <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                    PAN Number
                  </AppText>
                  <View style={{ height: 6 }} />
                  <AppText color="black" size={14} family="InterBold">
                    {customerData?.pan_number || '-'}
                  </AppText>
                </View>
              </View>

              <View style={[styles.row, styles.detailsRow]}>
                <View style={styles.detailsFirstRow}>
                  <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                    Account Holder Name
                  </AppText>
                  <View style={{ height: 6 }} />
                  <AppText color="black" size={14} family="InterBold">
                    {customerData?.account_holder_name || '-'}
                  </AppText>
                </View>
                <View style={styles.detailsSecondRow}>
                  <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                    Bank Account Number
                  </AppText>
                  <View style={{ height: 6 }} />
                  <AppText color="black" size={14} family="InterBold">
                    {customerData?.bank_account_number || '-'}
                  </AppText>
                </View>
              </View>

              <View style={[styles.row, styles.detailsRow]}>
                <View style={styles.detailsFirstRow}>
                  <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                    Bank Name
                  </AppText>
                  <View style={{ height: 6 }} />
                  <AppText color="black" size={14} family="InterBold">
                    {customerData?.bank_name || '-'}
                  </AppText>
                </View>
                <View style={styles.detailsSecondRow}>
                  <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                    IFSC Code
                  </AppText>
                  <View style={{ height: 6 }} />
                  <AppText color="black" size={14} family="InterBold">
                    {customerData?.ifsc_code || '-'}
                  </AppText>
                </View>
              </View>

              <View style={styles.detailsView}>
                <AppText color="black" size={14} family="InterMedium" opacity={0.8}>
                  Account Type
                </AppText>
                <View style={{ height: 6 }} />
                <AppText color="black" size={14} family="InterBold">
                  {customerData?.bank_account_type || '-'}
                </AppText>
              </View>
            </View>

            {/* Attachments */}
            <View style={[styles.imageView, { marginTop: 20 }]}>
              <AppText size={16} color="black" family="InterSemiBold">
                Attachments
              </AppText>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 16 }}>
                <Pressable
                  style={{ width: '48%', marginBottom: 16 }}
                  onPress={() => {
                    if (customerData?.shop_image) {
                      setImages([`${IMAGE_BASE_URL}public/storage/${customerData.shop_image}`]);
                      setInitialIndex(0);
                      setModalVisible(true);
                    }
                  }}
                >
                  <FastImage
                    style={{ height: 140, width: '100%', borderRadius: 12 }}
                    source={
                      customerData?.shop_image
                        ? { uri: `${IMAGE_BASE_URL}public/storage/${customerData.shop_image}` }
                        : require('../../assets/images/Dummy/Customer2.png')
                    }
                    resizeMode="cover"
                  />
                  <AppText align="center" size={13} color="black" family="InterBold" style={{ marginTop: 6 }}>
                    Shop Photo
                  </AppText>
                </Pressable>

                {customerData?.gst_attachment && (
                  <Pressable
                    style={{ width: '48%', marginBottom: 16 }}
                    onPress={() => {
                      setImages([`${IMAGE_BASE_URL}public/storage/${customerData.gst_attachment}`]);
                      setInitialIndex(0);
                      setModalVisible(true);
                    }}
                  >
                    <FastImage
                      style={{ height: 140, width: '100%', borderRadius: 12 }}
                      source={{ uri: `${IMAGE_BASE_URL}public/storage/${customerData.gst_attachment}` }}
                      resizeMode="cover"
                    />
                    <AppText align="center" size={13} color="black" family="InterBold" style={{ marginTop: 6 }}>
                      GST Attachment
                    </AppText>
                  </Pressable>
                )}

                {customerData?.pan_attachment && (
                  <Pressable
                    style={{ width: '48%', marginBottom: 16 }}
                    onPress={() => {
                      setImages([`${IMAGE_BASE_URL}public/storage/${customerData.pan_attachment}`]);
                      setInitialIndex(0);
                      setModalVisible(true);
                    }}
                  >
                    <FastImage
                      style={{ height: 140, width: '100%', borderRadius: 12 }}
                      source={{ uri: `${IMAGE_BASE_URL}public/storage/${customerData.pan_attachment}` }}
                      resizeMode="cover"
                    />
                    <AppText align="center" size={13} color="black" family="InterBold" style={{ marginTop: 6 }}>
                      PAN Attachment
                    </AppText>
                  </Pressable>
                )}

                {customerData?.bank_proof && (
                  <Pressable
                    style={{ width: '48%', marginBottom: 16 }}
                    onPress={() => {
                      setImages([`${IMAGE_BASE_URL}public/storage/${customerData.bank_proof}`]);
                      setInitialIndex(0);
                      setModalVisible(true);
                    }}
                  >
                    <FastImage
                      style={{ height: 140, width: '100%', borderRadius: 12 }}
                      source={{ uri: `${IMAGE_BASE_URL}public/storage/${customerData.bank_proof}` }}
                      resizeMode="cover"
                    />
                    <AppText align="center" size={13} color="black" family="InterBold" style={{ marginTop: 6 }}>
                      Bank Proof
                    </AppText>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Edit Button */}
            {
              route?.params?.type && (
                <Pressable
                  style={styles.edit}
                  onPress={() => {
                    if (!route?.params?.type) {
                      navigation.navigate('AddCustomer', { customer: customerData });
                    } else {
                      navigation.navigate('AddSecondaryCustomer', { customer: data, type: routeItem?.type });
                    }
                  }}
                >
                  <AppText color="white" family="InterSemiBold" size={16}>
                    Edit
                  </AppText>
                </Pressable>
              )
            }


            <View style={{ height: 60 }} />
          </View>
        )}


        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={closeModal}
          statusBarTranslucent
        // supportedOrientations={['portrait', 'landscape']}
        >
          <View style={styles.modalContainer}>

            <Pressable style={{ height: 55, width: 55, marginTop: useSafeAreaInsets()?.top, justifyContent: 'center', alignItems: 'center', alignSelf: "flex-end", marginRight: 8 }} onPress={() => {
              setImages([]);
              setModalVisible(false)
            }}>
              <CrossIcon size={30} color="white" />
            </Pressable>
            <Gallery
              data={images} // already an array
              ref={galleryRef}
              initialIndex={initialIndex}
              style={{ flex: 1 }}
              pinchEnabled={true}
              doubleTapEnabled={true}
              doubleTapScale={2.5}
              maxScale={6}
              minScale={0.8}
              disableSwipeUp
              disableVerticalSwipe
              loop={false}
              onScaleChange={(scale) => console.log('Current zoom scale:', scale)}
              onIndexChange={(idx) => console.log('Swiped to image:', idx + 1)}


            />
          </View>
        </Modal>
      </ScrollView >

      <ActionSheet
        ref={rejectSheetRef}
        // gestureEnabled={true}
        // snapPoints={[45, 70]}            // % of screen height
        statusBarTranslucent
        drawUnderStatusBar={true}
        containerStyle={{
          backgroundColor: '#fff',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
        indicatorStyle={{
          backgroundColor: '#ccc',
          width: 40,
          height: 5,
        }}
        keyboardHandlerEnabled={true}     // important for TextInput
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ height: 'auto' }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <View style={{ paddingHorizontal: 24, paddingTop: 16, }}>
            <AppText
              size={18}
              family="InterSemiBold"
              color="black"
              style={{ marginBottom: 16 }}
            >
              Reason for Rejection
            </AppText>

            <TextInput
              multiline
              numberOfLines={5}
              placeholder="e.g., Bank proof missing, mismatch in PAN details..."
              placeholderTextColor="#999"
              value={remark}
              onChangeText={setRemark}
              style={{
                borderWidth: 1,
                borderColor: '#ddd',
                borderRadius: 12,
                padding: 14,
                fontSize: 16,
                minHeight: 120,
                maxHeight: 220,
                textAlignVertical: 'top',
                color: '#000',
                backgroundColor: '#fafafa',
              }}
              maxLength={400}
              editable={!statusLoading}
            />

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
              <Pressable
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  backgroundColor: '#f0f0f0',
                  borderRadius: 12,
                  alignItems: 'center',
                }}
                onPress={() => {
                  setRemark('');
                  rejectSheetRef.current?.hide();
                }}
                disabled={statusLoading}
              >
                <AppText color="#555" family="InterMedium">Cancel</AppText>
              </Pressable>

              <Pressable
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  backgroundColor: remark.trim().length < 3 ? '#ffb3b3' : '#FF3333',
                  borderRadius: 12,
                  alignItems: 'center',
                }}
                disabled={statusLoading || remark.trim().length < 3}
                onPress={() => updateCustomerStatus('REJECTED', remark)}
              >
                <AppText color="white" family="InterSemiBold">
                  {statusLoading ? 'Submitting...' : 'Confirm Reject'}
                </AppText>
              </Pressable>
            </View>

            <View style={{ height: 20 }} /> {/* bottom padding */}
          </View>
        </KeyboardAvoidingView>
      </ActionSheet>
    </View >
  )
}

export default CustomerDetails