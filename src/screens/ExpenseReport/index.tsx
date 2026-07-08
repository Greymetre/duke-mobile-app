import { View, Text, ScrollView, FlatList, Pressable, Modal } from 'react-native'
import React, { useCallback, useState } from 'react'
import { styles } from './styles'
import { rw } from '../../utils/responsive'
import AppText from '../../components/AppText/AppText'
import { ArrowDownIcon, CalenderIcon, CrossIcon, EyeballIcon, LOcationIcon, PlusAddIcon, ThreeDotIcon } from '../../assets/svgs/SvgsFile'
import { colors } from '../../utils/Colors'
import { shadowStyle } from '../../utils/typography'

const ExpenseReport = ({navigation}:any) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const listData = [
    { id: 1, name: "Mr. B Varlaxmi" },
    { id: 2, name: "Piyush Patel" },
    { id: 3, name: "Abhishek Soni" },
    { id: 4, name: "Ajay Tomar" },
    { id: 5, name: "Ramniwas Vishnoi" },
    { id: 6, name: "Chan Singh" },
  ]

  const renderItem: any = useCallback((item: any) => {
    console.log(item, 'indexindex')
    const itemD = item?.item
    const index = item?.index
    return (
      <View style={[styles.listItem, shadowStyle]}>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          <View style={{width:'48%'}}>
            <AppText color='black' family='InterSemiBold' size={16}>{itemD?.name}</AppText>
            <AppText color='#888888' family='InterMedium' size={13}>#273252</AppText>
          </View>
           <View style={{width:'48%',alignItems:'flex-end'}}>
            <AppText color='#395299' family='InterBold' size={18}>₹ 250.00</AppText>
            <AppText color='#395299' family='InterSemiBold' size={14}>Bike</AppText>
          </View>

        </View>
        <View style={styles.line} />
        <View style={[styles.row, { flex: 1, justifyContent: 'space-between', gap: 30 }]}>
          <View style={styles.firstPunchIN}>
            <AppText color='#888888' family='InterRegular' size={13}>Date</AppText>
            <AppText color='black' family='InterSemiBold' size={14}>17 Nov 2025</AppText>
          </View>
          <View style={styles.firstPunchIN}>
            <AppText color='#888888' family='InterRegular' size={13}>Attachments</AppText>
            <AppText color='black' family='InterSemiBold' size={14}>NA</AppText>
          </View>
          <View style={styles.firstPunchIN}>
            <AppText color='#888888' family='InterRegular' size={13}>Status</AppText>
            <AppText color='#E78422' family='InterSemiBold' size={14}>Pending</AppText>
          </View>
        </View>
      </View>
    )
  }, [listData])
  return (
    <View style={styles.container}>
      <ScrollView style={[styles.container, { paddingHorizontal: rw(18) }]} >
        <View style={[styles.row, { gap: 13, marginTop: 15 }]}>
          <View style={[styles.UserBox, styles.row]}>
            <View style={{  justifyContent: 'center', }}>
              <AppText size={14} color='#718096' family='InterRegular'>User</AppText>
            </View>
            <ArrowDownIcon />
          </View>
          <View style={[styles.UserBox, styles.row]}>
            <View style={{  justifyContent: 'center', }}>
              <AppText size={14} color='#718096' family='InterRegular'>Status</AppText>
            </View>
            <ArrowDownIcon />
          </View>
        </View>
        <View style={[styles.dateTimeBox, styles.row,{justifyContent:'space-between'}]}>
          <View style={{  justifyContent: 'center', }}>
            <AppText size={14} color='#718096' family='InterRegular'>AUG 2024 - AUG 2025</AppText>
          </View>
          <View style={[styles.calenderICon, styles.center]}>
            <CalenderIcon size={16} color={colors.blue} />
          </View>
        </View>

        <FlatList
          data={listData}
          keyExtractor={(item) => item?.id.toString()}
          renderItem={renderItem}
          style={{ marginTop: 20 }}
          ListFooterComponent={() => (
            <View style={{ height: 120 }} />
          )} />
      </ScrollView>
          <Pressable
                style={styles.fab}
                onPress={() => navigation.navigate("ProductCatalogue")}
            >
                <PlusAddIcon color={'white'} />
            </Pressable>
      <Modal visible={isModalVisible} style={{ flex: 1, }} transparent={true} animationType='fade'>
        <View style={[styles.modalcontainer, styles.center]}>
          <View style={[styles.modalheader, styles.center]}>
            <AppText size={16} color='white' family='InterSemiBold'>Attendance Detail</AppText>
            <Pressable style={{ position: "absolute", right: 15 }} onPress={() => setIsModalVisible(false)}>
              <CrossIcon />
            </Pressable>
          </View>
          <View style={styles.mainOCntainer}>
            <View style={[styles.row, { gap: 21 }]}>
              <View style={styles.firstViewModal}>
                <AppText size={14} family='InterMedium' color='#333333'>User Id</AppText>
                <AppText size={14} family='InterBold' color='black'>41880</AppText>
              </View>
              <View style={[styles.firstViewModal, { flex: 0.45 }]}>
                <AppText size={14} family='InterMedium' color='#333333'>Employe Code</AppText>
                <AppText size={14} family='InterBold' color='black'>G0038</AppText>
              </View>
            </View>
            <View style={[styles.row, { gap: 21, marginTop: 15 }]}>
              <View style={styles.firstViewModal}>
                <AppText size={14} family='InterMedium' color='#333333'>Punch In Date</AppText>
                <AppText size={14} family='InterBold' color='black'>18 NOV 2025</AppText>
              </View>
              <View style={[styles.firstViewModal, { flex: 0.45 }]}>
                <AppText size={14} family='InterMedium' color='#333333'>Punch In Time</AppText>
                <AppText size={14} family='InterBold' color='black'>10:03 AM</AppText>
              </View>
            </View>
            <View style={[styles.row, { gap: 21, marginTop: 15 }]}>
              <View style={styles.firstViewModal}>
                <AppText size={14} family='InterMedium' color='#333333'>Punch Out Time</AppText>
                <AppText size={14} family='InterBold' color='black'>07:30 PM</AppText>
              </View>
              <View style={[styles.firstViewModal, { flex: 0.45 }]}>
                <AppText size={14} family='InterMedium' color='#333333'>Working Time</AppText>
                <AppText size={14} family='InterBold' color='black'>8:00 Hrs</AppText>
              </View>
            </View>
            <View style={[styles.row, { gap: 21, marginTop: 15 }]}>
              <View style={styles.firstViewModal}>
                <AppText size={14} family='InterMedium' color='#333333'>Punch Out Time</AppText>
                <AppText size={14} family='InterBold' color='black'>07:30 PM</AppText>
              </View>
              <View style={[styles.firstViewModal, { flex: 0.45 }]}>
                <AppText size={14} family='InterMedium' color='#333333'>Working Time</AppText>
                <AppText size={14} family='InterBold' color='black'>18:00 Hrs</AppText>
              </View>
            </View>
            <View style={[styles.row, { gap: 21, marginTop: 15 }]}>
              <View style={styles.firstViewModal}>
                <AppText size={14} family='InterMedium' color='#333333'>Working Type</AppText>
                <AppText size={14} family='InterBold' color='black'>Office Meeting</AppText>
              </View>
              <View style={[styles.firstViewModal, { flex: 0.45 }]}>
                <AppText size={14} family='InterMedium' color='#333333'>Punch In Location</AppText>
                <View style={[styles.row, { gap: 5 }]}>
                  <LOcationIcon />
                  <AppText size={14} family='InterMedium' color={colors.blue}>Indore</AppText>
                </View>
              </View>
            </View>
            <View style={[styles.row, { gap: 21, marginTop: 15 }]}>
              <View style={[styles.firstViewModal]}>
                <AppText size={14} family='InterMedium' color='#333333'>Punch Out Location</AppText>
                <View style={[styles.row, { gap: 5 }]}>
                  <LOcationIcon />
                  <AppText size={14} family='InterMedium' color={colors.blue}>Indore</AppText>
                </View>
              </View>
            </View>
            <View style={[styles.row, { gap: 21, marginTop: 15 }]}>
              <View style={[styles.firstViewModal]}>
                <AppText size={14} family='InterMedium' color='#333333'>Punch In Summary</AppText>
                <AppText size={14} family='InterBold' color='black'>Office</AppText>
              </View>
            </View>
            <View style={[styles.row, { gap: 21, marginTop: 15 }]}>
              <View style={[styles.firstViewModal, { flex: 1 }]}>
                <AppText size={14} family='InterMedium' color='#333333'>Punch In Address</AppText>
                <AppText size={14} family='InterBold' color='black'>Vijay Vatika, Indore, MP, India</AppText>
              </View>
            </View>
            <View style={[styles.approveRejectView, styles.row, { gap: 20 }]}>
              <View style={[styles.approveView, styles.row]}>
                <View style={[styles.circle, styles.center]}>
                  <View style={styles.circleInner} />
                </View>
                <AppText size={14} color='#339D4F' family='InterRegular'>Approve</AppText>
              </View>
              <View style={[styles.approveView, styles.row]}>
                <View style={[styles.circle, styles.center, { borderColor: "#FF3333" }]}>
                  <View style={[styles.circleInner, { backgroundColor: "#FF3333" }]} />
                </View>
                <AppText size={14} color='#FF3333' family='InterRegular'>Reject</AppText>
              </View>
            </View>
            <Pressable style={[styles.submit, { height: 44 }, styles.center]} onPress={() => setIsModalVisible(false)}>
              <AppText size={16} color='white' family='InterBold'>Submit</AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  )
}

export default ExpenseReport