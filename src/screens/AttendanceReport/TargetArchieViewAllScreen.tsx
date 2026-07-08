
import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  SectionList,
  Pressable,
  Image,
  StatusBar,
  Modal,
  Text,
  TextInput,
  Linking,
} from 'react-native';

import AppText from '../../components/AppText/AppText';
import { colors } from '../../utils/Colors';
import { fonts } from '../../utils/typography';
import { rw } from '../../utils/responsive';
import store from '../../components/redux/Store';
import Toast from 'react-native-toast-message';
import { SafeAreaView } from 'react-native-safe-area-context';

const BORDER = '#cfd3e6';

type Metrics = {
  qty: number;
  lacs?: number;
};

type Retailers = {
  vis: number;
  ord: number;
  percent?: number;
};

type Row = {
  name: string;
  branch: string;
  retailers: number;
  monthTgt: Metrics;
  today: Metrics;
  mtd: Metrics;
  achievement: Metrics;
  todayRetailers: Retailers;
  mtdRetailers: Retailers;
  mtdUnique: Retailers;
};

type Section = {
  title: string;
  data: Row[];
  total: { retailers: number; qty: number };
};

const DATA: Section[] = [
  {
    title: 'North zone',
    data: [
      {
        name: 'GAJENDRA',
        branch: 'Indore',
        retailers: 150,
        monthTgt: { qty: 100, lacs: 10 },
        today: { qty: 10, lacs: 0.5 },
        mtd: { qty: 90, lacs: 90 },
        achievement: { qty: 90, lacs: 90 },
        todayRetailers: { vis: 20, ord: 5 },
        mtdRetailers: { vis: 400, ord: 100, percent: 25 },
        mtdUnique: { vis: 60, ord: 30 },
      },
      {
        name: 'ASIT',
        branch: 'Jabalpur',
        retailers: 120,
        monthTgt: { qty: 90, lacs: 9 },
        today: { qty: 5, lacs: 0.6 },
        mtd: { qty: 80, lacs: 80 },
        achievement: { qty: 89, lacs: 89 },
        todayRetailers: { vis: 15, ord: 7 },
        mtdRetailers: { vis: 300, ord: 140, percent: 47 },
        mtdUnique: { vis: 50, ord: 40 },
      },
      {
        name: 'HARSH',
        branch: 'Raipur',
        retailers: 100,
        monthTgt: { qty: 80, lacs: 8 },
        today: { qty: 5, lacs: 0.7 },
        mtd: { qty: 70, lacs: 70 },
        achievement: { qty: 88, lacs: 88 },
        todayRetailers: { vis: 40, ord: 9 },
        mtdRetailers: { vis: 800, ord: 180, percent: 23 },
        mtdUnique: { vis: 40, ord: 34 },
      },
      {
        name: 'SHUBHAM',
        branch: 'Bhopal',
        retailers: 80,
        monthTgt: { qty: 40, lacs: 6 },
        today: { qty: 7, lacs: 0.6 },
        mtd: { qty: 50, lacs: 50 },
        achievement: { qty: 22, lacs: 99 },
        todayRetailers: { vis: 6, ord: 0 },
        mtdRetailers: { vis: 120, ord: 0, percent: 0 },
        mtdUnique: { vis: 30, ord: 10 },
      },
      {
        name: 'URVASHI',
        branch: 'INDORE',
        retailers: 80,
        monthTgt: { qty: 40, lacs: 6 },
        today: { qty: 7, lacs: 0.6 },
        mtd: { qty: 50, lacs: 50 },
        achievement: { qty: 10, lacs: 10 },
        todayRetailers: { vis: 6, ord: 0 },
        mtdRetailers: { vis: 120, ord: 0, percent: 0 },
        mtdUnique: { vis: 30, ord: 10 },
      },
    ],
    total: { retailers: 550, qty: 310 },
  },
  {
    title: 'South zone',
    data: [
      {
        name: 'PRIYA',
        branch: 'Nagpur',
        retailers: 100,
        monthTgt: { qty: 120, lacs: 14 },
        today: { qty: 12, lacs: 1.2 },
        mtd: { qty: 95, lacs: 95 },
        achievement: { qty: 79, lacs: 81 },
        todayRetailers: { vis: 30, ord: 18 },
        mtdRetailers: { vis: 500, ord: 320, percent: 64 },
        mtdUnique: { vis: 70, ord: 55 },
      },
      {
        name: 'SURESH',
        branch: 'Pune',
        retailers: 150,
        monthTgt: { qty: 95, lacs: 10 },
        today: { qty: 9, lacs: 1.0 },
        mtd: { qty: 60, lacs: 60 },
        achievement: { qty: 63, lacs: 60 },
        todayRetailers: { vis: 18, ord: 10 },
        mtdRetailers: { vis: 280, ord: 160, percent: 57 },
        mtdUnique: { vis: 48, ord: 30 },
      },
      {
        name: 'KAVITA',
        branch: 'Nashik',
        retailers: 130,
        monthTgt: { qty: 60, lacs: 7 },
        today: { qty: 6, lacs: 0.7 },
        mtd: { qty: 55, lacs: 55 },
        achievement: { qty: 92, lacs: 93 },
        todayRetailers: { vis: 25, ord: 16 },
        mtdRetailers: { vis: 200, ord: 140, percent: 70 },
        mtdUnique: { vis: 35, ord: 25 },
      },
    ],
    total: { retailers: 430, qty: 275 },
  },
];



const getShort = (zone: string) =>
  zone.split(' ').map(w => w[0]).join('').toUpperCase();

const TargetArchieViewAllScreen = ({ navigation }: any) => {
  const [tab, setTab] = useState<'ASR' | 'DSR'>('ASR');
  const [activeFilter, setActiveFilter] = useState('User');
  const [sections, setSections] = useState([]);
  const [summary, setSummary] = useState<any>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const [activeModal, setActiveModal] = useState<
    'user' | 'branch' | 'zone' | 'type' | null
  >(null);
  const [filters, setFilters] = useState({
    user: null as number | null,
    branch: '' as string,
    zone: '' as string,
  });


  const formatSalesData = (zones: any[]) => {
    return zones.map((z) => ({
      title: z.zone,
      data: z.users.map((u: any) => ({
        name: u.name,
        branch: u.branch,
        reporting: u.reporting,
        registered_retailers: u.registered_retailers,

        monthTgt: { qty: u.targetQty, lacs: u.target },
        today: { qty: u.today_order_qty, lacs: (u.today_order_value / 100000)?.toFixed(2) },
        mtd: { qty: u.month_order_qty, lacs: (u.month_order_value / 100000)?.toFixed(2) },
        achievement: { qty: u.achievement_percent_qty, lacs: (u.achievement_percent / 100000)?.toFixed(0) },

        todayRetailers: {
          vis: u.today_visits,
          ord: u.today_order_count,
          percent: u.today_visits > 0 ? (u.today_order_count / u.today_visits) * 100 : 0,
        },

        mtdRetailers: {
          vis: u.month_visits,
          ord: u.month_order_count,
          percent: u.month_visits > 0 ? (u.month_order_count / u.month_visits) * 100 : 0,
        },

        mtdUnique: {
          vis: u.month_unique_retailer_visits,
          ord: u.unique_retailers_month,
          percent:
            u.month_unique_retailer_visits > 0
              ? (u.unique_retailers_month / u.month_unique_retailer_visits) * 100
              : 0,
        },
      })),
    }));
  };

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

  const getModalData = () => {
    switch (activeModal) {
      case 'user':
        return filterData.users;
      case 'branch':
        return filterData.branches;
      case 'zone':
        return filterData.zones;
      default:
        return [];
    }
  };

  const getLabel = (item: any) => {
    if (activeModal === 'user') return item?.name || '';
    return getFilterName(item);
  };

  const getValue = (item: any) => {
    if (activeModal === 'user') return item?.id;
    return getFilterName(item);
  };

  const checkSelected = (value: any) => {
    if (activeModal === 'user') return filters.user === value;
    if (activeModal === 'branch') return filters.branch === value;
    if (activeModal === 'zone') return filters.zone === value;
    return false;
  };
  useEffect(() => {
    fetchAttendanceWithFilters(filters, tab);
  }, [filters]);

  const handleSelect = (value: any) => {
    let updatedFilters = { ...filters };

    if (activeModal === 'user') updatedFilters.user = value;
    if (activeModal === 'branch') updatedFilters.branch = value;
    if (activeModal === 'zone') updatedFilters.zone = value;

    setFilters(updatedFilters);
    setActiveModal(null);

    // 🔥 Call API after selection
    setTimeout(() => {
      fetchAttendanceWithFilters(updatedFilters);
    }, 0);
  };

  const getPercentColor = (value?: number) => {
    // if (!value || value === 0) return '#b43a00';   // red
    // if (value > 0 && value < 70) return '#c47b00'; // orange
    return '#2b7b2a'; // green
  };


  const fetchAttendanceWithFilters = async (customFilters: any, tab?: any) => {
    const token = store.getState()?.auth?.token;
    try {
      let url = 'http://localhost:8000/api/sales/sales-summary?designation=' + (tab || 'asr');

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

      console.log(json.data.zones, 'json.data.zonesjson.data.zones')
      if (json.success) {
        setSections(formatSalesData(json.data.zones));
        setSummary(json.data.summary);
      }
    } catch (err) {
      console.log(err, 'resssssssssssssssssssssss');
    }
  };


  const calculateSectionTotals = (data: any[]) => {
    const totals = {
      retailers: 0,
      monthTgt: { qty: 0, lacs: 0 },
      today: { qty: 0, lacs: 0 },
      mtd: { qty: 0, lacs: 0 },
      achievement: { qty: 0, lacs: 0 },
      todayRetailers: { vis: 0, ord: 0, percent: 0 },
      mtdRetailers: { vis: 0, ord: 0, percent: 0 },
      mtdUnique: { vis: 0, ord: 0, percent: 0 },
    };

    data.forEach((item) => {
      totals.retailers += item.registered_retailers;

      totals.monthTgt.qty += item.monthTgt.qty;
      totals.monthTgt.lacs += Number(item.monthTgt.lacs || 0);

      totals.today.qty += item.today.qty;
      totals.today.lacs += Number(item.today.lacs || 0);

      totals.mtd.qty += item.mtd.qty;
      totals.mtd.lacs += Number(item.mtd.lacs || 0);

      totals.todayRetailers.vis += item.todayRetailers.vis;
      totals.todayRetailers.ord += item.todayRetailers.ord;

      // totals.achievement.qty += item.achievement.qty;
      // totals.achievement.lacs += Number(item.achievement.lacs || 0);

      totals.mtdRetailers.vis += item.mtdRetailers.vis;
      totals.mtdRetailers.ord += item.mtdRetailers.ord;

      totals.mtdUnique.vis += item.mtdUnique.vis;
      totals.mtdUnique.ord += item.mtdUnique.ord;
    });

    return totals;
  };

  const calculateGrandTotals = (sections: any[]) => {
    return calculateSectionTotals(
      sections.flatMap((s) => s.data)
    );
  };

  const grandTotals = calculateGrandTotals(sections);

  const today = new Date();

  // Date format
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const formattedDate = `${days[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;

  // Day calculation
  const currentDay = today.getDate();
  const totalDays = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const dayText = `Day ${currentDay}/${totalDays}`;

  const filteredModalData: any = getModalData().filter((item: any) => {
    const label = getLabel(item)?.toString().toLowerCase();
    return label.includes(search.toLowerCase());
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
        <AppText size={14} color="#cdd1ed" family={'InterMedium'}>
          Target VS Achievement
        </AppText>

        <AppText size={26} color={colors.white} family={'InterBold'}>
          Sales performance
        </AppText>

        <AppText size={14} color="#cdd1ed" family={'InterMedium'}>
          {formattedDate} · {dayText}
        </AppText>
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
                }
                setFilters(filterData);
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

      {/* TABS */}

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



      </View>
      {/* FILTERS */}
      <View style={styles.filters}>
        {['Zone', 'Branch', 'User'].map((f, i) => (
          <Pressable
            key={i}
            onPress={() => {
              setSearch('')
              setFilterModalVisible(true)
              setActiveModal(f.toLowerCase() as any)
              setActiveFilter(f)
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



      {/* TABLE */}
      <ScrollView horizontal>
        <View style={styles.tableWrapper}>

          {/* HEADER ROW */}
          <View style={styles.headerRow}>
            <AppText style={[styles.th, { textAlign: 'left', width: 170, }]}>Name</AppText>
            <AppText style={[styles.th, { textAlign: 'left', width: 170, }]}>Reporting Head</AppText>
            <AppText style={styles.th}>Branch</AppText>
            <AppText style={[styles.th, { width: 140 }]}>Retailers{'\n'}(Reg & App.)</AppText>
            <AppText style={[styles.thGroup, { width: 120 }]}>Mnth Tgt</AppText>
            <AppText style={[styles.thGroup, { width: 120 }]}>Today</AppText>
            <AppText style={[styles.thGroup, { width: 120 }]}>MTD</AppText>
            <AppText style={[styles.thGroup, { width: 120 }]}>%Act</AppText>
            <AppText style={[styles.thGroup, { width: 180 }]}>Today Retailers</AppText>
            <AppText style={[styles.thGroup, { width: 180 }]}>MTD Retailers</AppText>
            <AppText style={[styles.thGroup, { width: 180 }]}>MTD Unique</AppText>
          </View>

          {/* SUB HEADER */}
          <View style={styles.subHeaderRow}>
            {Array(4).fill('').map((_, i) => <AppText key={i} style={[styles.subTh, {
              width: (i === 0 || i == 1) ? 170 : i === 3 ? 140 : 120,
            }]} />)}


            {/* Mnth Tgt */}
            <AppText style={styles.subTh}>Qty</AppText>
            <AppText style={styles.subTh}>Lacs</AppText>

            {/* Today */}
            <AppText style={styles.subTh}>Qty</AppText>
            <AppText style={styles.subTh}>Lacs</AppText>

            {/* MTD */}
            <AppText style={styles.subTh}>Qty</AppText>
            <AppText style={styles.subTh}>Lacs</AppText>

            {/* %Act */}
            <AppText style={styles.subTh}>Qty</AppText>
            <AppText style={styles.subTh}>Lacs</AppText>

            {/* Today Retailers */}
            <AppText style={styles.subTh}>Vis</AppText>
            <AppText style={styles.subTh}>Ord</AppText>
            <AppText style={styles.subTh}>%</AppText>

            {/* MTD Retailers */}
            <AppText style={styles.subTh}>Vis</AppText>
            <AppText style={styles.subTh}>Ord</AppText>
            <AppText style={styles.subTh}>%</AppText>

            {/* MTD Unique */}
            <AppText style={styles.subTh}>Vis</AppText>
            <AppText style={styles.subTh}>Ord</AppText>
            <AppText style={styles.subTh}>%</AppText>
          </View>

          <SectionList
            sections={sections}
            keyExtractor={(_, i) => i.toString()}
            renderItem={({ item, index }) => (
              <View style={[styles.row, {
                backgroundColor: index % 2 === 0 ? '#fff' : '#f5f5f5',
              }]}>

                {/* NAME */}
                <AppText style={styles.cellBold}>{item?.name || '-'}</AppText>
                <AppText onPress={()=>{
                      if (!item?.reporting?.mobile || item?.reporting?.mobile.length < 10) {
                        Toast.show({
                          type: 'error',
                          text1: 'Invalid Number',
                          text2: 'Please check the phone number.',
                        });
                        return;
                      }
                      const url = `tel:${item?.reporting?.mobile}`;
                      Linking.openURL(url).catch(() =>{
                        Toast.show({
                          type: 'error',
                          text1: 'Error',
                          text2: 'Unable to open dialer.',
                        });
                      });
                    }}
                   style={[styles.cellBold, {color:'blue'}]} underline='underline'>{item?.reporting?.name || '-'}</AppText>

                {/* BRANCH */}
                <AppText style={styles.cell}>{item?.branch || '-'}</AppText>

                {/* RETAILERS */}
                <AppText style={[styles.cell, { width: 140 }]}>
                  {item?.registered_retailers || 0}
                </AppText>

                {/* MONTH TARGET */}
                <AppText style={[styles.cell, { width: 60, borderColor: index % 2 === 0 ? '#fff' : '#f5f5f5' }]}>
                  {item?.monthTgt?.qty || 0}
                </AppText>
                <AppText style={[styles.cell, { width: 60 }]}>
                  {item?.monthTgt?.lacs || 0}
                </AppText>

                {/* TODAY */}
                <AppText style={[styles.cell, { width: 60, borderColor: index % 2 === 0 ? '#fff' : '#f5f5f5' }]}>
                  {item?.today?.qty || 0}
                </AppText>
                <AppText style={[styles.cell, { width: 60 }]}>
                  {item?.today?.lacs || 0}
                </AppText>

                {/* MTD */}
                <AppText style={[styles.cell, { width: 60, borderColor: index % 2 === 0 ? '#fff' : '#f5f5f5' }]}>
                  {item?.mtd?.qty || 0}
                </AppText>
                <AppText style={[styles.cell, { width: 60 }]}>
                  {item?.mtd?.lacs || 0}
                </AppText>

                {/* ACHIEVEMENT */}
                <AppText style={[styles.cell, { width: 60, color: getPercentColor(item?.achievement?.qty), borderColor: index % 2 === 0 ? '#fff' : '#f5f5f5' }]}>
                  {item?.achievement?.qty || 0}%
                </AppText>
                <AppText style={[styles.cell, { width: 60, color: getPercentColor(item?.achievement?.lacs) }]}>
                  {item?.achievement?.lacs || 0}%
                </AppText>

                {/* TODAY RETAILERS */}
                <AppText style={[styles.cell, { width: 60, borderColor: index % 2 === 0 ? '#fff' : '#f5f5f5' }]}>
                  {item?.todayRetailers?.vis || 0}
                </AppText>
                <AppText style={[styles.cell, { width: 60, borderColor: index % 2 === 0 ? '#fff' : '#f5f5f5' }]}>
                  {item?.todayRetailers?.ord || 0}
                </AppText>
                <AppText style={[styles.cell, { width: 60 }]}>
                  {item?.todayRetailers?.percent?.toFixed(0) || 0}%
                </AppText>

                {/* MTD RETAILERS */}
                <AppText style={[styles.cell, { width: 60, borderColor: index % 2 === 0 ? '#fff' : '#f5f5f5' }]}>
                  {item?.mtdRetailers?.vis || 0}
                </AppText>
                <AppText style={[styles.cell, { width: 60, borderColor: index % 2 === 0 ? '#fff' : '#f5f5f5' }]}>
                  {item?.mtdRetailers?.ord || 0}
                </AppText>
                <AppText style={[styles.cell, { width: 60 }]}>
                  {item?.mtdRetailers?.percent?.toFixed(0) || 0}%
                </AppText>

                {/* MTD UNIQUE */}
                <AppText style={[styles.cell, { width: 60, borderColor: index % 2 === 0 ? '#fff' : '#f5f5f5' }]}>
                  {item?.mtdUnique?.vis || 0}
                </AppText>
                <AppText style={[styles.cell, { width: 60, borderColor: index % 2 === 0 ? '#fff' : '#f5f5f5' }]}>
                  {item?.mtdUnique?.ord || 0}
                </AppText>
                <AppText style={[styles.cell, { width: 60 }]}>
                  {item?.mtdUnique?.percent?.toFixed(0) || 0}%
                </AppText>

              </View>
            )}

            renderSectionHeader={({ section }: { section: any }) => (
              <AppText
                style={[
                  styles.zone,
                ]}
              >
                Zone - {section?.title}
              </AppText>
            )}

            renderSectionFooter={({ section }) => {

              const sectionIndex = DATA.indexOf(section);

              return (
                <View style={[styles.totalRow, {
                  backgroundColor:
                    sectionIndex % 2 === 0 ? '#e8eaf7' : '#e6f4ea',
                }]}>
                  <AppText style={[styles.totalText, {
                    color: sectionIndex % 2 === 0 ? '#4849ad' : '#196c2a'
                  }]}>{getShort(section.title)} total</AppText>
                  <AppText style={[styles.totalText, {
                    color: sectionIndex % 2 === 0 ? '#4849ad' : '#196c2a'
                  }]}></AppText>
                  <AppText style={[styles.totalText, {
                    color: sectionIndex % 2 === 0 ? '#4849ad' : '#196c2a'
                  }]}>{section.total.retailers}</AppText>
                  <AppText style={[styles.totalText, {
                    color: sectionIndex % 2 === 0 ? '#4849ad' : '#196c2a'
                  }]}>{section.total.qty}</AppText>
                </View>
              )
            }}


            renderSectionFooter={({ section }) => {
              const totals = calculateSectionTotals(section.data);

              return (
                <View style={[styles.totalRow, {
                }]}>

                  <AppText style={[styles.totalText, { width: 170, textAlign: 'left' }]}>
                    {getShort(section.title)} total
                  </AppText>

                  <AppText style={[styles.totalText, { width: 170, }]}></AppText>
                  <AppText style={styles.totalText}></AppText>

                  <AppText style={[styles.totalText, { width: 140 }]}>
                    {totals.retailers}
                  </AppText>

                  {/* Month Target */}
                  <AppText style={[styles.totalText, { width: 60 }]}>{totals.monthTgt.qty}</AppText>
                  <AppText style={[styles.totalText, { width: 60 }]}>{totals.monthTgt.lacs}</AppText>

                  {/* Today */}
                  <AppText style={[styles.totalText, { width: 60 }]}>{totals.today.qty}</AppText>
                  <AppText style={[styles.totalText, { width: 60 }]}>{totals.today.lacs.toFixed(2)}</AppText>

                  {/* MTD */}
                  <AppText style={[styles.totalText, { width: 60 }]}>{totals.mtd.qty}</AppText>
                  <AppText style={[styles.totalText, { width: 60 }]}>{totals.mtd.lacs.toFixed(2)}</AppText>

                  {/* Achievement */}
                  <AppText style={[styles.totalText, { width: 60 }]}>{totals.achievement.qty}%</AppText>
                  <AppText style={[styles.totalText, { width: 60 }]}>{totals.achievement.lacs}%</AppText>

                  {/* Today Retailers */}
                  <AppText style={[styles.totalText, { width: 60 }]}>{totals.todayRetailers.vis}</AppText>
                  <AppText style={[styles.totalText, { width: 60 }]}>{totals.todayRetailers.ord}</AppText>
                  <AppText style={[styles.totalText, { width: 60 }]}>-</AppText>

                  {/* MTD Retailers */}
                  <AppText style={[styles.totalText, { width: 60 }]}>{totals.mtdRetailers.vis}</AppText>
                  <AppText style={[styles.totalText, { width: 60 }]}>{totals.mtdRetailers.ord}</AppText>
                  <AppText style={[styles.totalText, { width: 60 }]}>-</AppText>

                  {/* Unique */}
                  <AppText style={[styles.totalText, { width: 60 }]}>{totals.mtdUnique.vis}</AppText>
                  <AppText style={[styles.totalText, { width: 60 }]}>{totals.mtdUnique.ord}</AppText>
                  <AppText style={[styles.totalText, { width: 60 }]}>-</AppText>

                </View>
              );
            }}

            ListFooterComponent={() => (
              <View style={styles.grandTotal}>
                <AppText style={[styles.grandText, { width: 170, textAlign: 'left' }]}>
                  Grand Total
                </AppText>
                <AppText style={[styles.grandText, { width: 170, }]}></AppText>

                <AppText style={styles.grandText}></AppText>

                <AppText style={[styles.grandText, { width: 140 }]}>
                  {grandTotals.retailers}
                </AppText>

                <AppText style={[styles.grandText, { width: 60 }]}>{grandTotals.monthTgt.qty}</AppText>
                <AppText style={[styles.grandText, { width: 60 }]}>{grandTotals.monthTgt.lacs.toFixed(2)}</AppText>

                <AppText style={[styles.grandText, { width: 60 }]}>{grandTotals.today.qty}</AppText>
                <AppText style={[styles.grandText, { width: 60 }]}>{grandTotals.today.lacs.toFixed(2)}</AppText>

                <AppText style={[styles.grandText, { width: 60 }]}>{grandTotals.mtd.qty}</AppText>
                <AppText style={[styles.grandText, { width: 60 }]}>{grandTotals.mtd.lacs.toFixed(2)}</AppText>
                <AppText style={[styles.grandText, { width: 60 }]}></AppText>
                <AppText style={[styles.grandText, { width: 60 }]}></AppText>
                <AppText style={[styles.grandText, { width: 60 }]}>{grandTotals.todayRetailers.vis}</AppText>
                <AppText style={[styles.grandText, { width: 60 }]}>{grandTotals.todayRetailers.ord}</AppText>
                <AppText style={[styles.grandText, { width: 60 }]}></AppText>
                <AppText style={[styles.grandText, { width: 60 }]}>{grandTotals.mtdRetailers.vis}</AppText>
                <AppText style={[styles.grandText, { width: 60 }]}>{grandTotals.mtdRetailers.ord}</AppText>
                <AppText style={[styles.grandText, { width: 60 }]}></AppText>
                <AppText style={[styles.grandText, { width: 60 }]}>{grandTotals.mtdUnique.vis}</AppText>
                <AppText style={[styles.grandText, { width: 60 }]}>{grandTotals.mtdUnique.ord}</AppText>
              </View>
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
            {
              activeModal == 'user' && (
                <View style={{ marginVertical: 10 }}>
                  <TextInput
                    placeholder="Search user..."
                    value={search}
                    onChangeText={setSearch}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 10,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderWidth: 1,
                      borderColor: '#ddd',
                    }}
                  />
                </View>
              )
            }


            <ScrollView showsVerticalScrollIndicator={false}>
              {filteredModalData?.length == 0 && (
                <Text style={{ textAlign: 'center', marginTop: 20 }}>
                  No results found
                </Text>
              )}
              {filteredModalData?.map((item: any, index: number) => {
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
                      { borderBottomColor: isSelected ? '#3b4ab9' : '#eee', }
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

export default TargetArchieViewAllScreen;


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f3f3',
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

  tabs: {
    flexDirection: 'row',
    // margin: 16,
    marginTop: 28,
    backgroundColor: '#e5e6ef',
    borderRadius: 30,
    padding: 4,
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


  tab: {
    flex: 1,
    padding: 8,
    borderRadius: 30,
    alignItems: 'center',
  },

  activeTab: {
    backgroundColor: colors.blue,
  },

  inactiveTab: {},

  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12
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


  tableWrapper: {
    borderWidth: 1,
    borderColor: BORDER,
    margin: 16,
  },

  headerRow: {
    flexDirection: 'row',
    backgroundColor: colors.blue,

  },

  subHeaderRow: {
    flexDirection: 'row',
    backgroundColor: colors.blue,
  },

  th: {
    width: 120,
    color: '#fff',
    padding: 10,
    borderRightWidth: 3,
    borderColor: BORDER,
    fontSize: 14,
    textAlign: 'center',
    fontFamily: fonts.InterBold
  },

  thGroup: {
    width: 180,
    textAlign: 'center',
    color: '#fff',
    padding: 10,
    borderRightWidth: 3,
    borderColor: BORDER,
    borderBottomWidth: 3,
    borderBottomColor: BORDER,
    fontSize: 14,
    fontFamily: fonts.InterBold
  },

  subTh: {
    width: 60,
    textAlign: 'center',
    color: '#fff',
    padding: 6,
    borderRightWidth: 3,
    borderColor: BORDER,
    fontSize: 14,
    fontFamily: fonts.InterBold
  },

  row: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 0.5,
    borderColor: '#ddd',
  },

  cell: {
    width: 120,
    textAlign: 'center',
    padding: 10,
    borderRightWidth: 3,
    borderColor: '#ddd',
    fontSize: 14,
    fontFamily: fonts.InterSemiBold,
    color: '#000'
  },

  cellBold: {
    width: 170,
    padding: 10,
    borderRightWidth: 3,
    borderColor: '#ddd',
    fontSize: 14,
    fontFamily: fonts.InterBold,
    color: '#000'
  },

  green: { color: '#428840' },

  zone: {
    backgroundColor: '#e9eaf6',
    padding: 10,
    color: '#4849ad',
    fontFamily: fonts.InterBold,
    fontSize: 14,
  },

  totalRow: {
    flexDirection: 'row',
    backgroundColor: '#e8eaf7',
  },

  totalText: {
    width: 120,
    padding: 10,
    textAlign: 'center',
    color: colors.blue,
    fontFamily: fonts.InterBold,
    fontSize: 14,
  },

  grandTotal: {
    flexDirection: 'row',
    backgroundColor: colors.blue,
  },

  grandText: {
    width: 120,
    padding: 10,
    textAlign: 'center',
    color: '#fff',
    fontFamily: fonts.InterBold,
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
    minHeight: '80%'
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