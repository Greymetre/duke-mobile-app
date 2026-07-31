import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  StatusBar,
  TextInput,
  View,
} from 'react-native';
import {NavigationProp, ParamListBase, useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Svg, {Circle, Path} from 'react-native-svg';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Toast from 'react-native-toast-message';
import AppText from '../../components/AppText/AppText';
import {AppNotification, getNews, markNotificationRead} from '../../api/query/NotificationApi';
import {colors} from '../../utils/Colors';

type Filter = 'all' | 'unread' | 'media';

const SearchIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Circle cx={11} cy={11} r={7} stroke="#9099B2" strokeWidth={2} />
    <Path d="m16.5 16.5 4 4" stroke="#9099B2" strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

const BackIcon = () => (
  <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
    <Path d="m15 18-6-6 6-6" stroke="#FFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ImagePlaceholder = () => (
  <Svg width={42} height={42} viewBox="0 0 48 48" fill="none">
    <Path d="M8 12a4 4 0 0 1 4-4h24a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V12Z" stroke="#526CA9" strokeWidth={3} />
    <Circle cx={17} cy={17} r={3} fill="#526CA9" />
    <Path d="m10 34 9-9 6 6 4-4 9 9" stroke="#526CA9" strokeWidth={3} strokeLinejoin="round" />
  </Svg>
);

const DownloadIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14" stroke="#395299" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const formatDate = (value: string) => new Date(value).toLocaleDateString('en-IN', {
  day: '2-digit',
  month: 'short',
});

const News = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setQuery(search), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  const load = useCallback(async (requestedPage = 1) => {
    const result = await getNews(requestedPage, 30, {
      read: filter === 'unread' ? false : undefined,
      media: filter === 'media',
      search: query,
    });
    setItems(current => requestedPage === 1 ? result.data : [...current, ...result.data]);
    setPage(result.current_page);
    setLastPage(result.last_page);
  }, [filter, query]);

  const loadUnreadCount = useCallback(async () => {
    const result = await getNews(1, 1, {read: false});
    setUnreadCount(result.total);
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([load(1), loadUnreadCount()]).finally(() => setLoading(false));
  }, [load, loadUnreadCount]);

  const openNews = async (item: AppNotification) => {
    if (item.read) return;
    setItems(current => current.map(value => value.id === item.id ? {...value, read: true} : value));
    setUnreadCount(current => Math.max(0, current - 1));
    try {
      await markNotificationRead(item.id);
    } catch {
      setItems(current => current.map(value => value.id === item.id ? {...value, read: false} : value));
      setUnreadCount(current => current + 1);
    }
  };

  const downloadMedia = async (item: AppNotification) => {
    if (!item.image || downloadingId !== null) return;
    setDownloadingId(item.id);
    try {
      const extensionMatch = item.image.split('?')[0].match(/\.([a-zA-Z0-9]+)$/);
      const extension = extensionMatch?.[1]?.toLowerCase() || 'jpg';
      const safeExtension = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension) ? extension : 'jpg';
      const fileName = `Duke_News_${item.id}_${Date.now()}.${safeExtension}`;
      const destination = Platform.OS === 'android'
        ? `${ReactNativeBlobUtil.fs.dirs.DownloadDir}/${fileName}`
        : `${ReactNativeBlobUtil.fs.dirs.DocumentDir}/${fileName}`;

      await ReactNativeBlobUtil.config({
        fileCache: true,
        path: destination,
        ...(Platform.OS === 'android' ? {
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            title: fileName,
            description: 'Duke news media',
            mime: `image/${safeExtension === 'jpg' ? 'jpeg' : safeExtension}`,
            mediaScannable: true,
            path: destination,
          },
        } : {}),
      }).fetch('GET', item.image);

      if (Platform.OS === 'ios') {
        ReactNativeBlobUtil.ios.previewDocument(destination);
      }
      Toast.show({type: 'success', text1: 'Media downloaded successfully'});
    } catch (error) {
      console.warn('News media download failed:', error);
      Toast.show({type: 'error', text1: 'Unable to download media'});
    } finally {
      setDownloadingId(null);
    }
  };

  const renderNews = ({item}: {item: AppNotification}) => (
    <Pressable style={styles.card} onPress={() => openNews(item)}>
      {!!item.image && (
        <View style={styles.media}>
          <Image source={{uri: item.image}} style={styles.mediaImage} resizeMode="cover" />
          <View style={styles.tag}><AppText size={11} color="#233461" family="InterMedium">News</AppText></View>
          {!item.read && <View style={styles.unreadDot} />}
        </View>
      )}
      {!item.image && (
        <View style={styles.textNewsIcon}>
          <ImagePlaceholder />
        </View>
      )}
      <View style={styles.cardBody}>
        <AppText size={17} color="#172451" family="InterBold" lineHeight={22}>{item.type}</AppText>
        <AppText size={14} color="#647093" lineHeight={20} style={styles.description}>{item.data}</AppText>
        <View style={styles.meta}>
          <AppText size={12} color="#8A94AF">▣ {formatDate(item.created_at)}</AppText>
          {!!item.image && <AppText size={12} color="#8A94AF">▧ Media</AppText>}
          {!!item.image && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Download news media"
              hitSlop={10}
              style={styles.download}
              onPress={event => {
                event.stopPropagation();
                downloadMedia(item);
              }}>
              {downloadingId === item.id
                ? <ActivityIndicator size="small" color={colors.blue} />
                : <DownloadIcon />}
            </Pressable>
          )}
          {!item.read && !item.image && <View style={styles.inlineUnread} />}
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar backgroundColor={colors.blue} barStyle="light-content" />
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to home"
            hitSlop={10}
            style={styles.backButton}
            onPress={() => navigation.navigate('Home')}>
            <BackIcon />
          </Pressable>
          <AppText size={24} color="#FFF" family="InterBold">News</AppText>
        </View>
        <View style={styles.searchBox}>
          <SearchIcon />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search news"
            placeholderTextColor="#98A1BB"
            style={styles.searchInput}
          />
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.filters}>
          {(['all', 'unread', 'media'] as Filter[]).map(value => (
            <Pressable key={value} onPress={() => setFilter(value)} style={[styles.filter, filter === value && styles.activeFilter]}>
              <AppText size={14} family="InterMedium" color={filter === value ? '#FFF' : colors.blue}>
                {value === 'all' ? 'All' : value === 'unread' ? `Unread${unreadCount ? ` ${unreadCount}` : ''}` : '▧ Media'}
              </AppText>
            </Pressable>
          ))}
        </View>
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={colors.blue} /></View>
        ) : (
          <FlatList
            data={items}
            renderItem={renderNews}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={[styles.list, items.length === 0 && styles.emptyList]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => {
              setRefreshing(true);
              try { await Promise.all([load(1), loadUnreadCount()]); } finally { setRefreshing(false); }
            }} />}
            onEndReached={async () => {
              if (loadingMore || page >= lastPage) return;
              setLoadingMore(true);
              try { await load(page + 1); } finally { setLoadingMore(false); }
            }}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={<View style={styles.center}><ImagePlaceholder /><AppText size={16} family="InterSemiBold" color="#526188">No news found</AppText></View>}
            ListFooterComponent={loadingMore ? <ActivityIndicator color={colors.blue} /> : null}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.blue},
  content: {flex: 1, backgroundColor: '#F2F4FA'},
  header: {backgroundColor: colors.blue, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 22, gap: 18},
  headerTitle: {flexDirection: 'row', alignItems: 'center', gap: 8},
  backButton: {width: 34, height: 34, alignItems: 'center', justifyContent: 'center'},
  searchBox: {height: 48, borderRadius: 13, backgroundColor: '#FFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16},
  searchInput: {flex: 1, marginLeft: 10, color: '#172451', fontSize: 15, paddingVertical: 0},
  filters: {flexDirection: 'row', gap: 10, paddingHorizontal: 22, paddingVertical: 16},
  filter: {height: 40, minWidth: 62, paddingHorizontal: 18, borderRadius: 22, borderWidth: 1, borderColor: '#CAD3EA', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF'},
  activeFilter: {backgroundColor: colors.blue, borderColor: colors.blue},
  list: {paddingHorizontal: 22, paddingBottom: 125, gap: 14},
  emptyList: {flexGrow: 1},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10},
  card: {borderRadius: 16, overflow: 'hidden', backgroundColor: '#FFF'},
  media: {height: 176, backgroundColor: '#CBD6EE'},
  mediaImage: {width: '100%', height: '100%'},
  tag: {position: 'absolute', top: 12, left: 12, borderRadius: 5, backgroundColor: '#E9EEFC', paddingHorizontal: 9, paddingVertical: 4},
  unreadDot: {position: 'absolute', top: 12, right: 12, width: 11, height: 11, borderRadius: 6, backgroundColor: '#F05257'},
  textNewsIcon: {marginTop: 16, marginLeft: 16, width: 62, height: 62, borderRadius: 14, backgroundColor: '#E1F5EF', alignItems: 'center', justifyContent: 'center'},
  cardBody: {padding: 16},
  description: {marginTop: 5},
  meta: {flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 13},
  inlineUnread: {marginLeft: 'auto', width: 9, height: 9, borderRadius: 5, backgroundColor: '#F05257'},
  download: {marginLeft: 'auto', width: 32, height: 32, alignItems: 'center', justifyContent: 'center'},
});

export default News;
