import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Alert, Image, Pressable, ScrollView, StatusBar, StyleSheet, TextInput, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Asset, launchImageLibrary} from 'react-native-image-picker';
import AppText from '../../components/AppText/AppText';
import {colors} from '../../utils/Colors';
import {createComplaint, getComplaintCreateOptions, getComplaintDetail, updateComplaint} from '../../api/query/ComplaintApi';

type Option = {id: number; name: string; address?: string; contact?: string};

const Field = ({label, value, onChangeText, placeholder, editable = true, multiline = false, keyboardType = 'default'}: any) => (
  <View style={styles.fieldWrap}>
    <AppText size={11} color="#6E7DA6" family="InterBold" transform="uppercase">{label}</AppText>
    <TextInput
      allowFontScaling={false}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#9AA5C0"
      editable={editable}
      multiline={multiline}
      keyboardType={keyboardType}
      maxLength={keyboardType === 'phone-pad' ? 10 : undefined}
      style={[styles.input, multiline && styles.textArea, !editable && styles.disabledInput]}
    />
  </View>
);

const Section = ({icon, title, children}: any) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionIcon}><AppText size={19} color="#24BFE7" family="InterBold">{icon}</AppText></View>
      <AppText size={17} color="#172451" family="InterBold">{title}</AppText>
    </View>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

const SelectField = ({label, value, options, onSelect}: {label: string; value: string; options: Option[]; onSelect: (option: Option) => void}) => {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');
  const filteredOptions = options.filter(option => option.name.toLowerCase().includes(search.trim().toLowerCase()));
  const close = () => {
    setVisible(false);
    setSearch('');
  };
  return (
    <View style={styles.fieldWrap}>
      <AppText size={11} color="#6E7DA6" family="InterBold" transform="uppercase">{label}</AppText>
      <Pressable style={[styles.selector, visible && styles.openSelector]} onPress={() => visible ? close() : setVisible(true)}>
        <AppText size={14} color={value ? '#26365F' : '#9AA5C0'} family="InterMedium">{value || `Select ${label.toLowerCase()}`}</AppText>
        <AppText size={18} color="#6E7DA6">{visible ? '⌃' : '⌄'}</AppText>
      </Pressable>
      {visible && (
        <View style={styles.inlineDropdown}>
          <View style={styles.searchBox}>
            <AppText size={17} color="#7885A8">⌕</AppText>
            <TextInput
              autoFocus
              allowFontScaling={false}
              value={search}
              onChangeText={setSearch}
              placeholder={`Search ${label.toLowerCase()}`}
              placeholderTextColor="#9AA5C0"
              style={styles.searchInput}
            />
          </View>
          <ScrollView style={styles.optionList} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {filteredOptions.map(option => (
              <Pressable key={option.id} style={styles.optionRow} onPress={() => {onSelect(option); close();}}>
                <AppText size={14} color="#26365F" family="InterMedium">{option.name}</AppText>
              </Pressable>
            ))}
            {!filteredOptions.length && <View style={styles.emptyOptions}><AppText size={14} color="#7885A8">No matching option found</AppText></View>}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const NewComplaint = ({navigation, route}: any) => {
  const complaintId = route.params?.complaintId;
  const isEditing = Boolean(complaintId);
  const [dealers, setDealers] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [receivedThroughOptions, setReceivedThroughOptions] = useState<Option[]>([]);
  const [dealer, setDealer] = useState<Option | null>(null);
  const [alternateNumber, setAlternateNumber] = useState('');
  const [endUser, setEndUser] = useState('');
  const [endUserMobile, setEndUserMobile] = useState('');
  const [technicianMobile, setTechnicianMobile] = useState('');
  const [category, setCategory] = useState<Option | null>(null);
  const [size, setSize] = useState('');
  const [sizeUnit, setSizeUnit] = useState<'MM' | 'Inch'>('MM');
  const [batchNumber, setBatchNumber] = useState('');
  const [receivedThrough, setReceivedThrough] = useState<Option | null>(null);
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState<Asset | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingNumber, setExistingNumber] = useState('');
  const [existingDate, setExistingDate] = useState('');
  const today = new Date();
  const day = String(today.getDate()).padStart(2, '0');
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const complaintNumber = `27/${month}${day}/001`;
  const complaintDate = `${day}/${month}/${today.getFullYear()}`;
  useEffect(() => {
    Promise.all([getComplaintCreateOptions(), complaintId ? getComplaintDetail(complaintId) : Promise.resolve(null)])
      .then(([optionsResponse, detailResponse]) => {
        const data = optionsResponse?.data?.data || {};
        const dealerOptions = data.dealers || [];
        const categoryOptions = data.categories || [];
        const throughOptions = data.receivedThrough || [];
        setDealers(dealerOptions);
        setCategories(categoryOptions);
        setReceivedThroughOptions(throughOptions);
        const detail = detailResponse?.data?.data;
        if (detail) {
          setExistingNumber(detail.complaint_number || '');
          setExistingDate(detail.complaint_date || '');
          setDealer(dealerOptions.find((item: Option) => Number(item.id) === Number(detail.dealer_id)) || null);
          setAlternateNumber(detail.alternate_number || '');
          setEndUser(detail.end_user_name || '');
          setEndUserMobile(detail.end_user_mobile || '');
          setTechnicianMobile(detail.technician_mobile || '');
          setCategory(categoryOptions.find((item: Option) => Number(item.id) === Number(detail.product_category_id)) || null);
          setSize(detail.product_size || '');
          setSizeUnit(detail.size_unit === 'Inch' ? 'Inch' : 'MM');
          setBatchNumber(detail.batch_no_dom || '');
          setDescription(detail.description || '');
          setReceivedThrough(throughOptions.find((item: Option) => Number(item.id) === Number(detail.complaint_received_through_id)) || null);
        }
      })
      .catch(() => Alert.alert('Unable to load form', 'Dealer and category data could not be loaded.'))
      .finally(() => setLoadingOptions(false));
  }, [complaintId]);

  const limitPhone = (setter: (value: string) => void) => (value: string) => setter(value.replace(/\D/g, '').slice(0, 10));
  const pickAttachment = async () => {
    const result = await launchImageLibrary({mediaType: 'photo', selectionLimit: 1, quality: 0.8});
    if (result.assets?.[0]) setAttachment(result.assets[0]);
  };

  const submitComplaint = async () => {
    if (!dealer || !category || !receivedThrough || !description.trim()) {
      Alert.alert('Required fields', 'Please select dealer, product category, complaint received through and enter nature of complaint.');
      return;
    }
    if ([alternateNumber, endUserMobile, technicianMobile].some(number => number && number.length !== 10)) {
      Alert.alert('Invalid mobile number', 'Mobile numbers must contain exactly 10 digits.');
      return;
    }
    const payload = new FormData();
    payload.append('dealer_id', String(dealer.id));
    payload.append('complaint_date', `${today.getFullYear()}-${month}-${day}`);
    payload.append('alternate_number', alternateNumber);
    payload.append('end_user_name', endUser);
    payload.append('end_user_mobile', endUserMobile);
    payload.append('technician_mobile', technicianMobile);
    payload.append('product_category_id', String(category.id));
    payload.append('product_size', size);
    payload.append('size_unit', sizeUnit);
    payload.append('batch_no_dom', batchNumber);
    payload.append('description', description);
    payload.append('complaint_received_through_id', String(receivedThrough.id));
    if (attachment?.uri) payload.append('attachment', {uri: attachment.uri, type: attachment.type || 'image/jpeg', name: attachment.fileName || `complaint-${Date.now()}.jpg`} as any);
    setSubmitting(true);
    try {
      const response = isEditing ? await updateComplaint(complaintId, payload) : await createComplaint(payload);
      const number = response?.data?.data?.complaint_number || response?.data?.complaint_number;
      const warning = response?.data?.warning;
      const successMessage = isEditing ? 'Complaint updated successfully.' : number ? `Complaint ${number} created successfully.` : 'Complaint created successfully.';
      Alert.alert(isEditing ? 'Complaint Updated' : 'Complaint Submitted', warning ? `${successMessage}\n\n${warning}` : successMessage, [{text: 'OK', onPress: () => isEditing ? navigation.pop(2) : navigation.goBack()}]);
    } catch (error: any) {
      const responseData = error?.response?.data;
      const validationErrors = responseData?.errors
        ? Object.values(responseData.errors).flat().join('\n')
        : '';
      Alert.alert(
        'Unable to submit',
        validationErrors || responseData?.message || error?.message || 'Something went wrong. Please try again later.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar backgroundColor={colors.blue} barStyle="light-content" />
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" hitSlop={12} onPress={navigation.goBack}>
          <AppText size={30} color={colors.white} family="InterLight">‹</AppText>
        </Pressable>
        <AppText size={21} color={colors.white} family="InterBold">{isEditing ? 'Edit Complaint' : 'New Complaint'}</AppText>
      </View>

      <ScrollView style={styles.page} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Section icon="#" title="Complaint Info">
          <Field label="Complaint No." value={isEditing ? existingNumber : `For eg. ${complaintNumber}`} editable={false} />
          <Field label="Complaint Date" value={isEditing && existingDate ? existingDate : complaintDate} editable={false} />
        </Section>

        <Section icon="▤" title="Complaint Received From">
          {loadingOptions ? <ActivityIndicator color={colors.blue} /> : <SelectField label="Dealer Name" value={dealer?.name || ''} options={dealers} onSelect={setDealer} />}
          <Field label="Address" value={dealer?.address || ''} editable={false} placeholder="Select a dealer to view address" />
          <Field label="Contact No." value={dealer?.contact || ''} editable={false} placeholder="Select a dealer to view contact" />
          <Field label="Alternate Number" value={alternateNumber} onChangeText={limitPhone(setAlternateNumber)} placeholder="Optional" keyboardType="phone-pad" />
        </Section>

        <Section icon="○" title="End User">
          <Field label="Name" value={endUser} onChangeText={setEndUser} placeholder="Enter end user name" />
          <Field label="Mobile No." value={endUserMobile} onChangeText={limitPhone(setEndUserMobile)} placeholder="Enter 10-digit mobile number" keyboardType="phone-pad" />
        </Section>

        <Section icon="♙" title="Technician">
          <Field label="Mobile No." value={technicianMobile} onChangeText={limitPhone(setTechnicianMobile)} placeholder="Enter 10-digit mobile number" keyboardType="phone-pad" />
        </Section>

        <Section icon="▣" title="Product Details">
          {loadingOptions ? <ActivityIndicator color={colors.blue} /> : <SelectField label="Category" value={category?.name || ''} options={categories} onSelect={setCategory} />}
          <View style={styles.fieldWrap}>
            <AppText size={11} color="#6E7DA6" family="InterBold" transform="uppercase">Size</AppText>
            <View style={styles.sizeRow}>
              <TextInput
                allowFontScaling={false}
                value={size}
                onChangeText={setSize}
                keyboardType="decimal-pad"
                placeholder="e.g. 4"
                placeholderTextColor="#9AA5C0"
                style={[styles.input, styles.sizeInput]}
              />
              {(['MM', 'Inch'] as const).map(unit => (
                <Pressable key={unit} onPress={() => setSizeUnit(unit)} style={[styles.unitButton, sizeUnit === unit && styles.activeUnitButton]}>
                  <AppText size={13} color={sizeUnit === unit ? colors.white : colors.blue} family="InterBold">{unit}</AppText>
                </Pressable>
              ))}
            </View>
          </View>
          <Field label="Batch No. / DOM" value={batchNumber} onChangeText={setBatchNumber} placeholder="Enter batch number or date of manufacture" />
        </Section>

        <Section icon="!" title="Complaint Details">
          <Field label="Nature of Complaint" value={description} onChangeText={setDescription} placeholder="Describe the issue reported by the customer" multiline />
          {loadingOptions ? <ActivityIndicator color={colors.blue} /> : <SelectField label="Complaint Received Through" value={receivedThrough?.name || ''} options={receivedThroughOptions} onSelect={setReceivedThrough} />}
        </Section>

        <Section icon="⌕" title="Attachment">
          {attachment?.uri && (
            <View style={styles.previewWrap}>
              <Image source={{uri: attachment.uri}} style={styles.attachmentPreview} resizeMode="cover" />
              <Pressable accessibilityRole="button" accessibilityLabel="Remove attachment" style={styles.removeAttachment} onPress={() => setAttachment(null)}>
                <AppText size={18} color={colors.white} family="InterBold">×</AppText>
              </Pressable>
            </View>
          )}
          <Pressable style={styles.attachment} onPress={pickAttachment}>
            <AppText size={18} color={colors.blue}>＋</AppText>
            <AppText size={13} color={colors.blue} family="InterSemiBold" numLines={1}>
              {attachment?.fileName || 'Attach photo / document'}
            </AppText>
          </Pressable>
        </Section>

        <Pressable disabled={submitting} style={[styles.submitButton, submitting && styles.disabledButton]} onPress={submitComplaint}>
          {submitting ? <ActivityIndicator color={colors.white} /> : <AppText size={15} color={colors.white} family="InterBold">{isEditing ? 'Update Complaint' : 'Submit Complaint'}</AppText>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: colors.blue},
  header: {height: 66, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, backgroundColor: colors.blue},
  page: {flex: 1, backgroundColor: '#F2F4FA'},
  content: {padding: 18, paddingBottom: 38, gap: 16},
  section: {borderRadius: 16, borderWidth: 1, borderColor: '#D5DDEF', overflow: 'hidden', backgroundColor: colors.white},
  sectionHeader: {height: 68, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, borderBottomWidth: 1, borderBottomColor: '#E4E8F2'},
  sectionIcon: {width: 38, height: 38, borderRadius: 11, borderWidth: 1.5, borderColor: '#24BFE7', backgroundColor: '#EFFBFE', alignItems: 'center', justifyContent: 'center'},
  sectionBody: {padding: 18, gap: 14},
  fieldWrap: {gap: 7},
  input: {minHeight: 48, borderRadius: 11, borderWidth: 1, borderColor: '#C9D3EA', paddingHorizontal: 14, color: '#26365F', fontSize: 14, fontFamily: 'Inter-Regular', backgroundColor: colors.white},
  disabledInput: {color: '#66728F', backgroundColor: '#F6F8FC'},
  textArea: {height: 105, paddingTop: 13, textAlignVertical: 'top'},
  selector: {height: 48, borderRadius: 11, borderWidth: 1, borderColor: '#C9D3EA', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  openSelector: {borderColor: colors.blue},
  sizeRow: {flexDirection: 'row', gap: 9},
  sizeInput: {flex: 1},
  unitButton: {height: 48, minWidth: 62, paddingHorizontal: 12, borderRadius: 11, borderWidth: 1, borderColor: '#C9D3EA', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white},
  activeUnitButton: {borderColor: colors.blue, backgroundColor: colors.blue},
  inlineDropdown: {borderRadius: 11, borderWidth: 1, borderColor: '#C9D3EA', padding: 10, gap: 8, backgroundColor: colors.white, shadowColor: '#172451', shadowOffset: {width: 0, height: 3}, shadowOpacity: 0.12, shadowRadius: 6, elevation: 4},
  searchBox: {height: 46, borderRadius: 11, borderWidth: 1, borderColor: '#C9D3EA', paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8F9FC'},
  searchInput: {flex: 1, height: 44, paddingVertical: 0, color: '#26365F', fontSize: 14, fontFamily: 'Inter-Regular'},
  optionList: {maxHeight: 230},
  optionRow: {minHeight: 46, justifyContent: 'center', paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#E7EAF2'},
  emptyOptions: {height: 70, alignItems: 'center', justifyContent: 'center'},
  attachment: {height: 50, borderRadius: 11, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.blue, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#F6F8FD'},
  previewWrap: {height: 190, borderRadius: 12, overflow: 'hidden', backgroundColor: '#E9EDF6'},
  attachmentPreview: {width: '100%', height: '100%'},
  removeAttachment: {position: 'absolute', top: 9, right: 9, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(23,36,81,0.84)'},
  submitButton: {height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue, shadowColor: '#172451', shadowOffset: {width: 0, height: 4}, shadowOpacity: 0.18, shadowRadius: 7, elevation: 4},
  disabledButton: {opacity: 0.65},
});

export default NewComplaint;
