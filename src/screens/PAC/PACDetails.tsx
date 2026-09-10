import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StatusBar, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import axiosClient, { resolveMediaUrl } from '../../api/AxiosClient';
import AppText from '../../components/AppText/AppText';
import { colors } from '../../utils/Colors';

type Details = {
  id: number;
  activity_type: string;
  activity_date: string;
  location_name: string;
  remark?: string;
  approval_status: 'pending' | 'approved' | 'rejected' | 'completed';
  approval_remark?: string;
  company_share: number;
  distributor_share: number;
  total_amount: number;
  creator?: { id: number; name: string };
  reporting_manager?: { id: number; name: string; designation?: string };
  gifts: Array<{ id: number; name: string; quantity: number }>;
  can_approve: boolean;
  can_complete: boolean;
  distributor?: { id: number; name?: string; customer_code?: string; sap_code?: string };
  activity_photos?: string[];
  participants?: Array<{ name: string; mobile: string; address: string }>;
  execution_remark?: string;
};

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6M9 12h10" stroke={colors.black} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const Field = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.field}>
    <AppText color="#718096" size={11} family="InterBold" spacing={0.5}>{label}</AppText>
    <AppText color={colors.black} size={14} family="InterRegular" lineHeight={20}>{value || '-'}</AppText>
  </View>
);

const PACDetails = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const activityId = route.params?.activityId;
  const [details, setDetails] = useState<Details | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [managerRemark, setManagerRemark] = useState('');

  const loadDetails = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get(`api/promotional-activities/${activityId}`);
      setDetails(response?.data?.data || null);
    } catch {
      Toast.show({ type: 'error', text1: 'Unable to load activity details.' });
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [activityId, navigation]);

  useEffect(() => { loadDetails(); }, [loadDetails]);

  const updateApproval = async (status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !managerRemark.trim()) {
      Toast.show({ type: 'error', text1: 'Remark is required to reject.' });
      return;
    }
    setActionLoading(true);
    try {
      const response = await axiosClient.post(`api/promotional-activities/${activityId}/approval`, {
        status,
        remark: managerRemark.trim() || null,
      });
      Toast.show({ type: 'success', text1: response?.data?.message || `Activity ${status}.` });
      await loadDetails();
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.response?.data?.message || 'Unable to update activity.' });
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const date = new Date(`${value}T00:00:00`);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading || !details) {
    return <View style={styles.loader}><ActivityIndicator size="large" color={colors.blue} /></View>;
  }

  const pending = details.approval_status === 'pending';
  const statusColor = pending ? '#B36B00' : details.approval_status === 'rejected' ? '#BE0B0B' : '#14875D';

  if (details.approval_status === 'completed') {
    const distributorCode = details.distributor?.customer_code || details.distributor?.sap_code;
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}><BackIcon /></Pressable>
          <AppText color={colors.black} size={19} family="InterBold" style={styles.headerTitle}>{details.activity_type}</AppText>
          <View style={[styles.badge, styles.completedBadge]}><AppText color="#14875D" size={11} family="InterBold">COMPLETED</AppText></View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: 28 + insets.bottom }]}>
          <View style={styles.card}>
            <Field label="ACTIVITY DATE" value={formatDate(details.activity_date)} />
            <Field label="ACTIVITY LOCATION" value={details.location_name} />
            <Field label="REPORTING MANAGER" value={details.reporting_manager ? `${details.reporting_manager.name}${details.reporting_manager.designation ? ` — ${details.reporting_manager.designation}` : ''}` : '-'} />
            <Field label="DISTRIBUTOR" value={details.distributor ? `${details.distributor.name || '-'}${distributorCode ? ` · ${distributorCode}` : ''}` : '-'} />
          </View>

          <View style={styles.card}>
            <AppText color="#718096" size={11} family="InterBold" spacing={0.5}>GIFTS</AppText>
            {details.gifts.length ? details.gifts.map(gift => <View style={styles.valueRow} key={gift.id}><AppText size={14}>{gift.name}</AppText><AppText size={14} family="InterBold">× {gift.quantity}</AppText></View>) : <AppText color="#718096" size={14}>No gifts</AppText>}
          </View>

          <View style={styles.card}>
            <AppText color="#718096" size={11} family="InterBold" spacing={0.5}>OTHER EXPENSE AMOUNT</AppText>
            <View style={styles.valueRow}><AppText size={14}>Company Share</AppText><AppText size={14} family="InterSemiBold">₹{details.company_share}</AppText></View>
            <View style={styles.valueRow}><AppText size={14}>Distributor Share</AppText><AppText size={14} family="InterSemiBold">₹{details.distributor_share}</AppText></View>
            <View style={styles.divider} />
            <View style={styles.valueRow}><AppText size={14} family="InterBold">Total</AppText><AppText size={15} family="InterBold">₹{details.total_amount}</AppText></View>
          </View>

          <View style={styles.card}><Field label="REMARK" value={details.execution_remark || '-'} /></View>

          {details.activity_photos?.length ? <View style={styles.card}>
            <AppText color="#718096" size={11} family="InterBold">ACTIVITY PHOTOS</AppText>
            <View style={styles.photoRow}>{details.activity_photos.map((photo, index) => {
              const compatiblePath = photo.replace(/^(https?:\/\/[^/]+)\/storage\//i, '$1/public/storage/');
              return <Image key={`${photo}-${index}`} source={{ uri: resolveMediaUrl(compatiblePath) }} style={styles.photo} />;
            })}</View>
          </View> : null}

          <View style={styles.sectionHeader}>
            <AppText color="#5F6F8F" size={12} family="InterBold">PARTICIPANTS</AppText>
            <AppText color="#718096" size={12}>{details.participants?.length || 0} added</AppText>
          </View>
          {details.participants?.length ? details.participants.map((participant, index) => (
            <View style={styles.participantCard} key={`${participant.mobile}-${index}`}>
              <AppText size={14} family="InterBold">{index + 1}. {participant.name}</AppText>
              <AppText color="#718096" size={13}>{participant.mobile} · {participant.address}</AppText>
            </View>
          )) : <View style={styles.card}><AppText color="#718096" size={14}>No participants</AppText></View>}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}><BackIcon /></Pressable>
        <AppText color={colors.black} size={19} family="InterBold">{details.activity_type}</AppText>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: 28 + insets.bottom }]}>
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <AppText color={colors.black} size={17} family="InterBold">{details.activity_type}</AppText>
            <View style={[styles.badge, pending ? styles.pendingBadge : details.approval_status === 'rejected' ? styles.rejectedBadge : styles.approvedBadge]}>
              <AppText color={statusColor} size={11} family="InterBold">{pending ? 'PENDING APPROVAL' : details.approval_status.toUpperCase()}</AppText>
            </View>
          </View>
          <Field label="ACTIVITY DATE" value={formatDate(details.activity_date)} />
          <Field label="ACTIVITY LOCATION" value={details.location_name} />
          <Field label="REMARK" value={details.remark} />
          <Field label="CREATED BY" value={details.creator?.name} />
          <Field label="REPORTING MANAGER" value={details.reporting_manager ? `${details.reporting_manager.name}${details.reporting_manager.designation ? ` — ${details.reporting_manager.designation}` : ''}` : '-'} />
        </View>

        <View style={styles.card}>
          <AppText color="#718096" size={11} family="InterBold" spacing={0.5}>GIFTS</AppText>
          {details.gifts.length ? details.gifts.map(gift => (
            <View style={styles.valueRow} key={gift.id}>
              <AppText color={colors.black} size={14}>{gift.name}</AppText>
              <AppText color={colors.black} size={14} family="InterBold">× {gift.quantity}</AppText>
            </View>
          )) : <AppText color="#718096" size={14}>No gifts</AppText>}
        </View>

        <View style={styles.card}>
          <AppText color="#718096" size={11} family="InterBold" spacing={0.5}>OTHER EXPENSE AMOUNT</AppText>
          <View style={styles.valueRow}><AppText size={14}>Company Share</AppText><AppText size={14} family="InterSemiBold">₹{details.company_share}</AppText></View>
          <View style={styles.valueRow}><AppText size={14}>Distributor Share</AppText><AppText size={14} family="InterSemiBold">₹{details.distributor_share}</AppText></View>
          <View style={styles.divider} />
          <View style={styles.valueRow}><AppText size={14} family="InterBold">Total</AppText><AppText size={15} family="InterBold">₹{details.total_amount}</AppText></View>
        </View>

        {details.approval_remark ? <View style={styles.card}><Field label="REPORTING MANAGER REMARK" value={details.approval_remark} /></View> : null}

        {details.can_approve ? (
          <View style={styles.approvalSection}>
            <AppText color="#5F6F8F" size={12} family="InterBold">REPORTING MANAGER REMARK</AppText>
            <TextInput value={managerRemark} onChangeText={setManagerRemark} placeholder="Add a remark (required to reject)" placeholderTextColor="#929BAD" style={styles.remarkInput} />
            <View style={styles.actionRow}>
              <Pressable disabled={actionLoading} style={styles.rejectButton} onPress={() => updateApproval('rejected')}>
                <AppText color="#BE0B0B" size={14} family="InterBold">Reject</AppText>
              </Pressable>
              <Pressable disabled={actionLoading} style={styles.approveButton} onPress={() => updateApproval('approved')}>
                {actionLoading ? <ActivityIndicator color={colors.white} /> : <AppText color={colors.white} size={14} family="InterBold">Approve</AppText>}
              </Pressable>
            </View>
          </View>
        ) : pending ? (
          <View style={styles.pendingNote}><AppText color="#8A5A08" size={13} lineHeight={20}>Awaiting approval from the reporting manager.</AppText></View>
        ) : null}
        {details.can_complete ? (
          <Pressable style={styles.completeButton} onPress={() => navigation.navigate('PACExecution', { activityId: details.id })}>
            <AppText color={colors.white} size={15} family="InterBold">Fill Activity Details</AppText>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgColor },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgColor },
  header: { minHeight: 82, paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: '#E2E5EC' },
  headerTitle: { flex: 1 },
  backButton: { width: 42, height: 38, justifyContent: 'center' },
  content: { padding: 16, gap: 14 },
  card: { padding: 17, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: '#D9DFEC', gap: 15 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 16, borderWidth: 1 },
  pendingBadge: { backgroundColor: '#FFF5DF', borderColor: '#E8C17A' },
  approvedBadge: { backgroundColor: '#E8F7F1', borderColor: '#A7DEC9' },
  completedBadge: { backgroundColor: '#E8F7F1', borderColor: '#A7DEC9' },
  rejectedBadge: { backgroundColor: '#FDECEC', borderColor: '#F3B7B7' },
  field: { gap: 5 },
  valueRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  divider: { height: 1, backgroundColor: '#E2E5EC' },
  pendingNote: { padding: 16, borderRadius: 12, backgroundColor: '#FFF5DF', borderWidth: 1, borderColor: '#E8C17A' },
  approvalSection: { gap: 12 },
  remarkInput: { height: 52, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1, borderColor: '#CBD5E0', backgroundColor: colors.white, color: colors.black, fontSize: 14 },
  actionRow: { flexDirection: 'row', gap: 12 },
  rejectButton: { flex: 1, height: 48, borderRadius: 10, borderWidth: 1, borderColor: '#E4A7A7', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  approveButton: { flex: 1, height: 48, borderRadius: 10, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  completeButton: { height: 50, paddingHorizontal: 18, alignSelf: 'flex-start', borderRadius: 10, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photo: { width: 88, height: 88, borderRadius: 10, backgroundColor: '#E2E5EC' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  participantCard: { padding: 16, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: '#D9DFEC', gap: 8 },
});

export default PACDetails;
