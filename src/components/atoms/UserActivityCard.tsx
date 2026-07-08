import React from "react";
import { Alert, Linking, Platform, Pressable, StyleSheet, View } from "react-native";
import AppText from "../AppText/AppText";
import { colors } from "../../utils/Colors";
import { ClockIcon, LocationIcon } from "../../assets/svgs/HomePageSvgs";
import Toast from "react-native-toast-message";

const UserActivityCard = ({ todayPunchInData, item, navigation, index }: any) => {

  const openGoogleMaps = (lat: string, lng: string, label?: string) => {
    if (!lat || !lng) {
      Toast.show({ type: "info", text1: "Location not available" })
      return;
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    const url = Platform.select({
      ios: `http://maps.apple.com/?ll=${latitude},${longitude}`,
      android: `geo:${latitude},${longitude}?q=${latitude},${longitude}`
    });

    Linking.openURL(url as string);
  };

  const handleLocation = async (lat: any, lang: any, add: any) => {
    // const gps = item?.gps_location?.trim();
    const addr = add?.trim();

    let query = '';

    // Prefer coordinates if available
    // if (gps && gps.includes(',')) {
    //   const [lat, lng] = gps.split(',').map((s: string) => s.trim());
    if (lat && lang) {
      query = `${lang},${lat}`;
    }
    // }

    // Fallback to address
    // if (!query && addr) {
    //   query = encodeURIComponent(addr);
    // }

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
    <Pressable style={styles.gap} >
      <View style={[styles.line,]}>
        <AppText
          size={15}
          color={colors.white}
          family='InterSemiBold'>
          {item?.title == "New Customer Registration" ? "Customer Add" : item?.title}
        </AppText>
        <View style={[styles.row, { gap: 10 }]}>
          <View style={styles.row}>
            <ClockIcon />
            <AppText
              size={14}
              color={colors.white}
              opacity={0.8}
              family='InterMedium'>
              {item?.time}
            </AppText>
          </View>

          <>
            {
              (item?.latitude != "" && item?.longitude != "") && (
                <Pressable style={styles.row} onPress={() => {
                  if (item?.title == "Checkin" || item?.title == "Checkout") {
                    handleLocation(item?.longitude, item?.latitude, item?.location)
                  } else {
                    handleLocation(item?.latitude, item?.longitude, item?.location)
                  }
                }}>
                  <LocationIcon />
                  <AppText
                    size={14}
                    color={colors.white}
                    opacity={0.8}
                    family='InterMedium'>
                    {'View'}
                  </AppText>
                </Pressable>
              )
            }
          </>



        </View>
      </View>
      {
        item?.title == "Order" && (
          <View style={[styles.inner]}>

            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Order No: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.order_no}

              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Order Value: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.value}
              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Order Quantity: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.qty}
              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Buyer Name: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.customer}
              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Seller Name: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.seller}
              </AppText>
            </AppText>
          </View>
        )
      }
      {
        (item?.title == "Customer Edit" || item?.title == "Customer Rejected" || item?.title == "Customer Approved") && (
          <View style={[styles.inner]}>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Customer Name: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.customer}
              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Address: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.location}

              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'City: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.city}

              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'State: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.state}

              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Customer Type: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.customer_type}

              </AppText>
            </AppText>
            {
              item?.title == "Customer Rejected" && (
                <AppText
                  size={14}
                  color={'#1E1E1E'}
                  family='InterRegular'>
                  {'Remark: '}
                  <AppText
                    size={14}
                    color={'#1E1E1E'}
                    family='InterSemiBold'>
                    {item?.remark}

                  </AppText>
                </AppText>
              )
            }


          </View>
        )
      }
      {
        item?.title == "Punchin" && (
          <View style={[styles.inner]}>

            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Location: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.location}

              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Objective: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.working_type}
              </AppText>
            </AppText>
          </View>
        )
      }
      {
        item?.title == "Checkin" && (
          <View style={[styles.inner]}>

            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Location: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.location}

              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Customer: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.customer}
              </AppText>
            </AppText>
          </View>
        )
      }
      {
        item?.title == "New Customer Registration" && (
          <View style={[styles.inner]}>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Customer: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.customer}
              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Address: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.location}

              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'City: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.city}

              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'State: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.state}

              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Customer Type: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.customer_type}

              </AppText>
            </AppText>

          </View>
        )
      }
      {
        item?.title == "Punchout" && (
          <View style={[styles.inner]}>

            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Location: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.location || 'N/A'}

              </AppText>
            </AppText>

          </View>
        )
      }
      {
        item?.title == "Checkout" && (
          <View style={[styles.inner]}>

            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Location: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.location}

              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Customer Name: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.customer}
              </AppText>
            </AppText>
            <AppText
              size={14}
              color={'#1E1E1E'}
              family='InterRegular'>
              {'Remark: '}
              <AppText
                size={14}
                color={'#1E1E1E'}
                family='InterSemiBold'>
                {item?.remark}
              </AppText>
            </AppText>
          </View>
        )
      }

    </Pressable>
  );
};

const styles = StyleSheet.create({
  inner: {
    backgroundColor: 'white',
    paddingBottom: 16,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    paddingHorizontal: 14,
    gap: 6
    // shadowOffset: { width: 0, height: 10 },
    // shadowColor: 'grey',
    // shadowOpacity: 0.2,
    // shadowRadius: 5,
    // elevation: 4
  },
  line: {
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: '#3654a4',
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowOffset: { width: 0, height: 10 },
    // shadowColor: 'grey',
    // shadowOpacity: 0.2,
    // shadowRadius: 5,
    // elevation: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  gap: {
    gap: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  }
});

export default UserActivityCard;
