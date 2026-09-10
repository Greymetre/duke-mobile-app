import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StatusBar, StyleSheet, TextInput, View } from 'react-native';
import { Asset, launchImageLibrary } from 'react-native-image-picker';
import { Dropdown } from 'react-native-element-dropdown';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import axiosClient from '../../api/AxiosClient';
import axiosClientForm from '../../api/AxiosForm';
import { API_ENDPOINT } from '../../api/ApiUrls';
import AppText from '../../components/AppText/AppText';
import { colors } from '../../utils/Colors';

type Participant = { id: number; name: string; mobile: string; address: string };
type Distributor = { label: string; value: number };

const PACExecution = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const activityId = route.params?.activityId;
  const [activity, setActivity] = useState<any>(null);
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [distributorsError, setDistributorsError] = useState('');
  const [distributorId, setDistributorId] = useState<number | null>(null);
  const [photos, setPhotos] = useState<Asset[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([{ id: 1, name: '', mobile: '', address: '' }]);
  const [executionRemark, setExecutionRemark] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadForm = async () => {
      try {
        const activityResponse = await axiosClient.get(`api/promotional-activities/${activityId}`);
        const activityData = activityResponse?.data?.data;
        setActivity(activityData);

        try {
          const typeResponse = await axiosClient.get(API_ENDPOINT.GET_CUSTOMER_TYPE_LIST);
          const typePayload = typeResponse?.data;
          const typeRows = typePayload?.data?.data
            ?? typePayload?.data?.customer_types
            ?? typePayload?.data
            ?? typePayload?.customer_types
            ?? [];
          const sellerTypes = (Array.isArray(typeRows) ? typeRows : []).filter((item: any) => {
            const name = String(item?.customertype_name ?? item?.type_name ?? item?.type ?? item?.customer_type ?? item?.name ?? '').toLowerCase();
            return (name.includes('distributor') || name.includes('dealer'))
              && !name.includes('master') && !name.includes('secondary');
          });
          const sellerResponses = await Promise.all(sellerTypes.map((type: any) =>
            axiosClient.get(API_ENDPOINT.GET_CUSTOMER_LIST, {
              params: {
                customer_type_id: type?.id ?? type?.customer_type_id ?? type?.customertype ?? type?.value,
                pageSize: 100,
                page: 1,
              },
            })));
          const seen = new Set<string>();
          const options = sellerResponses.flatMap(response => {
            const payload = response?.data?.data;
            return Array.isArray(payload) ? payload : (payload?.data || []);
          }).map((item: any) => ({
            label: item?.name || item?.shop_name || item?.legal_name || item?.customer_name || `Customer ${item?.customer_id ?? item?.id}`,
            value: item?.customer_id ?? item?.id,
          })).filter((item: Distributor) => {
            const key = String(item.value);
            if (!item.value || seen.has(key)) return false;
            seen.add(key);
            return true;
          });
          setDistributors(options);
          setDistributorsError(options.length ? '' : 'No assigned distributors found');
        } catch {
          setDistributors([]);
          setDistributorsError('Unable to load assigned distributors');
        }
      } catch {
        Toast.show({ type: 'error', text1: 'Unable to load execution form.' });
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    loadForm();
  }, [activityId, navigation]);

  const pickPhotos = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 3 - photos.length, quality: 0.8 });
    if (result.assets?.length) setPhotos(current => [...current, ...result.assets!].slice(0, 3));
  };

  const updateParticipant = (id: number, key: keyof Omit<Participant, 'id'>, value: string) => {
    setParticipants(current => current.map(item => item.id === id ? { ...item, [key]: value } : item));
  };

  const addParticipant = () => {
    if (participants.length >= 50) return;
    const id = Math.max(...participants.map(item => item.id), 0) + 1;
    setParticipants(current => [...current, { id, name: '', mobile: '', address: '' }]);
  };

  const submit = async () => {
    if (!distributorId || !photos.length || participants.some(item => !item.name.trim() || !item.mobile.trim() || !item.address.trim())) {
      Toast.show({ type: 'error', text1: 'Distributor, photo and all participant details are required.' });
      return;
    }
    const formData = new FormData();
    formData.append('distributor_id', String(distributorId));
    formData.append('participants', JSON.stringify(participants.map(({ id: _id, ...item }) => item)));
    formData.append('execution_remark', executionRemark.trim());
    photos.forEach((photo, index) => formData.append('photos[]', {
      uri: photo.uri,
      type: photo.type || 'image/jpeg',
      name: photo.fileName || `pac_${Date.now()}_${index}.jpg`,
    } as any));
    setSubmitting(true);
    try {
      const response = await axiosClientForm.post(`api/promotional-activities/${activityId}/complete`, formData);
      Toast.show({ type: 'success', text1: response?.data?.message || 'Activity completed successfully.' });
      navigation.popTo('BottomTab');
    } catch (error: any) {
      Toast.show({ type: 'error', text1: error?.response?.data?.message || 'Unable to complete activity.' });
    } finally { setSubmitting(false); }
  };

  if (loading || !activity) return <View style={styles.loader}><ActivityIndicator size="large" color={colors.blue} /></View>;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.back} onPress={() => navigation.goBack()}><AppText size={26}>‹</AppText></Pressable>
        <AppText size={19} family="InterBold">Activity Execution Details</AppText>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 28 + insets.bottom }]} keyboardShouldPersistTaps="handled">
        <AppText color="#718096" size={11} family="InterBold">APPROVAL MANAGER</AppText>
        <AppText size={15} family="InterSemiBold">{activity.reporting_manager?.name || '-'}{activity.reporting_manager?.designation ? ` — ${activity.reporting_manager.designation}` : ''}</AppText>
        <View style={styles.group}><AppText style={styles.label}>ACTIVITY DATE</AppText><View style={styles.readonly}><AppText size={14}>{activity.activity_date}</AppText></View></View>
        <View style={styles.group}><AppText style={styles.label}>ACTIVITY LOCATION</AppText><View style={styles.readonly}><AppText size={14}>{activity.location_name}</AppText></View></View>
        <View style={styles.group}>
          <AppText style={styles.label}>DISTRIBUTOR</AppText>
          <Dropdown style={styles.input} containerStyle={styles.menu} data={distributors} labelField="label" valueField="value" value={distributorId} onChange={item => setDistributorId(item.value)} placeholder="Search distributor name or code" placeholderStyle={styles.placeholder} selectedTextStyle={styles.selected} search searchPlaceholder="Search distributor..." />
          {distributorsError ? <AppText color="#BE0B0B" size={12}>{distributorsError}</AppText> : null}
        </View>
        <View style={styles.group}>
          <AppText style={styles.label}>ACTIVITY PHOTOS (MAX 3)</AppText>
          <View style={styles.photoRow}>
            {[0, 1, 2].map(index => (
              <Pressable key={index} style={styles.photoBox} onPress={photos[index] ? () => setPhotos(current => current.filter((_, photoIndex) => photoIndex !== index)) : pickPhotos}>
                {photos[index]?.uri ? (
                  <>
                    <Image source={{ uri: photos[index].uri }} style={styles.photoPreview} resizeMode="cover" />
                    <View style={styles.removePhoto}><AppText color={colors.white} size={14}>×</AppText></View>
                  </>
                ) : (
                  <>
                    <AppText color="#718096" size={24}>+</AppText>
                    <AppText color="#718096" size={12}>Photo {index + 1}</AppText>
                  </>
                )}
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.group}>
          <View style={styles.participantHeader}>
            <AppText style={styles.label}>PARTICIPANTS</AppText>
            <AppText color="#718096" size={12}>{participants.length} / 50</AppText>
          </View>
          {participants.map((participant, index) => (
            <View style={styles.participantCard} key={participant.id}>
              <View style={styles.participantTitle}>
                <AppText color={colors.blue} size={13} family="InterBold">Participant {index + 1}</AppText>
                {participants.length > 1 ? <Pressable onPress={() => setParticipants(current => current.filter(item => item.id !== participant.id))}><AppText color="#BE0B0B" size={13}>Remove</AppText></Pressable> : null}
              </View>
              <TextInput style={styles.textInput} value={participant.name} onChangeText={value => updateParticipant(participant.id, 'name', value)} placeholder="Name" placeholderTextColor="#929BAD" />
              <TextInput style={styles.textInput} value={participant.mobile} onChangeText={value => updateParticipant(participant.id, 'mobile', value.replace(/[^0-9]/g, '').slice(0, 10))} placeholder="10 digit mobile number" placeholderTextColor="#929BAD" keyboardType="number-pad" maxLength={10} />
              <TextInput style={styles.textInput} value={participant.address} onChangeText={value => updateParticipant(participant.id, 'address', value)} placeholder="Address" placeholderTextColor="#929BAD" />
            </View>
          ))}
          <Pressable style={styles.addButton} onPress={addParticipant} disabled={participants.length >= 50}><AppText color={colors.blue} size={14} family="InterBold">+ Add Participant</AppText></Pressable>
        </View>
        <View style={styles.group}>
          <AppText style={styles.label}>REMARK</AppText>
          <TextInput style={[styles.textInput, styles.remarkInput]} value={executionRemark} onChangeText={setExecutionRemark} placeholder="Add activity remark" placeholderTextColor="#929BAD" multiline maxLength={1000} textAlignVertical="top" />
        </View>
        <Pressable style={[styles.submitButton, submitting && styles.disabled]} onPress={submit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={colors.white} /> : <AppText color={colors.white} size={15} family="InterBold">Complete Activity</AppText>}
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgColor }, loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { minHeight: 82, paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: '#E2E5EC' }, back: { width: 42 },
  content: { padding: 18, gap: 14 }, group: { gap: 8 }, label: { color: '#5F6F8F', fontSize: 12, fontFamily: 'Inter-SemiBold' },
  input: { height: 52, paddingHorizontal: 14, borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 10, backgroundColor: colors.white }, menu: { borderRadius: 10 }, placeholder: { color: '#929BAD', fontSize: 14 }, selected: { color: colors.black, fontSize: 14 },
  readonly: { height: 50, paddingHorizontal: 14, justifyContent: 'center', borderWidth: 1, borderColor: '#D9DFEC', borderRadius: 10, backgroundColor: colors.white }, photoRow: { flexDirection: 'row', gap: 9 },
  photoBox: { flex: 1, height: 100, overflow: 'hidden', borderWidth: 1, borderStyle: 'dashed', borderColor: '#AEBAD1', borderRadius: 10, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', gap: 6 },
  photoPreview: { width: '100%', height: '100%' }, removePhoto: { position: 'absolute', top: 5, right: 5, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
  participantHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, participantCard: { padding: 12, gap: 9, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: '#D9DFEC' }, participantTitle: { flexDirection: 'row', justifyContent: 'space-between' },
  textInput: { height: 46, paddingHorizontal: 12, borderWidth: 1, borderColor: '#CBD5E0', borderRadius: 9, color: colors.black, backgroundColor: colors.white },
  remarkInput: { height: 76, paddingTop: 12 },
  addButton: { alignSelf: 'flex-start', height: 44, paddingHorizontal: 14, borderRadius: 9, borderWidth: 1, borderColor: '#B9C5E4', backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  submitButton: { height: 50, borderRadius: 10, backgroundColor: colors.blue, alignItems: 'center', justifyContent: 'center' }, disabled: { opacity: 0.65 },
});

export default PACExecution;
