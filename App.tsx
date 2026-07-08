/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, { useEffect, useState } from 'react';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Button, PermissionsAndroid, Platform, StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  createNavigationContainerRef,
  DefaultTheme,
  NavigationContainer,
  NavigationContainerRef,
} from '@react-navigation/native';
import { KeyboardProvider } from "react-native-keyboard-controller";

import Toast, {
  BaseToast,
  BaseToastProps,
  ErrorToast,
} from 'react-native-toast-message';
import { colors } from './src/utils/Colors';
import store, { persistor } from './src/components/redux/Store';
import SplashScreen from './src/screens/Splash';
import Routes from './src/navigations/Routes';
import { navigationRef } from './src/services/NavigationService';
import {
  initializeLiveLocationTracking,
  runAndroidFirstTimeLiveLocationSetup,
} from './src/services/liveLocationService';
;


const queryClient = new QueryClient();

const App = () => {
  const [loading, setLoading] = useState(true);
  // const navigationRef = React.useRef<NavigationContainerRef<any>>(null);
  //  const navigationRef = createNavigationContainerRef();

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  }, []);

  const initializeAfterRehydrate = () => {
    void runAndroidFirstTimeLiveLocationSetup();
    void initializeLiveLocationTracking();
  };

  const MyTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: 'transparent',
    },
  };

  const toastConfig = {
    success: (props: BaseToastProps) => (
      <BaseToast
        {...props}

        text2NumberOfLines={0}
        style={{
          borderLeftColor: colors.blue,
        }}
      />
    ),
    error: (props: BaseToastProps) => <ErrorToast {...props} text1NumberOfLines={0}
      text2NumberOfLines={0} />,
  };


  return (

    <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Provider store={store}>
          <PersistGate persistor={persistor} onBeforeLift={initializeAfterRehydrate}>
            <QueryClientProvider client={queryClient}>
                <View style={{ flex: 1, backgroundColor: colors.bgColor }}>
                  <StatusBar
                    translucent
                    backgroundColor="transparent"
                    barStyle={'light-content'}
                  />

                  <NavigationContainer
                    ref={navigationRef}
                    theme={MyTheme}
                    onReady={() => {
                      // Navigation is ready
                      console.log('Navigation is ready');
                    }}
                  >

                    {loading ? <SplashScreen /> : <Routes />}
                  </NavigationContainer>

                  <Toast config={toastConfig} visibilityTime={1500} />
                  {Platform.OS == 'android' && (
                    <SafeAreaView style={{ backgroundColor: colors.white }} /> 
                  )}

                </View>
            </QueryClientProvider> 
          </PersistGate>
        </Provider>
      </GestureHandlerRootView>
    </KeyboardProvider>
  );
};

export default App
