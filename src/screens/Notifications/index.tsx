import React, {useCallback, useState} from 'react';
import {ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, View} from 'react-native';
import {NavigationProp, ParamListBase, useFocusEffect, useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AppText from '../../components/AppText/AppText';
import {colors} from '../../utils/Colors';
import {AppNotification, getNotifications, markNotificationRead} from '../../api/query/NotificationApi';

const formatDate = (value: string) => new Date(value).toLocaleString('en-IN', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

const Notifications = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [readingId, setReadingId] = useState<number | null>(null);

  const load = useCallback(async (requestedPage = 1) => {
    const result = await getNotifications(requestedPage);
    setItems(current => requestedPage === 1 ? result.data : [...current, ...result.data]);
    setPage(result.current_page);
    setLastPage(result.last_page);
  }, []);

  useFocusEffect(useCallback(() => {
    setLoading(true);
    load(1).catch(() => setItems([])).finally(() => setLoading(false));
  }, [load]));

  const navigateFromNotification = (notification: AppNotification) => {
    if (!notification.model || notification.model_id === null || notification.model_id === undefined) {
      navigation.navigate('BottomTab');
      return;
    }
    const id = notification.model_id;
    switch (notification.model.trim().toLowerCase()) {
      case 'order':
      case 'order_history':
        navigation.navigate('OrderHistoryDetailsScreen', {orderId: id});
        return;
      case 'expense':
      case 'expense_management':
        navigation.navigate('ExpenseDetails', {expense_id: id, mode: 'approval'});
        return;
      case 'attendance':
        navigation.navigate('AttendanceReport', {attendanceId: id});
        return;
      case 'tour':
      case 'tour_plan':
        navigation.navigate('TourPlanPage', {tourId: id});
        return;
      case 'customer':
      case 'distributor':
      case 'secondary_customer':
        navigation.navigate('CustomerList', {customerId: id});
        return;
      default:
        navigation.navigate('BottomTab');
    }
  };

  const handlePress = async (item: AppNotification) => {
    if (readingId !== null) return;
    if (!item.read) {
      setReadingId(item.id);
      try {
        await markNotificationRead(item.id);
        setItems(current => current.map(value => value.id === item.id ? {...value, read: true} : value));
      } catch {
        // Still allow the destination to open if marking read fails.
      } finally {
        setReadingId(null);
      }
    }
    navigateFromNotification(item);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.blue} /></View>;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={items}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={[styles.content, items.length === 0 && styles.emptyContent]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => {
          setRefreshing(true);
          try { await load(1); } finally { setRefreshing(false); }
        }} />}
        onEndReached={async () => {
          if (loadingMore || page >= lastPage) return;
          setLoadingMore(true);
          try { await load(page + 1); } finally { setLoadingMore(false); }
        }}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={<View style={styles.center}><AppText size={17} family="InterSemiBold" color={colors.blue}>No notifications yet</AppText><AppText size={13} color="#707070">New updates will appear here.</AppText></View>}
        ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.blue} style={styles.footer} /> : null}
        renderItem={({item}) => (
          <Pressable onPress={() => handlePress(item)} style={[styles.card, !item.read && styles.unreadCard]}>
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>{!item.read && <View style={styles.unreadDot} />}<AppText size={15} family={item.read ? 'InterMedium' : 'InterBold'} numLines={1} style={styles.title}>{item.type || 'FieldKonnect'}</AppText></View>
              {readingId === item.id && <ActivityIndicator size="small" color={colors.blue} />}
            </View>
            <AppText size={14} color="#4F4F4F" lineHeight={20}>{item.data}</AppText>
            <AppText size={11} color="#8A8A8A" style={styles.date}>{formatDate(item.created_at)}</AppText>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.bgColor},
  content: {padding: 16, gap: 12},
  emptyContent: {flexGrow: 1},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.bgColor},
  card: {padding: 16, borderRadius: 12, backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E7E7E7'},
  unreadCard: {backgroundColor: '#F2F5FF', borderColor: '#C9D3F2'},
  cardHeader: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7},
  titleRow: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  title: {flex: 1},
  unreadDot: {width: 8, height: 8, borderRadius: 4, backgroundColor: colors.blue, marginRight: 8},
  date: {marginTop: 10},
  footer: {paddingVertical: 16},
});

export default Notifications;
