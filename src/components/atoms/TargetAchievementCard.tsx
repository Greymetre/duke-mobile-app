import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import AppText from '../AppText/AppText';
import { rw } from '../../utils/responsive';
import { colors } from '../../utils/Colors';
import { formatShortNumber } from '../../utils/misc';

interface TargetAchievementCardProps {
    onViewAllPress?: () => void;
    homeData: any
}

const TargetAchievementCard: React.FC<TargetAchievementCardProps> = ({
    onViewAllPress,
    homeData
}) => {
    const [activeMainTab, setActiveMainTab] = useState<'ASR' | 'DSR'>('ASR');
    const quantityTarget = activeMainTab === 'ASR' ? homeData?.asr_target?.target_qty ||(10000) * 2 : homeData?.dsr_target?.target_qty ||(10000);
    const valueTarget = activeMainTab === 'ASR' ? homeData?.asr_target?.target * 100000 || (10000000) * 2 : homeData?.dsr_target?.target * 100000 || (10000000) * 2; // 1Cr default

    const quantityAchieved = activeMainTab === 'ASR' ? homeData?.current_month_orders?.quantity : homeData?.current_month_orders_dsr?.quantity || 0;
    const valueAchieved = activeMainTab === 'ASR' ? homeData?.current_month_orders?.value : homeData?.current_month_orders_dsr?.value || 0;

    const quantityPercentage = (quantityAchieved / quantityTarget) * 100;
    const valuePercentage = (valueAchieved / valueTarget) * 100;

    const finalQtyPercent = Math.min(quantityPercentage, 100);
    const finalValPercent = Math.min(valuePercentage, 100);
    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.topTabs}>
                    <Pressable style={[styles.tab, activeMainTab === 'ASR' && styles.activeTab]}
                        onPress={() => setActiveMainTab('ASR')} hitSlop={10}>
                        <AppText size={14} family="InterMedium" color={activeMainTab === 'ASR' ? 'white' : '#64748B'}>
                            ASR
                        </AppText>
                    </Pressable>
                    <Pressable
                        style={[styles.tab, activeMainTab === 'DSR' && styles.activeTab]}
                        onPress={() => setActiveMainTab('DSR')} hitSlop={10}>
                        <AppText
                            size={14}
                            family="InterMedium"
                            color={activeMainTab === 'DSR' ? 'white' : '#64748B'}
                        >
                            DSR
                        </AppText>
                    </Pressable>
                </View>
                {/* ASR Header */}
                <View style={styles.asrHeader}>
                    <View style={styles.asrBadge}>
                        <AppText size={12} family="InterSemiBold" color="white">
                            {activeMainTab === 'ASR' ? 'ASR' : 'DSR'}
                        </AppText>
                    </View>
                    <View style={styles.asrInfo}>
                        <AppText size={16} family='InterSemiBold' color="#1F2937">
                            MTD Target Vs{'\n'}Achievement
                        </AppText>
                        {/* <AppText size={12} color="#64748B" family='InterMedium'>
                            
                        </AppText> */}
                    </View>

                    <View style={styles.retailersContainer}>
                        <AppText size={10} color="#64748B" family='InterMedium'>No.of Retailers</AppText>
                        <AppText size={9} color="#64748B" family='InterMedium'>(MTD Order Unique No)</AppText>
                        <AppText size={18} family='InterBold' color={colors.blue}>
                            {activeMainTab === 'ASR' ? homeData?.unique_buyers_from_asr : homeData?.unique_buyers_from_dsr}
                            {/* 200 */}
                        </AppText>
                    </View>
                </View>

                <View style={{
                    borderWidth: 1,
                    borderColor: '#e5e7eb'
                }} />
                {/* Progress Section */}
                <View style={styles.progressSection}>
                    {/* Quantity Progress */}
                    <View>
                        <View style={styles.progressHeader}>
                            <View>
                                <AppText size={14} color="#6b7280" family="InterMedium">Quantity</AppText>
                                <AppText size={19} family="InterSemiBold" color="#1F2937">
                                    {activeMainTab === 'ASR' ? formatShortNumber(homeData?.current_month_orders?.quantity) : formatShortNumber(homeData?.current_month_orders_dsr?.quantity) || 0}
                                </AppText>
                            </View>
                            <View style={styles.percentageRight}>
                                <AppText size={14} family="InterSemiBold" color="#106e56">
                                    {Math.round(finalQtyPercent)}%
                                </AppText>
                                <AppText size={14} color="#6b7280" family="InterMedium">
                                    of {formatShortNumber(quantityTarget)}
                                </AppText>
                            </View>
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${finalQtyPercent}%` }]} />
                        </View>
                    </View>

                    {/* Value Progress */}
                    <View>
                        <View style={styles.progressHeader}>
                            <View>
                                <AppText size={14} color="#6b7280" family="InterMedium">Value</AppText>
                                <AppText size={19} family="InterSemiBold" color="#1F2937">
                                    ₹{activeMainTab === 'ASR' ? formatShortNumber(homeData?.current_month_orders?.value) : formatShortNumber(homeData?.current_month_orders_dsr?.value) || 0}
                                </AppText>
                            </View>
                            <View style={styles.percentageRight}>
                                <AppText size={14} family="InterSemiBold" color="#106e56">
                                    {Math.round(finalValPercent)}%
                                </AppText>
                                <AppText size={14} color="#6b7280" family="InterMedium">
                                    of ₹{formatShortNumber(valueTarget)}
                                </AppText>
                            </View>
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${finalValPercent}%` }]} />
                        </View>
                    </View>
                </View>

                <View style={{
                    borderWidth: 1,
                    borderColor: '#e5e7eb'
                }} />
                <View style={styles.bottomSummary}>
                    <View style={[styles.summaryColumn, {
                        borderRightWidth: 2,
                        borderRightColor: '#e5e7eb'
                    }]}>
                        <AppText size={12} color="#6b7280" family="InterMedium">
                            TODAY
                        </AppText>
                        <View style={styles.summaryValues}>
                            <View>
                                <AppText size={12} color="#6b7280" family="InterMedium">Qty</AppText>
                                <AppText size={16} family="InterSemiBold" color='black'>{activeMainTab === 'ASR' ? formatShortNumber(homeData?.today_orders?.quantity) : formatShortNumber(homeData?.today_orders_dsr?.quantity) || 0}</AppText>
                            </View>
                            <View>
                                <AppText size={12} color="#6b7280" family="InterMedium">Val</AppText>
                                <AppText size={16} family="InterSemiBold" color='black'>₹{activeMainTab === 'ASR' ? formatShortNumber(homeData?.today_orders?.value) : formatShortNumber(homeData?.today_orders_dsr?.value) || 0}</AppText>
                            </View>
                        </View>
                    </View>

                    <View style={[styles.summaryColumn]}>
                        <AppText size={12} color="#6b7280" family="InterMedium">
                            MTD
                        </AppText>
                        <View style={styles.summaryValues}>
                            <View>
                                <AppText size={12} color="#6b7280" family="InterMedium">Qty</AppText>
                                <AppText size={16} family="InterSemiBold" color='black'>{activeMainTab === 'ASR' ? formatShortNumber(homeData?.current_month_orders?.quantity) : formatShortNumber(homeData?.current_month_orders_dsr?.quantity) || 0}</AppText>
                            </View>
                            <View>
                                <AppText size={12} color="#6b7280" family="InterMedium">Val</AppText>
                                <AppText size={16} family="InterSemiBold" color='black'>₹{activeMainTab === 'ASR' ? formatShortNumber(homeData?.current_month_orders?.value) : formatShortNumber(homeData?.current_month_orders_dsr?.value) || 0}</AppText>
                            </View>
                        </View>
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
        paddingTop: rw(18),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 4,
    },
    asrHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: rw(18),
        paddingHorizontal: rw(18),
    },
    asrBadge: {
        backgroundColor: '#3a4da0',
        width: rw(45),
        height: rw(45),
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: rw(10),
    },
    asrInfo: {
        flex: 1,
    },
    retailersContainer: {
        alignItems: 'flex-end',
    },
    progressSection: {
        gap: rw(26),
        marginTop: 10,
        marginBottom: rw(18),
        paddingHorizontal: rw(18),
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: rw(4),
    },
    percentageRight: {
        alignItems: 'flex-end',
    },
    progressBarBg: {
        height: rw(5),
        backgroundColor: '#e8eaf2',
        borderRadius: 999,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#3a4da0',   // Deep blue like screenshot
        borderRadius: 999,
    },
    bottomSummary: {
        flexDirection: 'row',
        // backgroundColor:colors.bgColor,
        // borderRadius:16

    },
    summaryColumn: {
        flex: 1,
        paddingVertical: rw(10),
        paddingHorizontal: rw(18),

    },
    summaryValues: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: rw(4),
    },
    topTabs: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f8',
        borderRadius: 30,
        padding: 6,
        marginBottom: rw(12),
        marginHorizontal: 16
    },

    tab: {
        flex: 1,
        paddingVertical: rw(6),
        alignItems: 'center',
        borderRadius: 26,
    },
    activeTab: {
        backgroundColor: '#3a4da0',
    },
    subTabs: {
        flexDirection: 'row',
        gap: rw(8),
        marginBottom: rw(12),
    },
    inactiveTab: {
        flex: 1,
        paddingVertical: rw(6),
        alignItems: 'center',
    },
});

export default TargetAchievementCard;