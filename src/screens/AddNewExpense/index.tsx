import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { styles } from './styles';
import { rw } from '../../utils/responsive';
import AppText from '../../components/AppText/AppText';
import { ArrowDownIcon, CalenderIcon } from '../../assets/svgs/SvgsFile';
import { UploadIcon } from '../../assets/svgs/HomePageSvgs';
import { NavigationProp, ParamListBase, useNavigation } from '@react-navigation/native';

const AddNewExpense = () => {
    const navigation = useNavigation<NavigationProp<ParamListBase>>();

    return (
        <View style={styles.container}>
            <ScrollView style={[styles.container, { paddingHorizontal: rw(18), paddingTop: 20 }]} >
                <View style={styles.sectionContent}>
                    <AppText size={16} color='#000000' family='InterSemiBold'>Select Expense Type</AppText>
                    <View style={[styles.UserBox, styles.row]}>
                        <View style={{ flex: 1, justifyContent: 'center', }}>
                            <AppText size={14} color='#718096' family='InterRegular'>Bus</AppText>
                        </View>
                        <ArrowDownIcon color={'#000000'} />
                    </View>
                    <AppText size={16} color='#000000' family='InterSemiBold'>Select Expense Date</AppText>
                    <View style={[styles.UserBox, styles.row]}>
                        <View style={{ flex: 1, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                            <CalenderIcon color={'#3C3C3C'} />
                            <AppText size={14} color='#718096' family='InterRegular'>DD-MM-YYYY</AppText>
                        </View>
                        <ArrowDownIcon color={'#000000'} />
                    </View>
                    <AppText size={16} color='#000000' family='InterSemiBold'>Rate</AppText>
                    <View style={[styles.UserBox, styles.row]}>
                        <View style={{ flex: 1, justifyContent: 'center', }}>
                            <AppText size={14} color='#718096' family='InterRegular'>Bus</AppText>
                        </View>
                    </View>
                    <AppText size={16} color='#000000' family='InterSemiBold'>Start Km</AppText>
                    <View style={[styles.UserBox, styles.row]}>
                        <View style={{ flex: 1, justifyContent: 'center', }}>
                            <AppText size={14} color='#718096' family='InterRegular'>km</AppText>
                        </View>
                    </View>
                    <AppText size={16} color='#000000' family='InterSemiBold'>Stop Km</AppText>
                    <View style={[styles.UserBox, styles.row]}>
                        <View style={{ flex: 1, justifyContent: 'center', }}>
                            <AppText size={14} color='#718096' family='InterRegular'>km</AppText>
                        </View>
                    </View>
                    <AppText size={16} color='#000000' family='InterSemiBold'>Total Km</AppText>
                    <View style={[styles.UserBox, styles.row]}>
                        <View style={{ flex: 1, justifyContent: 'center', }}>
                            <AppText size={14} color='#718096' family='InterRegular'>km</AppText>
                        </View>
                    </View>
                    <AppText size={16} color='#000000' family='InterSemiBold'>Clain Amount</AppText>
                    <View style={[styles.UserBox, styles.row]}>
                        <View style={{ flex: 1, justifyContent: 'center', }}>
                            <AppText size={14} color='#718096' family='InterRegular'>₹ 0.0</AppText>
                        </View>
                    </View>
                </View>
                <View style={[styles.sectionContent, { flexDirection: 'row', alignItems: 'center', marginTop: 12 }]}>
                    <View style={[styles.uploadBox]}>
                        <UploadIcon width={24} height={24} />
                        <AppText size={13} color={'#64748B'} family="InterMedium" >
                            Upload
                        </AppText>
                    </View>
                    <View style={{ gap: 3 }}>
                        <AppText size={16} color='#000000' family='InterSemiBold' horizontal={6} width={'60%'}>Expense Attachment</AppText>
                        <AppText size={12} color='#C25050' family='InterRegular' horizontal={6} >Should be less then 5 MB</AppText>

                    </View>
                </View>
                <Pressable style={styles.buttonView} onPress={()=>navigation?.navigate("AttendanceScreen")}>
                    <AppText color='white' family='InterBold' size={16}>SUBMIT</AppText>
                </Pressable>
            </ScrollView>
        </View>
    );
}


export default AddNewExpense;
