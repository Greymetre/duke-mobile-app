import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Dropdown } from 'react-native-element-dropdown';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import axiosClient from '../../api/AxiosClient';
import AppText from '../../components/AppText/AppText';
import { colors } from '../../utils/Colors';

const palette = {
  background: colors.bgColor,
  surface: colors.white,
  surfaceSoft: colors.white,
  border: '#D9DFEC',
  muted: '#718096',
  white: colors.black,
  cyan: colors.blue,
  green: '#14875D',
};

type PACActivity = {
  id: number;
  activity_type_id: number;
  activity_type: string;
  activity_date: string;
  location_name: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  created_by?: { id: number; name: string };
};

type FilterOption = { label: string; value: number };

const mergeFilterOptions = (current: FilterOption[], incoming: FilterOption[]) => {
  const options = new Map(current.map(item => [String(item.value), item]));
  incoming.forEach(item => {
    if (item.value && item.label) options.set(String(item.value), item);
  });
  return Array.from(options.values()).sort((first, second) => first.label.localeCompare(second.label));
};

const FilterDropdown = ({ data, value, placeholder, onChange }: { data: FilterOption[]; value: number | null; placeholder: string; onChange: (value: number) => void }) => (
  <Dropdown
    mode="default"
    data={data}
    labelField="label"
    valueField="value"
    value={value}
    onChange={item => onChange(item.value)}
    placeholder={placeholder}
    search
    searchPlaceholder={`Search ${placeholder.toLowerCase()}`}
    maxHeight={300}
    dropdownPosition="auto"
    style={styles.filter}
    containerStyle={styles.filterMenu}
    placeholderStyle={styles.filterPlaceholder}
    selectedTextStyle={styles.filterSelectedText}
    inputSearchStyle={styles.filterSearch}
    itemTextStyle={styles.filterItemText}
    iconStyle={styles.filterIcon}
    activeColor="#EEF3FF"
  />
);

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6M9 12h10" stroke={colors.black} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PlusIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
    <Path d="M9 4v10M4 9h10" stroke={colors.white} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const ActivityIcon = ({ type }: { type: string }) => (
  <View style={styles.activityIcon}>
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      {type === 'store' ? (
        <>
          <Path d="M5 10v9h14v-9M4 9l2-5h12l2 5" stroke={colors.blue} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M4 9a2 2 0 004 0 2 2 0 004 0 2 2 0 004 0 2 2 0 004 0" stroke={colors.blue} strokeWidth={1.8} />
        </>
      ) : (
        <Path d="M14.5 5.5a4 4 0 01-5 5L4 16l4 4 5.5-5.5a4 4 0 005-5l-2.6 2.6-3-3 2.6-2.6zM5 5l4 4" stroke={colors.blue} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      )}
    </Svg>
  </View>
);

const PAC = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'details' | 'approval'>('details');
  const [period, setPeriod] = useState<'MTD' | 'YTD'>('MTD');
  const [activities, setActivities] = useState<PACActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activityTypeId, setActivityTypeId] = useState<number | null>(null);
  const [activityTypes, setActivityTypes] = useState<FilterOption[]>([]);

  const loadActivities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('api/promotional-activities', {
        params: {
          tab: activeTab,
          period: period.toLowerCase(),
          activity_type_id: activityTypeId || undefined,
        },
      });
      const rows: PACActivity[] = response?.data?.data || [];
      setActivities(rows);
      setActivityTypes(current => mergeFilterOptions(current, rows.map(item => ({ label: item.activity_type, value: item.activity_type_id }))));
    } catch {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, activityTypeId, period]);

  useFocusEffect(useCallback(() => {
    loadActivities();
  }, [loadActivities]));

  const categoryCounts = Object.values(activities.reduce<Record<number, { label: string; count: number }>>((counts, activity) => {
    const current = counts[activity.activity_type_id] || { label: activity.activity_type, count: 0 };
    counts[activity.activity_type_id] = { ...current, count: current.count + 1 };
    return counts;
  }, {}));

  const filteredActivities = activities.filter(activity => {
    if (activityTypeId && String(activity.activity_type_id) !== String(activityTypeId)) return false;
    return true;
  });

  const formatDate = (value: string) => {
    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.navigate('Home')} hitSlop={10}>
          <BackIcon />
        </Pressable>
        <AppText color={palette.white} size={19} family="InterBold">Promotional Activity</AppText>
        <Pressable style={styles.createButton} onPress={() => navigation.navigate('CreatePAC')}>
          <PlusIcon />
          <AppText color={colors.white} size={14} family="InterBold">Create</AppText>
        </Pressable>
      </View>

      <View style={styles.tabs}>
        <Pressable style={styles.tab} onPress={() => setActiveTab('details')}>
          <AppText color={activeTab === 'details' ? palette.white : palette.muted} size={15} family="InterSemiBold">Activity Details</AppText>
          {activeTab === 'details' && <View style={styles.tabIndicator} />}
        </Pressable>
        <Pressable style={styles.tab} onPress={() => setActiveTab('approval')}>
          <AppText color={activeTab === 'approval' ? palette.white : palette.muted} size={15} family="InterSemiBold">Activity Approval</AppText>
          {activeTab === 'approval' && <View style={styles.tabIndicator} />}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 116 + insets.bottom }]}
      >
        <View style={styles.filterPanel}>
          <View style={styles.filterHeadingRow}>
            <AppText color="#5F6F8F" size={12} family="InterBold">FILTER ACTIVITIES</AppText>
            {activityTypeId ? <Pressable onPress={() => setActivityTypeId(null)}><AppText color={colors.blue} size={12} family="InterBold">Reset</AppText></Pressable> : null}
          </View>
          <FilterDropdown data={activityTypes} value={activityTypeId} placeholder="Activity Type" onChange={setActivityTypeId} />
        </View>
        <View style={styles.totalCard}>
          <View>
            <AppText color="#60749D" size={12} family="InterBold" spacing={0.4}>TOTAL ACTIVITY</AppText>
            <AppText color={palette.white} size={30} family="InterBold">{filteredActivities.length}</AppText>
          </View>
          <View style={styles.periodGroup}>
            {(['MTD', 'YTD'] as const).map(item => (
              <Pressable
                key={item}
                onPress={() => setPeriod(item)}
                style={[styles.periodButton, period === item && styles.periodButtonActive]}
              >
                <AppText color={period === item ? colors.white : '#718096'} size={12} family="InterBold">{item}</AppText>
              </Pressable>
            ))}
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {categoryCounts.map(({ label, count }) => (
            <View style={styles.category} key={label}>
              <AppText color="#7E91B8" size={14} family="InterRegular">{label}</AppText>
              <AppText color={palette.white} size={15} family="InterBold">{count}</AppText>
            </View>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator style={styles.loader} size="large" color={colors.blue} />
        ) : filteredActivities.length ? filteredActivities.map(activity => (
          <Pressable key={activity.id} style={styles.activityCard} onPress={() => navigation.navigate('PACDetails', { activityId: activity.id })}>
            <ActivityIcon type={activity.activity_type.toLowerCase().includes('retailer') ? 'store' : 'tools'} />
            <View style={styles.activityCopy}>
              <AppText color={palette.white} size={16} family="InterBold">{activity.activity_type}</AppText>
              <AppText color="#8193B9" size={13} family="InterRegular" lineHeight={19}>
                {formatDate(activity.activity_date)} · {activity.location_name}
              </AppText>
              {activeTab === 'approval' && activity.created_by?.name ? (
                <AppText color="#718096" size={12}>By {activity.created_by.name}</AppText>
              ) : null}
            </View>
            <View style={[styles.statusBadge, activity.approval_status === 'pending' && styles.pendingBadge, activity.approval_status === 'rejected' && styles.rejectedBadge]}>
              <AppText color={activity.approval_status === 'pending' ? '#B36B00' : activity.approval_status === 'rejected' ? '#BE0B0B' : palette.green} size={11} family="InterBold">
                {activity.approval_status === 'pending' ? 'PENDING APPROVAL' : activity.approval_status.toUpperCase()}
              </AppText>
            </View>
          </Pressable>
        )) : (
          <View style={styles.emptyCard}>
            <AppText color={palette.white} size={16} family="InterSemiBold">{activeTab === 'approval' ? 'No team activities' : 'No activities yet'}</AppText>
            <AppText color={palette.muted} size={13} family="InterRegular">Promotional activities will appear here.</AppText>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  header: {
    minHeight: 82,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E5EC',
    backgroundColor: colors.white,
  },
  backButton: { width: 38, height: 38, justifyContent: 'center' },
  createButton: {
    marginLeft: 'auto',
    height: 42,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: palette.cyan,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  tabs: { height: 58, flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E5EC', backgroundColor: colors.white },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabIndicator: { position: 'absolute', bottom: 0, height: 3, width: '88%', backgroundColor: colors.blue },
  content: { paddingTop: 14 },
  filterPanel: { marginHorizontal: 16, marginBottom: 14, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: '#D9DFEC', backgroundColor: colors.white, gap: 11 },
  filterHeadingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filter: { height: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 12, backgroundColor: '#FAFBFD' },
  filterMenu: { marginTop: 6, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E0', backgroundColor: colors.white, overflow: 'hidden', shadowColor: '#16213E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.14, shadowRadius: 12, elevation: 8 },
  filterPlaceholder: { color: '#718096', fontSize: 14 },
  filterSelectedText: { color: '#253858', fontSize: 14, fontFamily: 'Inter-SemiBold' },
  filterSearch: { height: 46, margin: 10, borderRadius: 9, borderColor: '#CBD5E0', color: '#253858', fontSize: 14, paddingHorizontal: 12 },
  filterItemText: { color: '#253858', fontSize: 14 },
  filterIcon: { width: 20, height: 20 },
  totalCard: {
    marginHorizontal: 16,
    marginTop: 0,
    minHeight: 92,
    paddingHorizontal: 17,
    paddingVertical: 15,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    backgroundColor: palette.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  periodGroup: { flexDirection: 'row', gap: 6 },
  periodButton: { height: 32, minWidth: 50, borderRadius: 10, borderWidth: 1, borderColor: palette.border, alignItems: 'center', justifyContent: 'center' },
  periodButtonActive: { backgroundColor: palette.cyan, borderColor: palette.cyan },
  categoryRow: { paddingHorizontal: 16, paddingVertical: 13, gap: 9 },
  category: {
    minWidth: 142,
    height: 48,
    paddingHorizontal: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  activityCard: {
    minHeight: 108,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: { width: 48, height: 48, borderRadius: 13, backgroundColor: '#EEF1FA', alignItems: 'center', justifyContent: 'center' },
  activityCopy: { flex: 1, marginLeft: 14, marginRight: 8, gap: 5 },
  statusBadge: { borderWidth: 1, borderColor: '#A7DEC9', backgroundColor: '#E8F7F1', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 18 },
  pendingBadge: { borderColor: '#E8C17A', backgroundColor: '#FFF5DF' },
  rejectedBadge: { borderColor: '#F3B7B7', backgroundColor: '#FDECEC' },
  emptyCard: { margin: 16, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: palette.border, backgroundColor: palette.surface, alignItems: 'center', gap: 8 },
  loader: { marginTop: 36 },
});

export default PAC;
