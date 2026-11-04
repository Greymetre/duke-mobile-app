import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Dropdown } from 'react-native-element-dropdown';
import { Asset, launchImageLibrary } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import axiosClient, { resolveMediaUrl } from '../../api/AxiosClient';
import axiosClientForm from '../../api/AxiosForm';
import AppText from '../../components/AppText/AppText';
import { colors } from '../../utils/Colors';
import { Distributor, loadDistributors } from './loadDistributors';

const MAX_ATTACHMENTS = 5;

type Gift = { rowId: number; giftId: number | null; quantity: string };
type ActivityStatus = { label: string; value: number; statusName: string; message: string };
type GiftOption = { label: string; value: number; availableQuantity: number };

const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6M9 12h10" stroke={colors.black} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const ChevronDown = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path d="M4 6l4 4 4-4" stroke="#718096" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const DeleteIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" stroke="#D83B55" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const CalendarIcon = () => (
  <Svg width={21} height={21} viewBox="0 0 24 24" fill="none">
    <Path d="M6 3v3M18 3v3M4 9h16M5 5h14a1 1 0 011 1v14H4V6a1 1 0 011-1z" stroke={colors.blue} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M8 13h2M14 13h2M8 17h2M14 17h2" stroke={colors.blue} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const FormLabel = ({ children }: { children: React.ReactNode }) => (
  <AppText color="#5F6F8F" size={12} family="InterBold" spacing={0.6}>{children}</AppText>
);

const toLocalDate = (value: string) => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

// Also the correction form: with an activityId the request sent back by the manager is edited and resubmitted.
const CreatePAC = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const activityId: number | undefined = route?.params?.activityId;
  const isResubmit = Boolean(activityId);
  const [loadingRequest, setLoadingRequest] = useState(isResubmit);
  const [savedDistributor, setSavedDistributor] = useState<Distributor | null>(null);
  const [keptAttachments, setKeptAttachments] = useState<string[]>([]);
  const [activityType, setActivityType] = useState<number | null>(null);
  const [activityStatuses, setActivityStatuses] = useState<ActivityStatus[]>([]);
  const [statusesLoading, setStatusesLoading] = useState(true);
  const [statusesError, setStatusesError] = useState('');
  const [giftOptions, setGiftOptions] = useState<GiftOption[]>([]);
  const [giftsLoading, setGiftsLoading] = useState(true);
  const [giftsError, setGiftsError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activityDate, setActivityDate] = useState<Date | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [location, setLocation] = useState('');
  const [distributors, setDistributors] = useState<Distributor[]>([]);
  const [distributorsLoading, setDistributorsLoading] = useState(true);
  const [distributorsError, setDistributorsError] = useState('');
  const [distributorId, setDistributorId] = useState<number | null>(null);
  const [purpose, setPurpose] = useState('');
  const [estimatedBudget, setEstimatedBudget] = useState('');
  const [attachments, setAttachments] = useState<Asset[]>([]);
  const [companyShare, setCompanyShare] = useState('0');
  const [distributorShare, setDistributorShare] = useState('0');
  const [remark, setRemark] = useState('');
  const [gifts, setGifts] = useState<Gift[]>([
    { rowId: 1, giftId: null, quantity: '' },
  ]);

  useEffect(() => {
    let mounted = true;

    const loadActivityStatuses = async () => {
      setStatusesLoading(true);
      setStatusesError('');
      try {
        const response = await axiosClient.get('api/promotional-activity/statuses');
        const options = (response?.data?.data || []).map((status: any) => ({
          label: status.display_name || status.status_name,
          value: status.id,
          statusName: status.status_name,
          message: status.status_message,
        }));
        if (mounted) {
          setActivityStatuses(options);
          setActivityType(current => current ?? options[0]?.value ?? null);
        }
      } catch {
        if (mounted) {
          setActivityStatuses([]);
          setStatusesError('Unable to load activity types');
        }
      } finally {
        if (mounted) setStatusesLoading(false);
      }
    };

    loadActivityStatuses();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadGifts = async () => {
      setGiftsLoading(true);
      setGiftsError('');
      try {
        const response = await axiosClient.get('api/promotional-activity/gifts');
        const options = (response?.data?.data || []).map((gift: any) => ({
          label: gift.name,
          value: gift.id,
          availableQuantity: Number(gift.quantity) || 0,
        }));
        if (mounted) {
          setGiftOptions(options);
          // Keep gifts already filled from the request being corrected.
          setGifts(current => current.some(gift => gift.giftId) ? current : [{ rowId: 1, giftId: options[0]?.value ?? null, quantity: '' }]);
        }
      } catch {
        if (mounted) {
          setGiftOptions([]);
          setGiftsError('Unable to load gifts');
        }
      } finally {
        if (mounted) setGiftsLoading(false);
      }
    };

    loadGifts();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;

    loadDistributors()
      .then(options => {
        if (!mounted) return;
        setDistributors(options);
        setDistributorsError(options.length ? '' : 'No assigned dealers found');
      })
      .catch(() => {
        if (mounted) setDistributorsError('Unable to load dealers');
      })
      .finally(() => {
        if (mounted) setDistributorsLoading(false);
      });

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!activityId) return;
    let mounted = true;

    axiosClient.get(`api/promotional-activities/${activityId}`)
      .then(response => {
        const request = response?.data?.data;
        if (!mounted || !request) return;
        setActivityType(request.activity_type_id ?? null);
        if (request.distributor?.id) {
          setDistributorId(request.distributor.id);
          setSavedDistributor({ label: request.distributor.name || `Customer ${request.distributor.id}`, value: request.distributor.id });
        }
        if (request.activity_date) setActivityDate(toLocalDate(request.activity_date));
        setLocation(request.location_name || '');
        setPurpose(request.purpose || '');
        setEstimatedBudget(request.estimated_budget != null ? String(Math.round(request.estimated_budget)) : '');
        setCompanyShare(String(Math.round(request.company_share || 0)));
        setDistributorShare(String(Math.round(request.distributor_share || 0)));
        setRemark(request.remark || '');
        setKeptAttachments(request.attachments || []);
        if (request.gifts?.length) {
          setGifts(request.gifts.map((gift: any, index: number) => ({ rowId: index + 1, giftId: gift.id, quantity: String(gift.quantity) })));
        }
      })
      .catch(() => {
        Toast.show({ type: 'error', text1: 'Unable to load the activity request.' });
        navigation.goBack();
      })
      .finally(() => {
        if (mounted) setLoadingRequest(false);
      });

    return () => { mounted = false; };
  }, [activityId, navigation]);

  const attachmentCount = keptAttachments.length + attachments.length;
  const distributorOptions = savedDistributor && !distributors.some(item => String(item.value) === String(savedDistributor.value))
    ? [savedDistributor, ...distributors]
    : distributors;

  const pickAttachments = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: MAX_ATTACHMENTS - attachmentCount, quality: 0.8 });
    if (result.assets?.length) setAttachments(current => [...current, ...result.assets!].slice(0, MAX_ATTACHMENTS - keptAttachments.length));
  };

  const updateGiftQuantity = (rowId: number, quantity: string) => {
    setGifts(current => current.map(gift => gift.rowId === rowId ? { ...gift, quantity } : gift));
  };

  const updateGiftSelection = (rowId: number, giftId: number) => {
    setGifts(current => current.map(gift => gift.rowId === rowId ? { ...gift, giftId, quantity: '' } : gift));
  };

  const addGift = () => {
    const nextRowId = gifts.length ? Math.max(...gifts.map(gift => gift.rowId)) + 1 : 1;
    setGifts(current => [...current, { rowId: nextRowId, giftId: null, quantity: '' }]);
  };

  const formattedActivityDate = activityDate
    ? `${String(activityDate.getMonth() + 1).padStart(2, '0')}/${String(activityDate.getDate()).padStart(2, '0')}/${activityDate.getFullYear()}`
    : '';

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowCalendar(false);
    if (event.type === 'set' && selectedDate) setActivityDate(selectedDate);
  };

  const submitActivity = async () => {
    if (!activityType || !distributorId || !activityDate || !location.trim()) {
      Toast.show({ type: 'error', text1: 'Please select activity type, dealer, date and location.' });
      return;
    }

    if (!purpose.trim() || estimatedBudget === '') {
      Toast.show({ type: 'error', text1: 'Please enter purpose and estimated budget.' });
      return;
    }

    const selectedGifts = gifts
      .filter(gift => gift.giftId && Number(gift.quantity) > 0)
      .map(gift => ({ gift_id: gift.giftId, quantity: Number(gift.quantity) }));

    if (gifts.some(gift => (gift.giftId && !Number(gift.quantity)) || (!gift.giftId && Number(gift.quantity)))) {
      Toast.show({ type: 'error', text1: 'Please select gift and enter its quantity.' });
      return;
    }

    const localDate = `${activityDate.getFullYear()}-${String(activityDate.getMonth() + 1).padStart(2, '0')}-${String(activityDate.getDate()).padStart(2, '0')}`;
    const formData = new FormData();
    formData.append('activity_type_id', String(activityType));
    formData.append('distributor_id', String(distributorId));
    formData.append('activity_date', localDate);
    formData.append('location_name', location.trim());
    formData.append('purpose', purpose.trim());
    formData.append('estimated_budget', String(Number(estimatedBudget || 0)));
    selectedGifts.forEach((gift, index) => {
      formData.append(`gifts[${index}][gift_id]`, String(gift.gift_id));
      formData.append(`gifts[${index}][quantity]`, String(gift.quantity));
    });
    formData.append('company_share', String(Number(companyShare || 0)));
    formData.append('distributor_share', String(Number(distributorShare || 0)));
    if (remark.trim()) formData.append('remark', remark.trim());
    attachments.forEach((file, index) => formData.append('attachments[]', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.fileName || `pac_attachment_${Date.now()}_${index}.jpg`,
    } as any));
    keptAttachments.forEach(path => formData.append('keep_attachments[]', path));

    setSubmitting(true);
    try {
      const response = await axiosClientForm.post(
        isResubmit ? `api/promotional-activities/${activityId}/resubmit` : 'api/promotional-activities',
        formData,
      );
      Toast.show({ type: 'success', text1: response?.data?.message || 'Activity submitted for approval.' });
      navigation.goBack();
    } catch (error: any) {
      const message = error?.response?.data?.message;
      // Validation errors come back as { field: [messages] }.
      const firstError = message && typeof message === 'object' ? (Object.values(message).flat()[0] as string) : '';
      Toast.show({
        type: 'error',
        text1: typeof message === 'string' ? message : firstError || 'Unable to submit promotional activity.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingRequest) {
    return <View style={styles.loader}><ActivityIndicator size="large" color={colors.blue} /></View>;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()} hitSlop={10}>
          <BackIcon />
        </Pressable>
        <AppText color={colors.black} size={19} family="InterBold">{isResubmit ? 'Correct Promotional Activity' : 'New Promotional Activity'}</AppText>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: 30 + insets.bottom }]}
      >
        <View style={styles.fieldGroup}>
          <FormLabel>ACTIVITY TYPE</FormLabel>
          <Dropdown
            style={styles.input}
            containerStyle={styles.dropdownContainer}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownSelected}
            data={activityStatuses}
            labelField="label"
            valueField="value"
            value={activityType}
            disable={statusesLoading}
            placeholder={statusesLoading ? 'Loading activity types...' : 'Select activity type'}
            onChange={item => setActivityType(item.value)}
            renderRightIcon={() => statusesLoading ? <ActivityIndicator size="small" color={colors.blue} /> : <ChevronDown />}
          />
          {statusesError ? <AppText color="#BE0B0B" size={12}>{statusesError}</AppText> : null}
        </View>

        <View style={styles.fieldGroup}>
          <FormLabel>DEALER / DISTRIBUTOR</FormLabel>
          <Dropdown
            style={styles.input}
            containerStyle={styles.dropdownContainer}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownSelected}
            data={distributorOptions}
            labelField="label"
            valueField="value"
            value={distributorId}
            disable={distributorsLoading}
            search
            searchPlaceholder="Search dealer..."
            placeholder={distributorsLoading ? 'Loading dealers...' : 'Select dealer'}
            onChange={item => setDistributorId(item.value)}
            renderRightIcon={() => distributorsLoading ? <ActivityIndicator size="small" color={colors.blue} /> : <ChevronDown />}
          />
          {distributorsError ? <AppText color="#BE0B0B" size={12}>{distributorsError}</AppText> : null}
        </View>

        <View style={styles.fieldGroup}>
          <FormLabel>PROPOSED DATE</FormLabel>
          <Pressable style={styles.input} onPress={() => setShowCalendar(true)}>
            <AppText color={formattedActivityDate ? colors.black : '#929BAD'} size={15}>
              {formattedActivityDate || 'mm/dd/yyyy'}
            </AppText>
            <CalendarIcon />
          </Pressable>
        </View>

        {showCalendar && Platform.OS === 'android' ? (
          <DateTimePicker
            value={activityDate || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        ) : null}

        <Modal visible={showCalendar && Platform.OS === 'ios'} transparent animationType="fade" onRequestClose={() => setShowCalendar(false)}>
          <View style={styles.calendarOverlay}>
            <View style={styles.calendarModal}>
              <AppText color={colors.black} size={18} family="InterBold">Select Proposed Date</AppText>
              <DateTimePicker
                value={activityDate || new Date()}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                style={styles.datePicker}
              />
              <View style={styles.calendarActions}>
                <Pressable style={styles.cancelButton} onPress={() => setShowCalendar(false)}>
                  <AppText color="#718096" size={15} family="InterSemiBold">Cancel</AppText>
                </Pressable>
                <Pressable style={styles.doneButton} onPress={() => setShowCalendar(false)}>
                  <AppText color={colors.white} size={15} family="InterSemiBold">Done</AppText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        <View style={styles.fieldGroup}>
          <FormLabel>ACTIVITY LOCATION NAME</FormLabel>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Sector 12 Market, Nashik"
            placeholderTextColor="#929BAD"
            style={styles.textInput}
          />
        </View>

        <View style={styles.fieldGroup}>
          <FormLabel>PURPOSE</FormLabel>
          <TextInput
            value={purpose}
            onChangeText={setPurpose}
            placeholder="Why is this activity needed?"
            placeholderTextColor="#929BAD"
            multiline
            maxLength={1000}
            textAlignVertical="top"
            style={[styles.textInput, styles.multilineInput]}
          />
        </View>

        <View style={styles.fieldGroup}>
          <FormLabel>ESTIMATED BUDGET</FormLabel>
          <View style={styles.amountInput}>
            <AppText color="#718096" size={16}>₹</AppText>
            <TextInput
              value={estimatedBudget}
              onChangeText={value => setEstimatedBudget(value.replace(/[^0-9]/g, ''))}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor="#929BAD"
              style={styles.amountTextInput}
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <FormLabel>GIFTS</FormLabel>
          {gifts.map(gift => (
            <View style={styles.giftRow} key={gift.rowId}>
              <Dropdown
                style={[styles.input, styles.giftSelect]}
                containerStyle={styles.dropdownContainer}
                placeholderStyle={styles.dropdownPlaceholder}
                selectedTextStyle={styles.dropdownSelected}
                data={giftOptions}
                labelField="label"
                valueField="value"
                value={gift.giftId}
                disable={giftsLoading}
                placeholder={giftsLoading ? 'Loading gifts...' : 'Select gift'}
                onChange={item => updateGiftSelection(gift.rowId, item.value)}
                renderRightIcon={() => giftsLoading ? <ActivityIndicator size="small" color={colors.blue} /> : <ChevronDown />}
              />
              <TextInput
                value={gift.quantity}
                onChangeText={value => updateGiftQuantity(gift.rowId, value.replace(/[^0-9]/g, ''))}
                placeholder="Qty"
                placeholderTextColor="#929BAD"
                keyboardType="number-pad"
                style={[styles.textInput, styles.quantityInput]}
              />
              {gifts.length > 1 ? (
                <Pressable style={styles.deleteButton} onPress={() => setGifts(current => current.filter(item => item.rowId !== gift.rowId))}>
                  <DeleteIcon />
                </Pressable>
              ) : null}
            </View>
          ))}
          <Pressable style={styles.addGiftButton} onPress={addGift}>
            <AppText color={colors.blue} size={20} family="InterRegular">+</AppText>
            <AppText color={colors.blue} size={14} family="InterBold">Add Gift</AppText>
          </Pressable>
          {giftsError ? <AppText color="#BE0B0B" size={12}>{giftsError}</AppText> : null}
        </View>

        <View style={styles.fieldGroup}>
          <FormLabel>OTHER EXPENSE AMOUNT</FormLabel>
          <View style={styles.shareInputsRow}>
            <View style={styles.shareInputGroup}>
              <AppText color="#5F6F8F" size={13} family="InterSemiBold">Company Share</AppText>
              <View style={styles.amountInput}>
                <AppText color="#718096" size={16}>₹</AppText>
                <TextInput
                  value={companyShare}
                  onChangeText={value => setCompanyShare(value.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#929BAD"
                  style={styles.amountTextInput}
                />
              </View>
            </View>
            <View style={styles.shareInputGroup}>
              <AppText color="#5F6F8F" size={13} family="InterSemiBold">Distributor Share</AppText>
              <View style={styles.amountInput}>
                <AppText color="#718096" size={16}>₹</AppText>
                <TextInput
                  value={distributorShare}
                  onChangeText={value => setDistributorShare(value.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor="#929BAD"
                  style={styles.amountTextInput}
                />
              </View>
            </View>
          </View>
          <View style={styles.totalRow}>
            <AppText color="#718096" size={14}>Total</AppText>
            <AppText color={colors.black} size={16} family="InterBold">
              ₹{Number(companyShare || 0) + Number(distributorShare || 0)}
            </AppText>
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <FormLabel>{`ATTACHMENTS (OPTIONAL, MAX ${MAX_ATTACHMENTS})`}</FormLabel>
          <AppText color="#718096" size={12}>Proposal, quotation or other supporting documents</AppText>
          <View style={styles.attachmentRow}>
            {keptAttachments.map(path => (
              <Pressable key={path} style={styles.attachmentBox} onPress={() => setKeptAttachments(current => current.filter(item => item !== path))}>
                {/\.pdf$/i.test(path)
                  ? <AppText color={colors.blue} size={13} family="InterBold">PDF</AppText>
                  : <Image source={{ uri: resolveMediaUrl(path) }} style={styles.attachmentPreview} resizeMode="cover" />}
                <View style={styles.removeAttachment}><AppText color={colors.white} size={14}>×</AppText></View>
              </Pressable>
            ))}
            {attachments.map((file, index) => (
              <Pressable key={`${file.uri}-${index}`} style={styles.attachmentBox} onPress={() => setAttachments(current => current.filter((_, fileIndex) => fileIndex !== index))}>
                <Image source={{ uri: file.uri }} style={styles.attachmentPreview} resizeMode="cover" />
                <View style={styles.removeAttachment}><AppText color={colors.white} size={14}>×</AppText></View>
              </Pressable>
            ))}
            {attachmentCount < MAX_ATTACHMENTS ? (
              <Pressable style={styles.attachmentBox} onPress={pickAttachments}>
                <AppText color="#718096" size={24}>+</AppText>
                <AppText color="#718096" size={12}>Add</AppText>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <FormLabel>REMARK</FormLabel>
          <TextInput
            value={remark}
            onChangeText={setRemark}
            placeholder="Optional notes"
            placeholderTextColor="#929BAD"
            style={styles.textInput}
          />
        </View>

        <Pressable style={[styles.submitButton, submitting && styles.buttonDisabled]} onPress={submitActivity} disabled={submitting}>
          {submitting ? <ActivityIndicator color={colors.white} /> : (
            <AppText color={colors.white} size={15} family="InterBold">{isResubmit ? 'Resubmit for Approval' : 'Submit for Approval'}</AppText>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgColor },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bgColor },
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
  backButton: { width: 42, height: 38, justifyContent: 'center' },
  content: { padding: 18 },
  fieldGroup: { marginBottom: 22, gap: 9 },
  input: {
    minHeight: 52,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 10,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textInput: {
    minHeight: 52,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 10,
    backgroundColor: colors.white,
    color: colors.black,
    fontSize: 15,
  },
  multilineInput: { height: 90, paddingTop: 14 },
  attachmentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  attachmentBox: {
    width: 72,
    height: 72,
    overflow: 'hidden',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#AEBAD1',
    borderRadius: 10,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachmentPreview: { width: '100%', height: '100%' },
  removeAttachment: { position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
  dropdownContainer: { borderRadius: 10, borderColor: '#CBD5E0' },
  dropdownPlaceholder: { color: '#929BAD', fontSize: 15 },
  dropdownSelected: { color: colors.black, fontSize: 15 },
  giftRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  giftSelect: { flex: 1 },
  quantityInput: { width: 88 },
  deleteButton: { width: 28, height: 48, alignItems: 'center', justifyContent: 'center' },
  addGiftButton: {
    height: 46,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#B9C5E4',
    borderRadius: 10,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareInputsRow: { flexDirection: 'row', gap: 10 },
  shareInputGroup: { flex: 1, gap: 8 },
  amountInput: {
    height: 52,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#CBD5E0',
    borderRadius: 10,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  amountTextInput: { flex: 1, color: colors.black, fontSize: 15, paddingVertical: 0 },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2, paddingTop: 4 },
  submitButton: { height: 50, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: colors.blue },
  buttonDisabled: { opacity: 0.65 },
  calendarOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', paddingHorizontal: 20 },
  calendarModal: { padding: 20, borderRadius: 16, backgroundColor: colors.white },
  datePicker: { width: '100%', marginVertical: 8 },
  calendarActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelButton: { height: 44, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: colors.bgColor },
  doneButton: { height: 44, paddingHorizontal: 24, alignItems: 'center', justifyContent: 'center', borderRadius: 9, backgroundColor: colors.blue },
});

export default CreatePAC;
