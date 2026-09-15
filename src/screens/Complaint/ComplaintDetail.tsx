import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Image, Pressable, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import AppText from '../../components/AppText/AppText';
import {getComplaintDetail} from '../../api/query/ComplaintApi';
import {BASE_URL} from '../../api/AxiosClient';
import store from '../../components/redux/Store';
import {colors} from '../../utils/Colors';

const statusColors: Record<string, {text: string; bg: string; border: string}> = {
  Open: {text: '#B06B00', bg: '#FFF7E7', border: '#E8B75B'},
  Pending: {text: '#B06B00', bg: '#FFF7E7', border: '#E8B75B'},
  'Work Done': {text: '#147DA3', bg: '#EAF8FE', border: '#59BADA'},
  Complete: {text: '#07866F', bg: '#E9F9F4', border: '#43B9A0'},
  Closed: {text: '#526188', bg: '#EEF1F7', border: '#AAB4CC'},
  Cancelled: {text: '#B4232C', bg: '#FFF0F1', border: '#E68C92'},
  'In Review': {text: '#5B3FD1', bg: '#F1EEFE', border: '#A392EC'},
};

const isYes = (value: unknown) => String(value || '').trim().toLowerCase() === 'yes';

const DetailRow = ({label, value}: {label: string; value?: string | null}) => {
  const displayValue = String(value || '').trim() || 'N/A';
  return (
    <View style={styles.row}>
      <AppText size={12} color="#7885A8" style={styles.rowLabel}>{label}</AppText>
      <AppText size={13} color="#26365F" family="InterSemiBold" align="right" style={styles.rowValue}>{displayValue}</AppText>
    </View>
  );
};

const DetailSection = ({icon, title, rows}: {icon: string; title: string; rows: Array<{label: string; value?: string | null}>}) => {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}><AppText size={18} color="#24BFE7" family="InterBold">{icon}</AppText></View>
        <AppText size={17} color="#172451" family="InterBold">{title}</AppText>
      </View>
      <View style={styles.sectionBody}>{rows.map(row => <DetailRow key={row.label} {...row} />)}</View>
    </View>
  );
};

const ComplaintDetail = ({navigation, route}: any) => {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getComplaintDetail(route.params.complaintId)
      .then(response => setDetail(response?.data?.data || null))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [route.params.complaintId]);

  const status = statusColors[detail?.status] || statusColors.Open;
  const token = store.getState()?.auth?.token;
  const attachmentUrl = detail?.has_attachment
    ? `${BASE_URL.replace(/\/+$/, '')}/api/complaint/mobile-attachment/${route.params.complaintId}`
    : null;
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar backgroundColor={colors.blue} barStyle="light-content" />
      <View style={styles.header}>
        <Pressable hitSlop={12} onPress={navigation.goBack}><AppText size={30} color={colors.white} family="InterLight">‹</AppText></Pressable>
        <AppText size={20} color={colors.white} family="InterBold" numLines={1}>Complaint Detail</AppText>
        {!!detail?.can_edit && <Pressable style={styles.editButton} onPress={() => navigation.navigate('NewComplaint', {complaintId: detail.id})}><AppText size={13} color={colors.blue} family="InterBold">Edit</AppText></Pressable>}
      </View>
      {loading ? <View style={styles.center}><ActivityIndicator size="large" color={colors.blue} /></View> : !detail ? (
        <View style={styles.center}><AppText size={15} color="#7885A8">Complaint detail unavailable</AppText></View>
      ) : (
        <ScrollView style={styles.page} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.summary}>
            <View><AppText size={20} color="#172451" family="InterBold">{detail.complaint_number}</AppText><AppText size={12} color="#7885A8" style={styles.date}>{detail.complaint_date}</AppText></View>
            <View style={[styles.badge, {backgroundColor: status.bg, borderColor: status.border}]}><AppText size={10} color={status.text} family="InterBold" transform="uppercase">{detail.status}</AppText></View>
          </View>
          <DetailSection icon="▤" title="Received From" rows={[
            {label: 'Dealer', value: detail.dealer_name}, {label: 'Address', value: detail.dealer_address},
            {label: 'Contact No.', value: detail.dealer_contact}, {label: 'Alternate No.', value: detail.alternate_number},
          ]} />
          <DetailSection icon="○" title="End User & Technician" rows={[
            {label: 'End User Name', value: detail.end_user_name}, {label: 'End User Mobile', value: detail.end_user_mobile},
            {label: 'Technician Mobile', value: detail.technician_mobile}, {label: 'Assigned To', value: detail.assignee},
          ]} />
          <DetailSection icon="▣" title="Product & Complaint" rows={[
            {label: 'Category', value: detail.category},
            {label: 'Size', value: detail.size_unit && !String(detail.product_size || '').includes(detail.size_unit) ? `${detail.product_size} ${detail.size_unit}` : detail.product_size},
            {label: 'Batch No. / DOM', value: detail.batch_no_dom}, {label: 'Nature of Complaint', value: detail.description},
            {label: 'Received Through', value: detail.received_through},
          ]} />
          <DetailSection icon="▱" title="Office Action" rows={[
            {label: 'Material Provided', value: detail.office_action?.material_provided},
            ...(isYes(detail.office_action?.material_provided) ? [{label: 'Quantity Provided', value: detail.office_action?.quantity_provided}] : []),
            {label: 'Service Engineer Provided', value: detail.office_action?.service_engineer_provided},
            ...(isYes(detail.office_action?.service_engineer_provided) ? [{label: 'Visit Report', value: detail.office_action?.visit_report}] : []),
            {label: 'Replacement', value: detail.office_action?.replacement},
            ...(isYes(detail.office_action?.replacement) ? [{label: 'Replacement Qty', value: detail.office_action?.replacement_quantity}] : []),
            {label: 'Corrective Action & Verification', value: detail.office_action?.corrective_action},
            {label: 'Preventive Action', value: detail.office_action?.preventive_action},
            {label: 'Point Discussed With Customer / Dealer / Distributor', value: detail.office_action?.points_discussed},
            {label: 'Customer Care — Name', value: detail.office_action?.customer_care_name},
            {label: 'Department Head — Name', value: detail.office_action?.department_head_name},
            {label: 'Manager — Name', value: detail.office_action?.manager_name},
            {label: 'Final Decision', value: detail.office_action?.final_decision},
            {label: 'Action By', value: detail.office_action?.done_by},
            {label: 'Action / Remark', value: detail.office_action?.remark},
            {label: 'Status', value: detail.office_action?.status || detail.status},
          ]} />
          <View style={styles.section}>
            <View style={styles.sectionHeader}><View style={styles.sectionIcon}><AppText size={18} color="#24BFE7">⌕</AppText></View><AppText size={17} color="#172451" family="InterBold">Attachment</AppText></View>
            {attachmentUrl
              ? <Image source={{uri: attachmentUrl, headers: token ? {Authorization: `Bearer ${token}`} : undefined}} style={styles.image} resizeMode="cover" />
              : <View style={styles.emptyAttachment}><AppText size={13} color="#7885A8" family="InterSemiBold">N/A</AppText></View>}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.blue}, header: {height: 66, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, backgroundColor: colors.blue}, editButton: {marginLeft: 'auto', height: 36, minWidth: 62, paddingHorizontal: 14, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white},
  page: {flex: 1, backgroundColor: '#F2F4FA'}, content: {padding: 18, paddingBottom: 35, gap: 16}, center: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F2F4FA'},
  summary: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2}, date: {marginTop: 4}, badge: {height: 30, paddingHorizontal: 13, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center'},
  section: {borderRadius: 16, borderWidth: 1, borderColor: '#D5DDEF', overflow: 'hidden', backgroundColor: colors.white}, sectionHeader: {height: 68, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: '#E4E8F2'},
  sectionIcon: {width: 38, height: 38, borderRadius: 11, borderWidth: 1.5, borderColor: '#24BFE7', backgroundColor: '#EFFBFE', alignItems: 'center', justifyContent: 'center'}, sectionBody: {paddingHorizontal: 18},
  row: {minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, borderBottomWidth: 1, borderBottomColor: '#E9ECF4'}, rowLabel: {flex: 0.42}, rowValue: {flex: 0.58}, image: {height: 230, margin: 16, borderRadius: 12, backgroundColor: '#E9EDF6'}, emptyAttachment: {height: 72, alignItems: 'center', justifyContent: 'center'},
});

export default ComplaintDetail;
