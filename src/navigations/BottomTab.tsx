import { View, Text, Platform } from 'react-native'
import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CustomerDetails from '../screens/Customer/CustomerDetails';
import TourPlanPage from '../screens/TourPlan';
import CreatePlan from '../screens/TourPlan/CreatePlan';
import ExpenseReport from '../screens/ExpenseReport';
import CustomHeader from '../components/Header';
import { SCREEN_WIDTH } from '../utils/misc';
import { colors } from '../utils/Colors';
import { ActiveHomeIcon, ActiveTaskIcon, ActiveTwoMenIcon, HomeIcon, MessageIcon, TaskIcon, TwoMenIcon } from '../assets/svgs/BottomTabSvgs';
import AppText from '../components/AppText/AppText';
import Home from '../screens/Home';
import OrderList from '../screens/OrderScreen';
import MarketIntelligenceScreen from '../screens/MarketIntelligence';
import BeatsScreen from '../screens/BeatScreen';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppSelector } from '../components/redux/Store';
const Tab = createBottomTabNavigator();

const BottomTab = () => {
  const insets = useSafeAreaInsets();
  const { activeBg } = useAppSelector(
      (state) => state.auth
    );
  return (
    <Tab.Navigator
      detachInactiveScreens={false}
      screenOptions={{
        headerShown: false,
        animation: 'none',
        header: (props) => <CustomHeader {...props} />,
        tabBarStyle: {
          position: "absolute",
          bottom: Platform.OS == "ios" ? 14 : insets.bottom + 10,
          // bottom: 20,
          width: SCREEN_WIDTH * 0.9,
          marginLeft: SCREEN_WIDTH * 0.05,
          borderRadius: 50,
          height: 82,
          paddingHorizontal: 8,
          paddingBottom: 8,
          paddingTop: 8,
          backgroundColor: '#fff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 10,
          elevation: 10,

        },
        tabBarShowLabel: false, // We'll show labels manually if needed
        tabBarActiveTintColor: colors.blue,
        tabBarInactiveTintColor: '#8E8E93',
        // animation: 'shift'

      }}
      >
      <Tab.Screen name='Home' component={Home} options={{
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <View
            style={[
              !activeBg && {
              backgroundColor: focused ? 'rgba(0,0,0,0.10)' : 'transparent',
              borderRadius: 33,
            },{
              height: 66,
              width: (SCREEN_WIDTH * 0.9) / 4 - 8,
              borderRadius: 33,
               // Active circle
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 28,
              gap: 2,
              overflow:'hidden'
            }]}
          >
            {focused ? <ActiveHomeIcon /> : <HomeIcon />}
            <AppText color={colors.blue} family={focused ? "InterRegular" : 'InterMedium'} size={13}>Home</AppText>
          </View>
        ),
      }} />
      {/* <Tab.Screen name='CustomerDetails' component={CustomerDetails} options={{
        headerShown: true,
        title: 'Customer Details',
        tabBarIcon: ({ focused }) => (
          <View
            style={{
              height: 66,
              width: (SCREEN_WIDTH * 0.9) / 4 - 8,
              borderRadius: 33,
              backgroundColor: focused ? 'rgba(0,0,0,0.10)' : 'transparent', // Active circle
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 28,
              gap: 2
            }}
          >
            {focused ? <ActiveHomeIcon /> : <HomeIcon />}
            <AppText color={colors.blue} family={focused ? "InterRegular" : 'InterMedium'} size={13}>Home</AppText>
          </View>
        ),
      }} /> */}
      <Tab.Screen
        name="MarketIntelligenceScreen"
        component={MarketIntelligenceScreen}
        listeners={{
          tabPress: (e) => {
            e.preventDefault(); // ❌ stop navigation

            Toast.show({
              type: 'info',
              text1: 'This feature is coming soon',
              position: 'top',
            });
          },
        }}
        options={{
          headerShown: true,
          title: 'Market Intelligence',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                height: 66,
                width: focused
                  ? (SCREEN_WIDTH * 0.9) / 4 + 10
                  : (SCREEN_WIDTH * 0.9) / 4 - 8,
                borderRadius: 33,
                backgroundColor: focused ? 'rgba(0,0,0,0.10)' : 'transparent',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: 28,
                gap: 2,
              }}
            >
              {focused ? <ActiveTwoMenIcon /> : <TwoMenIcon />}
              <AppText
                color={colors.blue}
                family={focused ? 'InterRegular' : 'InterMedium'}
                size={13}
              >
                Intelligence
              </AppText>
            </View>
          ),
        }}
      />
      <Tab.Screen name='Beats' component={BeatsScreen} options={{
        headerShown: true,
        title: 'Beats',
        tabBarIcon: ({ focused }) => (
          <View
            style={{
              height: 66,
              width: (SCREEN_WIDTH * 0.9) / 4 - 8,
              borderRadius: 33,
              backgroundColor: focused ? 'rgba(0,0,0,0.10)' : 'transparent', // Active circle
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 28,
              gap: 2
            }}
          >
            {focused ? <ActiveTaskIcon /> : <TaskIcon />}
            <AppText color={colors.blue} family={focused ? "InterRegular" : 'InterMedium'} size={13}>Beats</AppText>
          </View>
        ),
      }} />

      <Tab.Screen name='OrderList' component={OrderList} options={{
        headerShown: true,
        title: 'Orders',
        tabBarIcon: ({ focused }) => (
          <View
            style={{
              height: 66,
              width: (SCREEN_WIDTH * 0.9) / 4 - 8,
              borderRadius: 33,
              backgroundColor: focused ? 'rgba(0,0,0,0.10)' : 'transparent', // Active circle
              justifyContent: 'center',
              alignItems: 'center',
              marginTop: 28,
              gap: 2
            }}
          >
            <MessageIcon />
            <AppText color={colors.blue} family={focused ? "InterRegular" : 'InterMedium'} size={13}>History</AppText>
          </View>
        ),
      }} />
    </Tab.Navigator>
  )
}

export default BottomTab