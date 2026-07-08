import React from 'react';
import { View, TouchableOpacity, Image, StyleSheet, Platform, Pressable } from 'react-native';
import AppText from '../AppText/AppText';
import { rw } from '../../utils/responsive';

interface AttendanceItem {
  id: string;
  count: number;
  label: string;
  color?: string;
  textColor?: string;
  image?: any;           // require() path for image
}

interface AttendanceCardProps {
  item: AttendanceItem;
  data: any;
  index: number;
  onPress?: (item: AttendanceItem) => void;
}

const AttendanceCard: React.FC<AttendanceCardProps> = ({ item, onPress, data, index }) => {
  let count = 0;
  if(index === 0){
    count = data?.asr?.total + data?.dsr?.total || 0;
  } else if(index === 1){
    count = (data?.asr?.checked_in_today + data?.dsr?.checked_in_today) - (data?.leave_asr_today + data?.leave_dsr_today) || 0;
  } else if(index === 2){
    count = (data?.leave_asr_today + data?.leave_dsr_today) || 0;
  } else if(index === 3){
    count = (data?.asr?.not_checked_in_today + data?.dsr?.not_checked_in_today) || 0;
  }
  return (
    <Pressable
      onPress={() => onPress?.(item)}
      style={stylesss.card}>
      {/* Image Container */}
      <View style={[stylesss.imageContainer, { backgroundColor: item?.color }]}>
        <Image
          source={item.image}
          style={stylesss.image}
          resizeMode="contain"
        />
      </View>

      <AppText size={18} family="InterSemiBold" color={item?.textColor ? item?.textColor : "#1F2937"}>
        {count}
      </AppText>

      <AppText
        size={11}
        color="#6b7280"
        family="InterMedium"
      >
        {item.label}
      </AppText>
    </Pressable>
  );
};

export const stylesss = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingBottom: 10,
    paddingTop: 16,
    marginTop: 16,
    borderRadius: 14,
    shadowOffset: { width: 4, height: 5 },
    shadowColor: Platform.OS == "ios" ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.1)',
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 8,
    paddingVertical: rw(16),
    alignItems: 'center',
    width: '23.5%',
    borderWidth: 2,
    borderColor: "#e6e8eb"
  },
  imageContainer: {
    marginBottom: rw(4),
    width: rw(22),
    height: rw(22),
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: rw(10),
    height: rw(10),
  },
});

export default AttendanceCard;