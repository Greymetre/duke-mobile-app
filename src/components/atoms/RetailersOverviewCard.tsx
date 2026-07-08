import React from 'react';
import { View, StyleSheet, Image, Pressable } from 'react-native';
import AppText from '../AppText/AppText';
import { rw } from '../../utils/responsive';
import { stylesss } from './AttendanceCard';
import { orderData } from '../../utils/CommanFunction';
import { formatShortNumber } from '../../utils/misc';

const RetailersOverviewCard = ({data}: any) => {
    return (
        <View style={styles.container}>
            <View style={styles.card}>
                {/* Header Text */}
                <AppText size={11} color="#9ca3af" family='InterRegular'>
                    Registered & Approved · as On Date
                </AppText>

                {/* Main Number */}
                <View style={styles.mainRow}>
                    <AppText size={30} family='InterMedium' color="#3a4da0">
                        {data?.secondary_customers_registered_approved_current_year}
                    </AppText>
                    <View style={styles.todayBadge}>
                        <AppText size={11} color="#125748" family="InterMedium">
                            +{data?.secondary_customers_registered_approved_today} today
                        </AppText>
                    </View>
                    <View style={[styles.iconContainer]}>
                        <Image
                            source={require('../../assets/images/Dummy/user.png')}
                            style={styles.activityImage}
                            resizeMode="contain"
                        />
                    </View>
                </View>

                {/* Unique Retailers */}
                <View style={styles.uniqueContainer}>
                    <View style={styles.checkIcon}>
                        <Image
                            source={require('../../assets/images/Dummy/checkcircle.png')}
                            style={styles.activityImage}
                            resizeMode="contain"
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <AppText size={12} family='InterMedium' color="#3a4da0">
                            Unique Retailers Ordered
                        </AppText>
                        <AppText size={11} color="#6b7280" family="InterMedium">
                            YTD · placed at least 1 order
                        </AppText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                        <AppText size={22} family='InterSemiBold' color="#3a4da0">
                            {data?.secondary_customers_with_order_current_year}
                        </AppText>
                        <AppText size={11} color="#267a66" family='InterMedium'>
                            {/* 76% of total */}
                        </AppText>
                    </View>
                </View>

                {/* Year to Date Orders */}
                <View style={styles.ytdSection}>
                    <View style={styles.ytdHeader}>
                        <AppText size={11} color="#6b7280" family="InterMedium">
                            YEAR TO DATE ORDERS
                        </AppText>
                        <View style={styles.ytdBadge}>
                            <AppText size={12} color="#3a4da0" family="InterMedium">YTD</AppText>
                        </View>
                    </View>

                    <View style={styles.orderGrid}>
                        {orderData.map((item: any, index: number) => {
                            let count : any = 0;
                            if(index === 0) {
                                count = data?.total_orders_current_year || 0;
                            } else if(index === 1) {
                                count = formatShortNumber(data?.total_order_quantity_current_year) || 0;
                            } else if(index === 2) {
                                count = formatShortNumber(data?.total_order_value_current_year) || 0;
                            }
                            return (
                                <Pressable
                                    key={item.id}
                                    style={[stylesss.card,{marginTop:0,width:'31.5%',alignItems:"flex-start"}]}>
                                    <View style={{flexDirection:'row',alignItems:'center',gap:8,marginBottom:4}}>
                                        <View style={[stylesss.imageContainer, { backgroundColor: item?.color }]}>
                                        <Image
                                            source={item.image}
                                            style={stylesss.image}
                                            resizeMode="contain"
                                            tintColor={item?.imageColor}
                                        />
                                    </View>
                                     <AppText
                                        size={12}
                                        color="#6b7280"
                                        family="InterMedium">
                                        {item.label}
                                    </AppText>
                                    </View>

                                    <AppText size={18} family="InterSemiBold" color={item?.textColor ? item?.textColor : "#1F2937"} >
                                        {count}
                                    </AppText>

                               
                                </Pressable>
                            )
                        })}
                    </View>


                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: rw(19),
        marginTop: rw(16),
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: rw(18),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 4,
    },
    mainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: rw(12),
        marginBottom: rw(12),
        marginTop: 4
    },
    todayBadge: {
        backgroundColor: '#e1f5ee',
        paddingHorizontal: rw(8),
        paddingVertical: rw(2),
        borderRadius: 999,
    },
    iconContainer: {
        marginBottom: rw(4),
        width: rw(40),
        height: rw(40),
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 'auto',
        backgroundColor: '#e8eaf2'
    },
    activityImage: {
        width: rw(20),
        height: rw(20),
    },
    uniqueContainer: {
        flexDirection: 'row',
        backgroundColor: '#e8eaf2',
        borderRadius: 12,
        paddingHorizontal: rw(12),
        paddingVertical: 6,
        alignItems: 'center',
        gap: rw(10),
    },
    checkIcon: {
        width: rw(35),
        height: rw(35),
        backgroundColor: 'white',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    ytdSection: {
        marginTop: rw(16),
    },
    orderGrid: {
        flexDirection: 'row',
        gap: 8,
    },
    ytdHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: rw(14),
    },
    ytdBadge: {
        backgroundColor: '#fff',
        paddingHorizontal: rw(8),
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#d4d9ea'
    },

});

export default RetailersOverviewCard;
