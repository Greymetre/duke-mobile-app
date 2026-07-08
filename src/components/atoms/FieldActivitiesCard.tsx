import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Image, Pressable } from 'react-native';
import AppText from '../AppText/AppText';
import { rw } from '../../utils/responsive';
import { colors } from '../../utils/Colors';

const FieldActivitiesCard = ({ data }: any) => {
  const [activeMainTab, setActiveMainTab] = useState<'ASR' | 'DSR'>('ASR');
  const [activeSubTab, setActiveSubTab] = useState<'today' | 'week' | 'month' | 'year'>('today');
let grandtotal = activeMainTab === 'ASR' ? (data?.working_type_asr_today?.retailer_visit || 0) + (data?.working_type_asr_today?.retailer_meet || 0) + (data?.working_type_asr_today?.nukkad_meet || 0) + (data?.working_type_asr_today?.field_demo || 0) + (data?.working_type_asr_today?.other || 0): (data?.working_type_dsr_today?.retailer_visit || 0) + (data?.working_type_dsr_today?.retailer_meet || 0) + (data?.working_type_dsr_today?.nukkad_meet || 0) + (data?.working_type_dsr_today?.field_demo || 0) + (data?.working_type_dsr_today?.other || 0);

  // Mock data with image paths instead of emojis
  const getActivitiesData = () => {
    
    if (activeMainTab === 'ASR') {
      if (activeSubTab === 'today') {
        let total = (data?.working_type_asr_today?.retailer_visit || 0) + (data?.working_type_asr_today?.retailer_meet || 0)+ (data?.working_type_asr_today?.nukkad_meet || 0) + (data?.working_type_asr_today?.field_demo || 0) + (data?.working_type_asr_today?.other || 0);
        return [
          // {
          //   id: '1',
          //   image: require('../../assets/images/Dummy/person.png'),
          //   label: 'Retailer Visit',
          //   value: data?.working_type_asr_today?.retailer_visit || 0,
          //   progress: total ? `${Math.round((data?.working_type_asr_today?.retailer_visit || 0) / total * 100)}%` : '0%',
          //   color: '#e8eaf2',
          // },
          {
            id: '5',
            image: require('../../assets/images/Dummy/DoublePerson.png'),
            label: 'Retailer Meet',
            value: data?.working_type_asr_today?.retailer_meet || 0,
            progress: total ? `${Math.round((data?.working_type_asr_today?.retailer_meet || 0) / total * 100)}%` : '0%',
            color: '#eff2e8',
          },
          {
            id: '2',
            image: require('../../assets/images/Dummy/location.png'),
            label: 'Nukkad Meet',
            value: data?.working_type_asr_today?.nukkad_meet || 0,
            progress: total ? `${Math.round((data?.working_type_asr_today?.nukkad_meet || 0) / total * 100)}%` : '0%',
            color: '#e1f5ee',
          },
          {
            id: '3',
            image: require('../../assets/images/Dummy/wrench.png'),
            label: 'Field Demo',
            value: data?.working_type_asr_today?.field_demo || 0,
            progress: total ? `${Math.round((data?.working_type_asr_today?.field_demo || 0) / total * 100)}%` : '0%',
            color: '#faeeda',
          },
          {
            id: '4',
            image: require('../../assets/images/Dummy/danger.png'),
            label: 'Other Activities',
            value: (data?.working_type_asr_today?.other || 0) + (data?.working_type_asr_today?.retailer_visit || 0),
            progress: total ? `${Math.round(((data?.working_type_asr_today?.other || 0) + (data?.working_type_asr_today?.retailer_visit || 0)) / total * 100)}%` : '0%',
            color: '#fcebeb',
          }, 
        ];
      } else if (activeSubTab === 'month') {
        let total = (data?.working_type_asr_current_month?.retailer_visit || 0) + (data?.working_type_asr_current_month?.retailer_meet || 0) +(data?.working_type_asr_current_month?.nukkad_meet || 0) + (data?.working_type_asr_current_month?.field_demo || 0) + (data?.working_type_asr_current_month?.other || 0);
        return [
          // {
          //   id: '1', image: require('../../assets/images/Dummy/person.png'), label: 'Retailer Visit', value: data?.working_type_asr_current_month?.retailer_visit || 0, progress: total ? `${Math.round((data?.working_type_asr_current_month?.retailer_visit || 0) / total * 100)}%` : '0%',
          //   color: '#e8eaf2',
          // },
          {
            id: '5', image: require('../../assets/images/Dummy/DoublePerson.png'), label: 'Retailer Meet', value: data?.working_type_asr_current_month?.retailer_meet || 0, progress: total ? `${Math.round((data?.working_type_asr_current_month?.retailer_meet || 0) / total * 100)}%` : '0%',
            color: '#eff2e8',
          },
          {
            id: '2', image: require('../../assets/images/Dummy/location.png'), label: 'Nukkad Meet', value: data?.working_type_asr_current_month?.nukkad_meet || 0, progress: total ? `${Math.round((data?.working_type_asr_current_month?.nukkad_meet || 0) / total * 100)}%` : '0%',
            color: '#e1f5ee',
          },
          {
            id: '3', image: require('../../assets/images/Dummy/wrench.png'), label: 'Field Demo', value: data?.working_type_asr_current_month?.field_demo || 0, progress: total ? `${Math.round((data?.working_type_asr_current_month?.field_demo || 0) / total * 100)}%` : '0%',
            color: '#faeeda',
          },
          {
            id: '4', image: require('../../assets/images/Dummy/danger.png'), label: 'Other Activities', 
            value: (data?.working_type_asr_current_month?.other || 0) + (data?.working_type_asr_current_month?.retailer_visit || 0), 
            progress: total ? `${Math.round(((data?.working_type_asr_current_month?.other || 0) + (data?.working_type_asr_current_month?.retailer_visit || 0)) / total * 100)}%` : '0%',
            color: '#fcebeb',
          },
        ];
      } else {
        let total = (data?.working_type_asr_current_year?.retailer_visit || 0) +(data?.working_type_asr_current_year?.retailer_meet || 0) + (data?.working_type_asr_current_year?.nukkad_meet || 0) + (data?.working_type_asr_current_year?.field_demo || 0) + (data?.working_type_asr_current_year?.other || 0);
        return [
          // {
          //   id: '1', image: require('../../assets/images/Dummy/person.png'), label: 'Retailer Visit', value: data?.working_type_asr_current_year?.retailer_visit || 0, progress: total ? `${Math.round((data?.working_type_asr_current_year?.retailer_visit || 0) / total * 100)}%` : '0%',
          //   color: '#e8eaf2',
          // },
          {
            id: '5', image: require('../../assets/images/Dummy/DoublePerson.png'), label: 'Retailer Meet', value: data?.working_type_asr_current_year?.retailer_meet || 0, progress: total ? `${Math.round((data?.working_type_asr_current_year?.retailer_meet || 0) / total * 100)}%` : '0%',
            color: '#eff2e8',
          },
          {
            id: '2', image: require('../../assets/images/Dummy/location.png'), label: 'Nukkad Meet', value: data?.working_type_asr_current_year?.nukkad_meet || 0, progress: total ? `${Math.round((data?.working_type_asr_current_year?.nukkad_meet || 0) / total * 100)}%` : '0%',
            color: '#e1f5ee',
          },
          {
            id: '3', image: require('../../assets/images/Dummy/wrench.png'), label: 'Field Demo', value: data?.working_type_asr_current_year?.field_demo || 0, progress: total ? `${Math.round((data?.working_type_asr_current_year?.field_demo || 0) / total * 100)}%` : '0%',
            color: '#faeeda',
          },
          {
            id: '4', image: require('../../assets/images/Dummy/danger.png'), label: 'Other Activities', 
            value: (data?.working_type_asr_current_year?.other || 0) + (data?.working_type_asr_current_year?.retailer_visit || 0), 
            progress: total ? `${Math.round(((data?.working_type_asr_current_year?.other || 0) + (data?.working_type_asr_current_year?.retailer_visit || 0)) / total * 100)}%` : '0%',
            color: '#fcebeb',
          },
        ];
      }
    } else {
      // DSR Data
      if (activeSubTab === 'today') {
        let total = (data?.working_type_dsr_today?.retailer_visit || 0) +(data?.working_type_dsr_today?.retailer_meet || 0) + (data?.working_type_dsr_today?.nukkad_meet || 0) + (data?.working_type_dsr_today?.field_demo || 0) + (data?.working_type_dsr_today?.other || 0);
        return [
          // {
          //   id: '1', image: require('../../assets/images/Dummy/person.png'), label: 'Retailer Visit', value: data?.working_type_dsr_today?.retailer_visit || 0, progress: total ? `${Math.round((data?.working_type_dsr_today?.retailer_visit || 0) / total * 100)}%` : '0%',
          //   color: '#e8eaf2',
          // },
          {
            id: '5', image: require('../../assets/images/Dummy/DoublePerson.png'), label: 'Retailer Meet', value: data?.working_type_dsr_today?.retailer_meet || 0, progress: total ? `${Math.round((data?.working_type_dsr_today?.retailer_meet || 0) / total * 100)}%` : '0%',
            color: '#eff2e8',
          },
          {
            id: '2', image: require('../../assets/images/Dummy/location.png'), label: 'Nukkad Meet', value: data?.working_type_dsr_today?.nukkad_meet || 0, progress: total ? `${Math.round((data?.working_type_dsr_today?.nukkad_meet || 0) / total * 100)}%` : '0%',
            color: '#e1f5ee',
          },
          {
            id: '3', image: require('../../assets/images/Dummy/wrench.png'), label: 'Field Demo', value: data?.working_type_dsr_today?.field_demo || 0, progress: total ? `${Math.round((data?.working_type_dsr_today?.field_demo || 0) / total * 100)}%` : '0%',
            color: '#faeeda',
          },
          {
            id: '4', image: require('../../assets/images/Dummy/danger.png'), label: 'Other Activities', value: (data?.working_type_dsr_today?.other || 0 ) + (data?.working_type_dsr_today?.retailer_visit || 0), progress: total ? `${Math.round(((data?.working_type_dsr_today?.other || 0) + (data?.working_type_dsr_today?.retailer_visit || 0)) / total * 100)}%` : '0%',
            color: '#fcebeb',
          },
        ];
      } else if (activeSubTab === 'month') {
        let total = (data?.working_type_dsr_current_month?.retailer_visit || 0) +(data?.working_type_dsr_current_month?.retailer_meet || 0) + (data?.working_type_dsr_current_month?.nukkad_meet || 0) + (data?.working_type_dsr_current_month?.field_demo || 0) + (data?.working_type_dsr_current_month?.other || 0);
        return [
          // {
          //   id: '1', image: require('../../assets/images/Dummy/person.png'), label: 'Retailer Visit', value: data?.working_type_dsr_current_month?.retailer_visit || 0, progress: total ? `${Math.round((data?.working_type_dsr_current_month?.retailer_visit || 0) / total * 100)}%` : '0%',
          //   color: '#e8eaf2',
          // },
          {
            id: '5', image: require('../../assets/images/Dummy/DoublePerson.png'), label: 'Retailer Meet', value: data?.working_type_dsr_current_month?.retailer_meet || 0, progress: total ? `${Math.round((data?.working_type_dsr_current_month?.retailer_meet || 0) / total * 100)}%` : '0%',
            color: '#eff2e8',
          },
          {
            id: '2', image: require('../../assets/images/Dummy/location.png'), label: 'Nukkad Meet', value: data?.working_type_dsr_current_month?.nukkad_meet || 0, progress: total ? `${Math.round((data?.working_type_dsr_current_month?.nukkad_meet || 0) / total * 100)}%` : '0%',
            color: '#e1f5ee',
          },
          { id: '3', image: require('../../assets/images/Dummy/wrench.png'), label: 'Field Demo', value: data?.working_type_dsr_current_month?.field_demo || 0, progress: total ? `${Math.round((data?.working_type_dsr_current_month?.field_demo || 0) / total * 100)}%` : '0%', color: '#faeeda', },
          {
            id: '4', image: require('../../assets/images/Dummy/danger.png'), label: 'Other Activities', value: (data?.working_type_dsr_current_month?.other || 0) + (data?.working_type_dsr_current_month?.retailer_visit || 0), progress: total ? `${Math.round(((data?.working_type_dsr_current_month?.other || 0) + (data?.working_type_dsr_current_month?.retailer_visit || 0)) / total * 100)}%` : '0%',
            color: '#fcebeb',
          },
        ];
      } else {
        let total = (data?.working_type_dsr_current_year?.retailer_visit || 0) + (data?.working_type_dsr_current_year?.retailer_meet || 0) + (data?.working_type_dsr_current_year?.nukkad_meet || 0) + (data?.working_type_dsr_current_year?.field_demo || 0) + (data?.working_type_dsr_current_year?.other || 0);
        return [
          // {
          //   id: '1', image: require('../../assets/images/Dummy/person.png'), label: 'Retailer Visit', value: data?.working_type_dsr_current_year?.retailer_visit || 0, progress: total ? `${Math.round((data?.working_type_dsr_current_year?.retailer_visit || 0) / total * 100)}%` : '0%',
          //   color: '#e8eaf2',
          // },
          {
            id: '5', image: require('../../assets/images/Dummy/DoublePerson.png'), label: 'Retailer Meet', value: data?.working_type_dsr_current_year?.retailer_meet || 0, progress: total ? `${Math.round((data?.working_type_dsr_current_year?.retailer_meet || 0) / total * 100)}%` : '0%',
            color: '#eff2e8',
          },
          {
            id: '2', image: require('../../assets/images/Dummy/location.png'), label: 'Nukkad Meet', value: data?.working_type_dsr_current_year?.nukkad_meet || 0, progress: total ? `${Math.round((data?.working_type_dsr_current_year?.nukkad_meet || 0) / total * 100)}%` : '0%',
            color: '#e1f5ee',
          },
          { id: '3', image: require('../../assets/images/Dummy/wrench.png'), label: 'Field Demo', value: data?.working_type_dsr_current_year?.field_demo || 0, progress: total ? `${Math.round((data?.working_type_dsr_current_year?.field_demo || 0) / total * 100)}%` : '0%', color: '#faeeda', },
          {
            id: '4', image: require('../../assets/images/Dummy/danger.png'), label: 'Other Activities', value: (data?.working_type_dsr_current_year?.other || 0) + (data?.working_type_dsr_current_year?.retailer_visit || 0), progress: total ? `${Math.round(((data?.working_type_dsr_current_year?.other || 0) + (data?.working_type_dsr_current_year?.retailer_visit || 0)) / total * 100)}%` : '0%',
            color: '#fcebeb',
          },
        ];
      }
    }
  };

  const activities = getActivitiesData();

  const todayTotal = activeMainTab === 'ASR'
    ? (activeSubTab === 'today' ? 107 : activeSubTab === 'week' ? 312 : 1133)
    : (activeSubTab === 'today' ? 81 : activeSubTab === 'week' ? 225 : 949);

  const activeReps = activeMainTab === 'ASR' ? '65 active' : '42 active';
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

        {/* Sub Tabs: Today | This week | This month */}
        <View style={styles.subTabs}>
          <Pressable
            style={[styles.subTab, activeSubTab === 'today' && styles.activeSubTab]}
            onPress={() => setActiveSubTab('today')} hitSlop={10}
          >
            <AppText
              size={12}
              family="InterMedium"
              color={activeSubTab === 'today' ? '#1E40AF' : '#64748B'}
            >
              Today
            </AppText>
          </Pressable>

          {/* <Pressable
            style={[styles.subTab, activeSubTab === 'week' && styles.activeSubTab]}
            onPress={() => setActiveSubTab('week')}
          >
            <AppText
              size={13}
              family="InterMedium"
              color={activeSubTab === 'week' ? '#1E40AF' : '#64748B'}
            >
              This week
            </AppText>
          </Pressable> */}

          <Pressable
            style={[styles.subTab, activeSubTab === 'month' && styles.activeSubTab]}
            onPress={() => setActiveSubTab('month')} hitSlop={10}
          >
            <AppText
              size={13}
              family="InterMedium"
              color={activeSubTab === 'month' ? '#1E40AF' : '#64748B'}
            >
              This Month
            </AppText>
          </Pressable>
          <Pressable
            style={[styles.subTab, activeSubTab === 'year' && styles.activeSubTab]}
            onPress={() => setActiveSubTab('year')} hitSlop={10}
          >
            <AppText
              size={13}
              family="InterMedium"
              color={activeSubTab === 'year' ? '#1E40AF' : '#64748B'}
            >
              This Year
            </AppText>
          </Pressable>
        </View>

        {/* Activities List */}
        <View>
          {activities.map((item : any, index) => (
            <View key={item.id} style={[styles.activityRow, index == 3 &&{borderBottomWidth: 0}]}>
              <View style={styles.activityLeft}>
                <View style={[styles.iconContainer, { backgroundColor: item?.color }]}>
                  <Image
                    source={item.image}
                    style={styles.activityImage}
                    resizeMode="contain"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', }}>
                    <AppText size={16} family="InterMedium" color="#000">
                      {item.label}
                    </AppText>
                    <AppText size={17} family="InterSemiBold" color="#1F2937">
                      {item.value}
                    </AppText>
                  </View>
                  {/* Progress Bar */}
                  <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: item?.progress }]} />
                  </View>
                </View>
              </View>


            </View>
          ))}
        </View>

        {/* <View style={styles.footer}>
          <View>
            <AppText size={11} color="#6b7280" family="InterMedium">
              TODAY TOTAL
            </AppText>
            <AppText size={16} family="InterSemiBold" color="#1F2937">
              {grandtotal}
            </AppText>
          </View>
          <View style={{
            borderWidth: 1,
            borderColor: '#e5e7eb'
          }} />
          <View>
            <AppText size={11} color="#6b7280" family="InterMedium">
              ASR REPS
            </AppText>
            <AppText size={16} family='InterMedium' color="#1E40AF">
              {activeMainTab === 'ASR' ? data?.punchout_remaining_asr_today : data?.punchout_remaining_dsr_today} active
            </AppText>
          </View>
        </View> */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: rw(19),
    marginTop: rw(16),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: rw(12),
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: rw(16),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  topTabs: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f8',
    borderRadius: 30,
    padding: 6,
    marginBottom: rw(12),
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
  subTab: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingVertical: rw(5),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  activeSubTab: {
    backgroundColor: '#e8eaf2',
    borderColor: '#3a4da0'
  },

  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: rw(10),
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: rw(12),
  },
  iconContainer: {
    marginBottom: rw(4),
    width: rw(30),
    height: rw(30),
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityImage: {
    width: rw(20),
    height: rw(20),
  },

  progressContainer: {
    height: rw(4),
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 5
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#1E40AF',
    borderRadius: 999,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: rw(8),
    marginTop: rw(8),
  },
});

export default FieldActivitiesCard;