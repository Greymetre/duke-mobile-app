import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  StatusBar,
  SectionList,
  Modal,
  ScrollView,
  Linking,
} from 'react-native';
import { rw } from '../../utils/responsive';
import AppText from '../../components/AppText/AppText';
import { colors } from '../../utils/Colors';
import { fonts } from '../../utils/typography';
import store from '../../components/redux/Store';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

type RowType = {
  branch: string;
  employee: string;
  reporting?: {
    name: string;
    mobile: string;
  };
  market?: boolean;
  leave?: boolean;
  mispunch?: boolean;
};

type SectionType = {
  zone: string;
  data: RowType[];
  total: {
    employees: number;
    market: number;
    leave: number;
    mispunch: number;
  };
};

const DATA: SectionType[] = [
  {
    zone: 'North zone',
    data: [
      { branch: 'Lucknow', employee: 'Gajendra Singh', market: true },
      { branch: 'Noida', employee: 'Harsh', leave: true },
      { branch: 'Noida', employee: 'Anil', market: true },
      { branch: 'Noida', employee: 'Asit', mispunch: true },
    ],
    total: { employees: 4, market: 2, leave: 1, mispunch: 1 },
  },
  {
    zone: 'East zone',
    data: [
      { branch: 'Patna', employee: 'Amit', market: true },
      { branch: 'Kolkata', employee: 'Ravi', leave: true },
      { branch: 'Patna', employee: 'Suresh', market: true },
    ],
    total: { employees: 3, market: 2, leave: 1, mispunch: 0 },
  },
  {
    zone: 'West zone',
    data: [
      { branch: 'Mumbai', employee: 'Rahul Verma', market: true },
      { branch: 'Pune', employee: 'Sneha', market: true },
      { branch: 'Mumbai', employee: 'Rohit', leave: true },
    ],
    total: { employees: 3, market: 2, leave: 1, mispunch: 0 },
  },
  {
    zone: 'South zone',
    data: [
      { branch: 'Chennai', employee: 'Arjun', market: true },
      { branch: 'Bangalore', employee: 'Priya', market: true },
      { branch: 'Bangalore', employee: 'Karan', mispunch: true },
    ],
    total: { employees: 3, market: 2, leave: 0, mispunch: 1 },
  },
];

const AttendanceViewAllScreen = ({ navigation }: any) => {
  const [tab, setTab] = useState<'ASR' | 'DSR'>('ASR');
  const [activeFilter, setActiveFilter] = useState('User');
  const [sections, setSections] = useState([]);
  const [summary, setSummary] = useState<any>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeModal, setActiveModal] = useState<
    'user' | 'branch' | 'zone' | 'type' | null
  >(null);
  const [filters, setFilters] = useState({
    user: null as number | null,
    branch: '' as string,
    zone: '' as string,
    type: '' as 'punch_in' | 'not_punch_in' | 'leave' | '',
  });

  const [filterData, setFilterData] = useState({
    users: [],
    branches: [],
    zones: [],
  });

  const getFilterName = (item: any) => {
    if (typeof item === 'string') return item;
    if (typeof item === 'number') return String(item);
    return item?.name || item?.branch || item?.branch_name || item?.zone || item?.zone_name || '';
  };

  const getFilterValue = (item: any) => {
    if (activeModal === 'user') return item?.id;
    return getFilterName(item);
  };

  const normalizeNameList = (items: any[] = []) =>
    items.map(getFilterName).filter(Boolean);

  useEffect(() => {
    fetchFilters();
  }, []);

  const fetchFilters = async () => {
    const token = store.getState()?.auth?.token;
    try {
      const res = await fetch(
        'http://localhost:8000/api/user-attendance-zone-branch',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        }
      );

      const json = await res.json();

      const data = json?.data || {};

      setFilterData({
        users: data.users || [],
        branches: normalizeNameList(data.branches || []),
        zones: normalizeNameList(data.zones || []),
      });
    } catch (e) {
      console.log(e);
    }
  };

  const renderRow = (item: RowType, index: number) => {

    return (
      <View key={index} style={styles.row}>
        <Text ellipsizeMode='tail' style={[styles.cell, { width: 110 }]}>{item.branch}</Text>
        <Text ellipsizeMode='tail' style={[styles.cell, { width: 150 }]}>{item.employee}</Text>
        <Text ellipsizeMode='tail' style={[styles.cell, { width: 150, color: 'blue', textDecorationLine: 'underline' }]}
          onPress={() => {
            if (!item?.reporting?.mobile || item?.reporting?.mobile.length < 10) {
              Toast.show({
                type: 'error',
                text1: 'Invalid Number',
                text2: 'Please check the phone number.',
              });
              return;
            }
            const url = `tel:${item?.reporting?.mobile}`;
            Linking.openURL(url).catch(() => {
              Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Unable to open dialer.',
              });
            });
          }}
        >{item.reporting?.name || 'N/A'}</Text>

        <View style={styles.center}>
          {item.market && (
            <Image source={require('../../assets/images/Dummy/check.png')} style={[styles.icon, { tintColor: '#3b4ab9' }]}
              resizeMode='contain' />
          )}
        </View>

        <View style={styles.center}>
          {item.leave && (
            <Image source={require('../../assets/images/Dummy/check.png')} style={[styles.icon, { tintColor: '#e1a020' }]}
              resizeMode='contain' />
          )}
        </View>

        <View style={styles.center}>
          {item.mispunch && (
            <Image source={require('../../assets/images/Dummy/check.png')} style={[styles.icon, { tintColor: '#e15051' }]}
              resizeMode='contain' />
          )}
        </View>
      </View>
    )
  };

  const filteredData = DATA.map(section => {
    if (activeFilter === 'Zone') {
      return section; // show grouped by zone
    }

    if (activeFilter === 'Branch') {
      return {
        ...section,
        data: [...section.data].sort((a, b) =>
          a.branch.localeCompare(b.branch)
        ),
      };
    }

    if (activeFilter === 'User') {
      return {
        ...section,
        data: [...section.data].sort((a, b) =>
          a.employee.localeCompare(b.employee)
        ),
      };
    }

    return section;
  });


  const getZoneShort = (zone: string) => {
    return zone
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase();
  };

  const toggleSelection = (key: 'users' | 'branches' | 'zones', value: any) => {
    const list: any = filters[key];

    if (list.includes(value)) {
      setFilters({
        ...filters,
        [key]: list.filter((v: any) => v !== value),
      });
    } else {
      setFilters({
        ...filters,
        [key]: [...list, value],
      });
    }
  };

  const resetFilters = () => {
    setFilters({
      users: [],
      branches: [],
      zones: [],
      type: '',
    });
  };

  const applyFilters = () => {
    console.log('APPLIED FILTERS:', filters);

    // 👉 call your attendance API here with params
  };

  const removeFilter = (key: 'users' | 'branches' | 'zones', value: any) => {
    setFilters({
      ...filters,
      [key]: filters[key].filter((v: any) => v !== value),
    });
  };

  const getModalData = () => {
    switch (activeModal) {
      case 'user':
        return filterData.users;
      case 'branch':
        return filterData.branches;
      case 'zone':
        return filterData.zones;
      case 'type':
        return ['punch_in', 'not_punch_in', 'leave'];
      default:
        return [];
    }
  };

  const getLabel = (item: any) => {
    if (activeModal === 'user') return item?.name || '';
    if (activeModal === 'type')
      return item === 'punch_in' ? 'Market' : item === 'not_punch_in' ? 'Mis Punch' : 'Leave';
    return getFilterName(item);
  };

  const getValue = (item: any) => getFilterValue(item);

  const checkSelected = (value: any) => {
    if (activeModal === 'user') return filters.user === value;
    if (activeModal === 'branch') return filters.branch === value;
    if (activeModal === 'zone') return filters.zone === value;
    if (activeModal === 'type') return filters.type === value;

    return false;
  };

  const handleSelect = (value: any) => {
    let updatedFilters = { ...filters };

    if (activeModal === 'user') updatedFilters.user = value;
    if (activeModal === 'branch') updatedFilters.branch = value;
    if (activeModal === 'zone') updatedFilters.zone = value;
    if (activeModal === 'type') updatedFilters.type = value;

    setFilters(updatedFilters);
    setActiveModal(null);

    // 🔥 Call API after selection
    setTimeout(() => {
      fetchAttendanceWithFilters(updatedFilters, tab);
    }, 0);
  };

  const fetchAttendanceWithFilters = async (customFilters: any, tab?: any) => {
    const token = store.getState()?.auth?.token;
    try {
      // let url = 'http://localhost:8000/api/today-attendance-zone?user_id=1';
      let url = 'http://localhost:8000/api/today-attendance-zone?designation=' + (tab || 'asr');

      if (customFilters.branch) {
        url += `&branch=${encodeURIComponent(customFilters.branch)}`;
      }

      if (customFilters.zone) {
        url += `&zone=${encodeURIComponent(customFilters.zone.toLowerCase())}`;
      }

      if (customFilters.user) {
        url += `&user_id=${customFilters.user}`;
      }

      if (customFilters.type) {
        url += `&status=${customFilters.type}`;
      }

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      const json = await res.json();

      if (json.success) {
        setSections(formatData(json.data.zones));
        setSummary(json.data.summary);
      }
    } catch (err) {
      console.log(err);
    }
  };

  // const fetchAttendance = async () => {
  //   const token = store.getState()?.auth?.token;
  //   try {
  //     let url = 'http://localhost:8000/api/today-attendance-zone?designation=asr';

  //     // 👉 Append only if selected
  //     if (filters.branch) {
  //       url += `&branch=${encodeURIComponent(filters.branch)}`;
  //     }

  //     if (filters.zone) {
  //       url += `&zone=${encodeURIComponent(filters.zone.toLowerCase())}`;
  //     }

  //     if (filters.user) {
  //       url += `&user_id=${filters.user}`;
  //     }

  //     if (filters.type) {
  //       url += `&status=${filters.type}`;
  //     }

  //     console.log('API URL:', url);

  //     const res = await fetch(url, {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //         Accept: 'application/json',
  //       },
  //     });

  //     const json = await res.json();

  //     console.log(json, 'ressdfasdfasdfasdf')
  //     if (json.success) {
  //       const formatted = formatData(json.data.zones);
  //       setSections(formatted);
  //       setSummary(json.data.summary);
  //     }
  //   } catch (err) {
  //     console.log(err);
  //   }
  // };

  const formatData = (zones: any[]) => {
    return zones.map((z) => {
      const market = z.users.filter((u: any) => u.punchin && !u.on_leave).length;
      const leave = z.users.filter((u: any) => u.on_leave).length;
      const mispunch = z.users.filter((u: any) => u.not_punchin).length;

      return {
        zone: `${z.zone} zone`,
        data: z.users.map((u: any) => ({
          branch: u.branch,
          employee: u.name,
          reporting: u.reporting,
          market: u.punchin && !u.on_leave,
          leave: u.on_leave,
          mispunch: u.not_punchin,
        })),
        total: {
          employees: z.users.length,
          market,
          leave,
          mispunch,
        },
      };
    });
  };

  useEffect(() => {
    fetchAttendanceWithFilters(filters, tab);
  }, [filters]);


  const today = new Date();

  const formattedDate = today.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  return (
    <View style={styles.container} >
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={"light-content"}
      />
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Image
            source={require('../../assets/images/Dummy/back.png')}
            style={styles.image}
            resizeMode="contain"
          />
        </Pressable>

        <AppText size={12} color="#cdd1ed" family={'InterMedium'}>
          Attendance Report
        </AppText>

        <AppText size={24} family='InterBold' color={colors.white} >
          Today's Overview
        </AppText>

        <AppText size={12} color="#cdd1ed" family={'InterMedium'}>
          {formattedDate}
        </AppText>
      </View>

      {/* TABS */}
      <View style={{ backgroundColor: colors.blue }}>
        <View style={styles.tabs}>
          {['ASR', 'DSR'].map(t => (
            <Pressable
              key={t}
              onPress={() => {
                setTab(t as any)
                const filterData: any = {
                  user: null,
                  branch: '',
                  zone: '',
                  type: '',
                }
                setFilters(filterData);
                // fetchAttendanceWithFilters(filterData, t);
              }}
              style={[
                styles.tab,
                tab === t ? styles.activeTab : styles.inactiveTab,
              ]}
            >
              <AppText
                size={16}
                family={'InterBold'}
                color={tab === t ? colors.white : '#666'}
              >
                {t}
              </AppText>
            </Pressable>
          ))}
        </View>
      </View>

      {/* FILTERS */}
      <View style={styles.selectedFiltersContainer}>

        {/* USER */}
        {filters.user && (
          <Pressable
            onPress={() => setFilters({ ...filters, user: null })}
            style={styles.selectedChip}
          >
            <Text>
              {filterData.users.find((u: any) => u.id === filters.user)?.name} ✕
            </Text>
          </Pressable>
        )}

        {/* BRANCH */}
        {filters.branch ? (
          <Pressable
            onPress={() => setFilters({ ...filters, branch: '' })}
            style={styles.selectedChip}
          >
            <Text>{filters.branch} ✕</Text>
          </Pressable>
        ) : null}

        {/* ZONE */}
        {filters.zone ? (
          <Pressable
            onPress={() => setFilters({ ...filters, zone: '' })}
            style={styles.selectedChip}
          >
            <Text>{filters.zone} ✕</Text>
          </Pressable>
        ) : null}

        {/* TYPE */}
        {filters.type ? (
          <Pressable
            onPress={() => setFilters({ ...filters, type: '' })}
            style={styles.selectedChip}
          >
            <Text>
              {filters.type === 'punch_in' ? 'Market' : filters.type === 'not_punch_in' ? 'Mis Punch' : 'Leave'} ✕
            </Text>
          </Pressable>
        ) : null}

      </View>
      <View style={styles.filters}>
        {['User', 'Branch', 'Zone', 'Type'].map((f, i) => (
          <Pressable
            key={i}
            onPress={() => {
              setFilterModalVisible(true)
              setActiveModal(f.toLowerCase() as any)
            }}
            style={[
              styles.filterBtn,
              activeFilter === f && styles.filterActive,
            ]}
          >
            <AppText
              size={14}
              family="InterMedium"
              color={activeFilter === f ? '#fff' : '#333'}
            >
              {f}
            </AppText>

            <Image
              source={require('../../assets/images/Dummy/downarrow.png')}
              style={styles.downImage}
              tintColor={activeFilter === f ? '#fff' : '#333'}
            />
          </Pressable>
        ))}
      </View>

      {/* TABLE HEADER */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flex: 1 }}>
          <View style={[styles.tableHead, { height: 50 }]}>
            <Text style={[styles.th, { textAlign: 'left', width: 110, }]}>Branch</Text>
            <Text style={[styles.th, { width: 150, textAlign: 'left' }]}>
              Employee
            </Text>
            <Text style={[styles.th, { width: 150, textAlign: 'left' }]}>Reporing Head</Text>
            <Text style={[styles.th, {}]}>Market</Text>
            <Text style={styles.th}>Leave</Text>
            <Text style={styles.th}>Mis Punch</Text>
          </View>

          <SectionList
            sections={sections}
            keyExtractor={(_, index) => index.toString()}
            stickySectionHeadersEnabled={false}
            contentContainerStyle={{ paddingBottom: 20 }}
            renderItem={({ item, index }) => renderRow(item, index)}
            renderSectionHeader={({ section }: any) => {
              console.log(section, 'sectionsectionsectionsection')
              return(
              <>
                {
                  section?.data?.length > 0 && (
                    <AppText style={styles.zone}>
                      {section.zone}
                    </AppText>
                  )
                }
              </>
            )}}
            renderSectionFooter={({ section }: any) => (
              <>
                {
                  section?.data?.length > 0 && (
                    <View style={styles.totalRow}>
                      <AppText style={[styles.totalText, { textAlign: 'left', width: 110 }]}>
                        {getZoneShort(section.zone)} total
                      </AppText>
                      <AppText style={[styles.totalText, { width: 150, textAlign: 'left' }]}>
                        {section.total.employees}
                      </AppText>
                      <AppText style={[styles.totalText, { width: 150, textAlign: 'left' }]}>
                        {section.total.employees}
                      </AppText>
                      <AppText style={styles.totalText}>{section.total.market}</AppText>
                      <AppText style={styles.totalText}>{section.total.leave}</AppText>
                      <AppText style={styles.totalText}>{section.total.mispunch}</AppText>
                    </View>
                  )
                }

              </>
            )}
          />
        </View>
      </ScrollView>
      <Modal visible={!!activeModal} transparent animationType="slide" statusBarTranslucent>
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>

            <View style={modalStyles.headerRow}>
              <Text style={modalStyles.title}>Select {activeModal}</Text>

              <Pressable onPress={() => setActiveModal(null)}>
                <Text style={modalStyles.closeIcon}>✕</Text>
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {getModalData().map((item: any, index: number) => {
                const label = getLabel(item);
                const value = getValue(item);

                const isSelected = checkSelected(value);

                return (
                  <Pressable
                    key={index}
                    onPress={() => handleSelect(value)}
                    style={[
                      modalStyles.row,
                      isSelected && modalStyles.activeRow,
                      { borderBottomColor: isSelected ? '#3b4ab9' : '#eee', borderBottomWidth: 1 }

                    ]}
                  >
                    <Text>{label}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable
              onPress={() => setActiveModal(null)}
              style={modalStyles.applyBtn}
            >
              <Text style={{ color: '#fff' }}>Done</Text>
            </Pressable>

          </View>
        </View>
      </Modal>
      <SafeAreaView edges={['bottom']} />
    </View>
  );
};

export default AttendanceViewAllScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8fb',
  },

  header: {
    backgroundColor: colors.blue,
    padding: 16,
    paddingTop: 40
  },

  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  image: {
    width: rw(18),
    height: rw(18),
  },
  downImage: {
    width: rw(10),
    height: rw(10),
  },
  icon: {
    width: 12,
    height: 12,
  },
  // tabs: {
  //     flexDirection: 'row',
  //     backgroundColor: colors.blue,
  //     paddingHorizontal: 16,
  //     paddingBottom: 16
  // },
  tabs: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#e5e6ef',
    borderRadius: 30,
    padding: 4,
  },

  tab: {
    flex: 1,
    padding: 8,
    borderRadius: 30,
    alignItems: 'center',
  },

  activeTab: {
    backgroundColor: colors.blue,
  },

  inactiveTab: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },

  filters: {
    padding: 10,
    flexDirection: 'row',
  },
  selectedFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    marginVertical: 8,
  },

  selectedChip: {
    backgroundColor: '#e5e6ef',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginRight: 6,
    marginBottom: 6,
  },

  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,

  },

  filterActive: {
    backgroundColor: colors.blue,
  },

  tableHead: {
    flexDirection: 'row',
    backgroundColor: colors.blue,
    paddingVertical: 10,
    paddingHorizontal: 14
  },

  th: {
    color: '#fff',
    width: 90,
    textAlign: 'center',
    fontSize: 12,
    fontFamily: fonts.InterBold
  },

  zone: {
    backgroundColor: '#e8eaf7',
    paddingVertical: 6,
    paddingHorizontal: 14,
    color: colors.blue,
    fontSize: 13,
    fontFamily: fonts.InterBold
  },

  row: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderColor: '#eee',
  },

  cell: {
    width: 90,
    fontSize: 12,
    fontFamily: fonts.InterMedium
  },

  center: {
    width: 90,
    textAlign: 'center',
    alignItems: 'center',
  },



  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#eff0fb',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    borderBottomColor: '#d0d4ee'
  },

  totalText: {
    width: 90,
    textAlign: 'center',
    fontFamily: fonts.InterBold,
    color: colors.blue,
    fontSize: 14,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '80%',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  section: {
    marginTop: 10,
    marginBottom: 5,
    fontWeight: '600',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#eee',
    borderRadius: 20,
    marginRight: 8,
  },
  activeChip: {
    backgroundColor: '#3b4ab9',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  btn: {
    padding: 10,
    borderRadius: 10,
    width: '45%',
    alignItems: 'center',
  },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#fff',
  },

  activeRow: {
    backgroundColor: '#e8eaf7', // light blue (matches your zone bg)
    borderColor: '#3b4ab9',
    borderWidth: 1,
  },

  applyBtn: {
    marginTop: 12,
    backgroundColor: '#3b4ab9', // same as your primary color
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  closeIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});