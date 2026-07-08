import React, { useRef } from 'react';
import {
  View,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
  Easing,
  Platform,
} from 'react-native';
import { colors } from '../../utils/Colors';
import { LocationIcon } from '../../assets/svgs/HomePageSvgs';
import AppText from '../../components/AppText/AppText';



interface CustomToggleRowProps {
  label: string;
  value: boolean;
  onValueChange: (newValue: boolean) => void;
  disabled?: boolean;
}

const CustomToggleRow = ({
  label,
  value,
  onValueChange,
  disabled = false,
}: CustomToggleRowProps) => {
  const animatedValue = useRef(new Animated.Value(value ? 1 : 0)).current;

  // Sync external value changes (if controlled from parent)
  React.useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: value ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [value]);

  const toggle = () => {
    if (disabled) return;

    const newValue = !value;
    onValueChange(newValue);

    Animated.timing(animatedValue, {
      toValue: newValue ? 1 : 0,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  // Interpolate values
  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 22], // adjust if you change SWITCH_WIDTH / thumb size
  });

  const trackBackground = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.white, colors.white], // off: grayish, on: green (or your color)
  });

  const thumbBackground = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['red', "#39C04E"], // can differ if you want
  });

  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleLabel}>
        <LocationIcon />
        <AppText size={14} color={colors.white} family="InterRegular">
          Geo Tag
        </AppText>
      </View>

      <TouchableWithoutFeedback onPress={toggle} disabled={disabled}>
        <View style={styles.switchContainer}>
          <Animated.View
            style={[
              styles.track,
              {
                backgroundColor: trackBackground,
                opacity: disabled ? 0.5 : 1,
              },
            ]}
          />

          <Animated.View
            style={[
              styles.thumb,
              {
                transform: [{ translateX }],
                backgroundColor: thumbBackground,
                elevation: value ? 4 : 2, // subtle shadow lift when on
                shadowOpacity: value ? 0.3 : 0.15,
              },
            ]}
          />
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default CustomToggleRow;

const SWITCH_WIDTH = 52;
const SWITCH_HEIGHT = 30;
const THUMB_SIZE = 26;

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    backgroundColor:'#39C04E'
  },
  toggleLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchContainer: {
    width: SWITCH_WIDTH,
    height: SWITCH_HEIGHT,
    justifyContent: 'center',
  },
  track: {
    width: '100%',
    height: '100%',
    borderRadius: SWITCH_HEIGHT / 2,
    position: 'absolute',
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    ...Platform.select({
      android: { elevation: 3 },
    }),
  },
});