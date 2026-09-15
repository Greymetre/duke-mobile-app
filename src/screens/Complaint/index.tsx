import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Circle, Path} from 'react-native-svg';
import AppText from '../../components/AppText/AppText';
import {useAppSelector} from '../../components/redux/Store';
import {colors} from '../../utils/Colors';
import {getComplaints} from '../../api/query/ComplaintApi';

type ComplaintStatus = 'Open' | 'Pending' | 'Work Done' | 'Complete' | 'Closed' | 'Cancelled' | 'In Review';
type ComplaintFilter = 'All' | 'Open' | 'In Review' | 'Reject' | 'Resolve';

const FILTERS: ComplaintFilter[] = ['All', 'Open', 'In Review', 'Reject', 'Resolve'];

type ComplaintItem = {
  backendId: number;
  id: string;
  date: string;
  customer: string;
  product: string;
  assignee: string;
  status: ComplaintStatus;
};

const statusColors: Record<ComplaintStatus, {text: string; background: string; border: string}> = {
  Open: {text: '#B06B00', background: '#FFF7E7', border: '#E8B75B'},
  Pending: {text: '#B06B00', background: '#FFF7E7', border: '#E8B75B'},
  'Work Done': {text: '#147DA3', background: '#EAF8FE', border: '#59BADA'},
  Complete: {text: '#07866F', background: '#E9F9F4', border: '#43B9A0'},
  Closed: {text: '#526188', background: '#EEF1F7', border: '#AAB4CC'},
  Cancelled: {text: '#B4232C', background: '#FFF0F1', border: '#E68C92'},
  'In Review': {text: '#5B3FD1', background: '#F1EEFE', border: '#A392EC'},
};

// The backend can add statuses at any time; an unknown one must not take the list down.
const fallbackStatusColor = {text: '#526188', background: '#EEF1F7', border: '#AAB4CC'};

const ComplaintIcon = ({color = colors.blue, size = 24}: {color?: string; size?: number}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M5 5.5A2.5 2.5 0 017.5 3h9A2.5 2.5 0 0119 5.5v7a2.5 2.5 0 01-2.5 2.5H11l-4.75 4v-4A2.25 2.25 0 015 12.75V5.5z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
    <Circle cx="9" cy="9" r="1" fill={color} />
    <Circle cx="12" cy="9" r="1" fill={color} />
    <Circle cx="15" cy="9" r="1" fill={color} />
  </Svg>
);

const PersonIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 20 20" fill="none">
    <Circle cx="10" cy="6" r="2.6" stroke="#7885A8" strokeWidth={1.5} />
    <Path d="M4.8 15.5c.5-2.6 2.35-4 5.2-4s4.7 1.4 5.2 4" stroke="#7885A8" strokeWidth={1.5} strokeLinecap="round" />
  </Svg>
);

const BoxIcon = () => (
  <Svg width={15} height={15} viewBox="0 0 20 20" fill="none">
    <Path d="M4 7.2L10 4l6 3.2v6.6L10 17l-6-3.2V7.2zM4.3 7.3L10 10.5l5.7-3.2M10 10.5V17" stroke="#7885A8" strokeWidth={1.35} strokeLinejoin="round" />
  </Svg>
);

const getInitials = (user: any) => {
  const fullName = String(user?.name || '').trim();
  const nameParts = fullName.split(/\s+/).filter(Boolean);
  const firstName = user?.first_name || nameParts[0] || 'U';
  const lastName = user?.last_name || nameParts[nameParts.length - 1] || '';
  return `${String(firstName).charAt(0)}${nameParts.length > 1 || user?.last_name ? String(lastName).charAt(0) : ''}`.toUpperCase();
};

const Complaint = ({navigation}: any) => {
  const [filter, setFilter] = useState<ComplaintFilter>('All');
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const {user} = useAppSelector(state => state.auth);
  const visibleComplaints = useMemo(() => {
    if (filter === 'All') return complaints;
    if (filter === 'In Review') return complaints.filter(item => item.status === 'In Review');
    if (filter === 'Reject') return complaints.filter(item => item.status === 'Cancelled');
    if (filter === 'Resolve') return complaints.filter(item => item.status === 'Complete' || item.status === 'Closed');
    return complaints.filter(item => item.status === 'Open');
  }, [complaints, filter]);
  const loadComplaints = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const response = await getComplaints();
      const list = Array.isArray(response?.data?.data) ? response.data.data : [];
      setComplaints(list.map((item: any) => ({
        backendId: Number(item.id),
        id: String(item.complaint_number || item.id),
        date: item.complaint_date || '',
        customer: item.dealer_name || 'Dealer not available',
        product: item.category || 'Category not available',
        assignee: item.assignee || 'End user not available',
        status: item.status || 'Open',
      })));
    } catch {
      setComplaints([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {loadComplaints();}, [loadComplaints]));

  const renderComplaint = ({item}: {item: ComplaintItem}) => {
    const status = statusColors[item.status] || fallbackStatusColor;
    return (
      <Pressable style={styles.card} onPress={() => navigation.navigate('ComplaintDetail', {complaintId: item.backendId})}>
        <View style={styles.cardTopRow}>
          <View style={styles.cardTitleBlock}>
            <AppText size={16} color="#172451" family="InterBold">{item.id}</AppText>
            <AppText size={12} color="#7885A8" style={styles.date}>{item.date}</AppText>
          </View>
          <View style={[styles.statusBadge, {backgroundColor: status.background, borderColor: status.border}]}>
            <AppText size={10} color={status.text} family="InterBold" transform="uppercase">{item.status}</AppText>
          </View>
        </View>
        <AppText size={14} color="#526188" family="InterMedium" style={styles.customer}>{item.customer}</AppText>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <BoxIcon />
            <AppText size={12} color="#7885A8">{item.product}</AppText>
          </View>
          <View style={styles.metaItem}>
            <PersonIcon />
            <AppText size={12} color="#7885A8">{item.assignee}</AppText>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar backgroundColor={colors.blue} barStyle="light-content" />
      <View style={styles.header}>
        <View>
          <AppText size={24} color={colors.white} family="InterBold">Complaints</AppText>
          <AppText size={13} color="#D5DDF4" style={styles.recordCount}>{complaints.length} records</AppText>
        </View>
        <View style={styles.profileCircle}>
          <AppText size={13} color={colors.white} family="InterBold">{getInitials(user)}</AppText>
        </View>
      </View>

      <View style={styles.content}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterBar} contentContainerStyle={styles.filters}>
          {FILTERS.map(item => {
            const selected = filter === item;
            return (
              <Pressable
                key={item}
                accessibilityRole="button"
                accessibilityState={{selected}}
                style={[styles.filter, selected && styles.activeFilter]}
                onPress={() => setFilter(item)}>
                <AppText size={12} color={selected ? colors.white : colors.blue} family="InterSemiBold">{item}</AppText>
              </Pressable>
            );
          })}
        </ScrollView>
        {loading ? <View style={styles.center}><ActivityIndicator size="large" color={colors.blue} /></View> : <FlatList
          style={styles.listView}
          data={visibleComplaints}
          renderItem={renderComplaint}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, visibleComplaints.length === 0 && styles.emptyList]}
          refreshing={refreshing}
          onRefresh={() => loadComplaints(true)}
          ListEmptyComponent={<View style={styles.empty}><ComplaintIcon size={38} color="#9AA5C0" /><AppText size={15} color="#7885A8" family="InterMedium">No complaints found</AppText></View>}
        />}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create new complaint"
          style={styles.newComplaintButton}
          onPress={() => navigation.navigate('NewComplaint')}>
          <AppText size={22} color={colors.white} family="InterMedium">+</AppText>
          <AppText size={14} color={colors.white} family="InterBold">New Complaint</AppText>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.blue},
  header: {height: 104, paddingHorizontal: 22, paddingTop: 18, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.blue},
  recordCount: {marginTop: 4},
  profileCircle: {width: 45, height: 45, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: '#42BFEA'},
  content: {flex: 1, backgroundColor: '#F2F4FA'},
  filters: {flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingVertical: 16},
  filterBar: {flexGrow: 0},
  filter: {height: 36, paddingHorizontal: 18, borderRadius: 18, borderWidth: 1, borderColor: '#CAD3EA', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white},
  activeFilter: {borderColor: colors.blue, backgroundColor: colors.blue},
  listView: {flex: 1},
  list: {flexGrow: 0, paddingHorizontal: 18, paddingTop: 0, paddingBottom: 205, gap: 12},
  emptyList: {flexGrow: 1, justifyContent: 'center'},
  center: {alignItems: 'center', paddingTop: 24},
  empty: {alignItems: 'center', gap: 12, marginBottom: 90},
  card: {borderRadius: 16, borderWidth: 1, borderColor: '#D7DEEF', padding: 17, backgroundColor: colors.white, shadowColor: '#23356D', shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.06, shadowRadius: 7, elevation: 2},
  cardTopRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start'},
  cardTitleBlock: {flex: 1, paddingRight: 12},
  date: {marginTop: 5},
  statusBadge: {height: 29, paddingHorizontal: 12, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center'},
  customer: {marginTop: 14},
  metaRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 14},
  metaItem: {flexDirection: 'row', alignItems: 'center', gap: 5},
  newComplaintButton: {position: 'absolute', right: 22, bottom: 116, height: 50, borderRadius: 25, paddingHorizontal: 19, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.blue, shadowColor: '#172451', shadowOffset: {width: 0, height: 5}, shadowOpacity: 0.24, shadowRadius: 8, elevation: 7},
});

export {ComplaintIcon};
export default Complaint;
