import DateTimePicker from '@react-native-community/datetimepicker';
import { NavigationProp, ParamListBase, useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, PermissionsAndroid, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { Asset, launchCamera, launchImageLibrary } from 'react-native-image-picker';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import Toast from 'react-native-toast-message';
import { ArrowDownIcon, CalenderIcon } from '../../assets/svgs/SvgsFile';
import { UploadIcon } from '../../assets/svgs/HomePageSvgs';
import AppText from '../../components/AppText/AppText';
import { useAppSelector } from '../../components/redux/Store';
import { createMultipleExpenseApi, getExpenseTypesApi, updateExpenseApi } from '../../api/query/ExpenseApi';
import { colors } from '../../utils/Colors';
import { rw } from '../../utils/responsive';
import { styles } from './styles';

const formatLocalDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const todayIso = () => formatLocalDate(new Date());
const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
const IMAGE_COMPRESSION_STEPS = [
  { dimension: 2048, quality: 80 },
  { dimension: 1600, quality: 65 },
  { dimension: 1280, quality: 50 },
  { dimension: 1024, quality: 35 },
  { dimension: 800, quality: 25 },
  { dimension: 640, quality: 15 },
];
const ALLOWANCE_TYPE = {
  TRAVELLING: '1',
  DAILY: '2',
} as const;

const getPayrollId = (user: any) =>
  user?.payroll_id ||
  user?.payroll?.id ||
  user?.employee_detail?.payroll_id ||
  user?.employee_details?.payroll_id ||
  user?.payrollId;

const normalizeTypes = (payload: any) => {
  const list =
    payload?.data?.data ??
    payload?.data?.expence_types ??
    payload?.expence_types ??
    payload?.data ??
    [];

  return (Array.isArray(list) ? list : []).map((item: any) => ({
    label: item?.name || item?.expenses_type_name || `Expense ${item?.id}`,
    value: item?.id || item?.value,
    rate: item?.rate === false || item?.rate === '' || item?.rate == null ? '0' : String(item.rate),
    allowanceTypeId: item?.allowance_type_id,
    raw: item,
  })).filter((item: any) => item.value);
};

const isTravellingAllowance = (allowanceTypeId?: string | number) =>
  String(allowanceTypeId ?? '') === ALLOWANCE_TYPE.TRAVELLING;

const roundedAmount = (value: any) => String(Math.round(Number(value || 0)));

const normalizeDateForInput = (date: any) => {
  if (!date || typeof date !== 'string') return todayIso();
  if (date.includes('T')) return date.slice(0, 10);
  const parts = date.split('-');
  if (parts.length === 3 && parts[0].length !== 4) return `${parts[2]}-${parts[1]}-${parts[0]}`;
  return date;
};

const normalizeNumericInput = (value: string) => {
  const devanagariDigits = '०१२३४५६७८९';
  const arabicIndicDigits = '٠١٢٣٤٥٦٧٨٩';
  const easternArabicIndicDigits = '۰۱۲۳۴۵۶۷۸۹';
  const normalized = String(value || '')
    .replace(/[०-९]/g, (digit) => String(devanagariDigits.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String(arabicIndicDigits.indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String(easternArabicIndicDigits.indexOf(digit)))
    .replace(/[^0-9.]/g, '');
  const parts = normalized.split('.');

  return parts.length > 1 ? `${parts[0]}.${parts.slice(1).join('')}` : normalized;
};

type ExpenseItem = {
  key: number;
  type: any;
  rate: string;
  startKm: string;
  stopKm: string;
  claimAmount: string;
  note: string;
  attachments: Asset[];
  existingAttachments: any[];
  removedAttachmentIds: Array<string | number>;
};

const emptyExpenseItem = (key: number): ExpenseItem => ({
  key,
  type: null,
  rate: '',
  startKm: '',
  stopKm: '',
  claimAmount: '',
  note: '',
  attachments: [],
  existingAttachments: [],
  removedAttachmentIds: [],
});

const getTotalKm = (item: ExpenseItem) => {
  const start = Number(item.startKm || 0);
  const stop = Number(item.stopKm || 0);
  return stop > start ? stop - start : 0;
};

// Laravel validation errors come back as an object of field => messages.
const getErrorMessage = (message: any, fallback: string) => {
  if (!message) return fallback;
  if (typeof message === 'string') return message;
  const first = Object.values(message)[0];
  return Array.isArray(first) ? String(first[0]) : String(first || fallback);
};

const AddNewExpense = () => {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const route = useRoute<any>();
  const { user } = useAppSelector((state) => state.auth);
  const payrollId = getPayrollId(user);
  const editExpense = route?.params?.expense;
  const isEditMode = !!editExpense?.id;
  const nextKey = useRef(1);

  const [expenseTypes, setExpenseTypes] = useState<any[]>([]);
  const [expenseDate, setExpenseDate] = useState(normalizeDateForInput(editExpense?.date));
  const [nightHalt, setNightHalt] = useState<'1' | '0' | null>(() => {
    const value = editExpense?.night_halt;
    if (value === true || value === 1 || value === '1' || value === 'yes') return '1';
    if (value === false || value === 0 || value === '0' || value === 'no') return '0';
    return null;
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [expenseFrom, setExpenseFrom] = useState(editExpense?.from || '');
  const [expenseTo, setExpenseTo] = useState(editExpense?.to || '');
  const [items, setItems] = useState<ExpenseItem[]>(() => {
    if (!editExpense) return [emptyExpenseItem(0)];
    const files = Array.isArray(editExpense?.expense_image)
      ? editExpense.expense_image
      : editExpense?.expense_image ? [editExpense.expense_image] : [];
    const ids = Array.isArray(editExpense?.image_id)
      ? editExpense.image_id
      : editExpense?.image_id ? [editExpense.image_id] : [];
    return [{
      ...emptyExpenseItem(0),
      type: editExpense?.expenses_type || null,
      rate: normalizeNumericInput(String(editExpense?.rate || '')),
      startKm: normalizeNumericInput(String(editExpense?.start_km || '')),
      stopKm: normalizeNumericInput(String(editExpense?.stop_km || '')),
      claimAmount: normalizeNumericInput(String(editExpense?.claim_amount || '')),
      note: editExpense?.note || '',
      existingAttachments: files.map((uri: string, index: number) => ({
        uri,
        id: ids[index],
        name: `Attachment ${index + 1}`,
      })),
    }];
  });
  const [loading, setLoading] = useState(false);
  const [typesLoading, setTypesLoading] = useState(false);

  const findTypeItem = useCallback(
    (type: any) => expenseTypes.find((item) => String(item.value) === String(type)),
    [expenseTypes],
  );
  const isItemTravelling = useCallback(
    (item: ExpenseItem) => isTravellingAllowance(findTypeItem(item.type)?.allowanceTypeId ?? (isEditMode ? editExpense?.allowance_type_id : undefined)),
    [editExpense?.allowance_type_id, findTypeItem, isEditMode],
  );
  // Travelling claim amount is always km × rate.
  const withAutoClaim = useCallback(
    (item: ExpenseItem) => isItemTravelling(item)
      ? { ...item, claimAmount: roundedAmount(getTotalKm(item) * Number(item.rate || 0)) }
      : item,
    [isItemTravelling],
  );

  const updateItem = (key: number, patch: Partial<ExpenseItem>) => {
    setItems((prev) => prev.map((item) => item.key === key ? withAutoClaim({ ...item, ...patch }) : item));
  };

  const loadExpenseTypes = useCallback(async () => {
    if (!payrollId) {
      setExpenseTypes([]);
      Toast.show({ type: 'error', text1: 'Payroll id not found for expense types' });
      return;
    }

    try {
      setTypesLoading(true);
      const typeRes = await getExpenseTypesApi(payrollId);
      const types = normalizeTypes(typeRes?.data);

      setExpenseTypes(types);
    } catch (error: any) {
      console.log('Expense type error:', error?.response || error);
      Toast.show({ type: 'error', text1: 'Failed to load expense types' });
    } finally {
      setTypesLoading(false);
    }
  }, [payrollId]);

  useEffect(() => {
    loadExpenseTypes();
  }, [loadExpenseTypes]);

  useEffect(() => {
    if (!expenseTypes.length) return;
    setItems((prev) => prev.map((item) => {
      const typeItem = findTypeItem(item.type);
      if (!typeItem) return item;
      return withAutoClaim({ ...item, rate: normalizeNumericInput(String(typeItem.rate || '0')) || '0' });
    }));
  }, [expenseTypes, findTypeItem, withAutoClaim]);

  const addExpenseItem = () => {
    setItems((prev) => [...prev, emptyExpenseItem(nextKey.current++)]);
  };

  const removeExpenseItem = (key: number) => {
    setItems((prev) => prev.filter((item) => item.key !== key));
  };

  const addAttachments = (key: number, files: Asset[]) => {
    setItems((prev) => prev.map((item) => item.key === key ? { ...item, attachments: [...item.attachments, ...files] } : item));
  };

  const prepareFiles = async (files: Asset[]) => {
    const preparedFiles: Asset[] = [];

    for (const file of files) {
      const fileType = String(file.type || '').toLowerCase();
      if (fileType && !ALLOWED_ATTACHMENT_TYPES.includes(fileType)) {
        Toast.show({ type: 'error', text1: `${file.fileName || 'Attachment'} type is not allowed` });
        continue;
      }

      if (!file.fileSize || file.fileSize <= MAX_ATTACHMENT_SIZE) {
        preparedFiles.push(file);
        continue;
      }

      if (!fileType.startsWith('image/') || !file.uri) {
        Toast.show({ type: 'error', text1: `${file.fileName || 'Attachment'} is over 5 MB and cannot be compressed` });
        continue;
      }

      try {
        let compressedFile: Asset | null = null;

        for (const step of IMAGE_COMPRESSION_STEPS) {
          const result = await ImageResizer.createResizedImage(
            file.uri,
            step.dimension,
            step.dimension,
            'JPEG',
            step.quality,
            0,
          );

          compressedFile = {
            ...file,
            uri: result.uri,
            fileSize: result.size,
            width: result.width,
            height: result.height,
            type: 'image/jpeg',
            fileName: `${(file.fileName || `expense-${Date.now()}`).replace(/\.[^/.]+$/, '')}.jpg`,
          };

          if (result.size <= MAX_ATTACHMENT_SIZE) break;
        }

        if (compressedFile && (compressedFile.fileSize || 0) <= MAX_ATTACHMENT_SIZE) {
          preparedFiles.push(compressedFile);
        } else {
          Toast.show({ type: 'error', text1: `${file.fileName || 'Attachment'} could not be compressed below 5 MB` });
        }
      } catch (error) {
        console.log('Expense attachment compression error:', error);
        Toast.show({ type: 'error', text1: `Could not compress ${file.fileName || 'attachment'}` });
      }
    }

    return preparedFiles;
  };

  const pickAttachmentFromGallery = (key: number) => {
    launchImageLibrary({
      mediaType: 'mixed',
      selectionLimit: 0,
    }, async (response) => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        Toast.show({ type: 'error', text1: response.errorMessage });
        return;
      }

      const selectedFiles = response.assets || [];
      const validFiles = await prepareFiles(selectedFiles);

      if (validFiles.length) {
        addAttachments(key, validFiles);
      }
    });
  };

  const pickAttachmentFromCamera = async (key: number) => {
    if (Platform.OS === 'android') {
      const permission = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
      );
      if (permission !== PermissionsAndroid.RESULTS.GRANTED) {
        Toast.show({ type: 'error', text1: 'Camera permission denied' });
        return;
      }
    }

    launchCamera({
      mediaType: 'photo',
      saveToPhotos: false,
    }, async (response) => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        Toast.show({ type: 'error', text1: response.errorMessage });
        return;
      }

      const validFiles = await prepareFiles(response.assets || []);
      if (validFiles.length) {
        addAttachments(key, validFiles);
      }
    });
  };

  const validate = () => {
    const fail = (text1: string) => {
      Toast.show({ type: 'error', text1 });
      return false;
    };

    if (!expenseDate) return fail('Please select expense date');
    if (nightHalt === null) return fail('Please select Night Halt');
    if (!expenseFrom.trim()) return fail('Please enter expense from location');
    if (!expenseTo.trim()) return fail('Please enter expense to location');

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const prefix = items.length > 1 ? `Expense ${index + 1}: ` : '';
      const travelling = isItemTravelling(item);
      if (!item.type) return fail(`${prefix}Please select expense type`);
      if (travelling && (!item.startKm || !item.stopKm || Number(item.stopKm) <= Number(item.startKm))) {
        return fail(`${prefix}Please enter valid start and stop km`);
      }
      if (!item.claimAmount || Number(item.claimAmount) <= 0) return fail(`${prefix}Please enter claim amount`);
      if (!item.note.trim()) return fail(`${prefix}Please enter note`);
      if (travelling && item.attachments.length + item.existingAttachments.length === 0) {
        return fail(`${prefix}At least one expense attachment is required`);
      }
    }
    return true;
  };

  const appendAttachment = (fd: FormData, field: string, attachment: Asset, index: number) => {
    if (!attachment?.uri) return;
    fd.append(field, {
      uri: attachment.uri,
      type: attachment.type || 'image/jpeg',
      name: attachment.fileName || `expense-${Date.now()}-${index}.jpg`,
    } as any);
  };

  const buildUpdatePayload = () => {
    const item = items[0];
    const fd = new FormData();
    fd.append('expense_id', editExpense.id);
    fd.append('expenses_type', item.type);
    fd.append('claim_amount', item.claimAmount);
    fd.append('date', expenseDate);
    fd.append('night_halt', nightHalt as string);
    if (item.startKm) fd.append('start_km', item.startKm);
    if (item.stopKm) fd.append('stop_km', item.stopKm);
    if (isItemTravelling(item)) fd.append('total_km', String(getTotalKm(item)));
    fd.append('from', expenseFrom.trim());
    fd.append('to', expenseTo.trim());
    fd.append('note', item.note.trim());
    item.attachments.forEach((attachment, index) => appendAttachment(fd, 'expense_file[]', attachment, index));
    if (item.removedAttachmentIds.length === 1) {
      fd.append('image_id', String(item.removedAttachmentIds[0]));
    } else {
      item.removedAttachmentIds.forEach((id) => {
        fd.append('image_id[]', String(id));
      });
    }
    return fd;
  };

  const buildCreatePayload = () => {
    const fd = new FormData();
    fd.append('date', expenseDate);
    fd.append('night_halt', nightHalt as string);
    fd.append('from', expenseFrom.trim());
    fd.append('to', expenseTo.trim());
    items.forEach((item, index) => {
      const field = `expenses[${index}]`;
      fd.append(`${field}[expenses_type]`, item.type);
      fd.append(`${field}[claim_amount]`, item.claimAmount);
      if (item.startKm) fd.append(`${field}[start_km]`, item.startKm);
      if (item.stopKm) fd.append(`${field}[stop_km]`, item.stopKm);
      if (isItemTravelling(item)) fd.append(`${field}[total_km]`, String(getTotalKm(item)));
      fd.append(`${field}[note]`, item.note.trim());
      item.attachments.forEach((attachment, fileIndex) => appendAttachment(fd, `${field}[expense_file][]`, attachment, fileIndex));
    });
    return fd;
  };

  const submitExpense = async () => {
    if (!validate() || loading) return;

    try {
      setLoading(true);
      const res = isEditMode ? await updateExpenseApi(buildUpdatePayload()) : await createMultipleExpenseApi(buildCreatePayload());
      if (res?.data?.status === true || res?.data?.status === 'success') {
        Toast.show({ type: 'success', text1: res?.data?.message || (isEditMode ? 'Expense updated' : 'Expense submitted') });
        navigation.goBack();
      } else {
        Toast.show({ type: 'error', text1: getErrorMessage(res?.data?.message, 'Could not save expense') });
      }
    } catch (error: any) {
      console.log('Save expense error:', error?.response || error);
      Toast.show({ type: 'error', text1: getErrorMessage(error?.response?.data?.message, 'Could not save expense') });
    } finally {
      setLoading(false);
    }
  };

  const totalClaim = items.reduce((sum, item) => sum + Number(item.claimAmount || 0), 0);

  const renderExpenseItem = (item: ExpenseItem, index: number) => {
    const travelling = isItemTravelling(item);
    const attachmentCount = item.attachments.length + item.existingAttachments.length;

    return (
      <View key={item.key} style={styles.expenseCard}>
        <View style={styles.sectionContent}>
          {!isEditMode && (
            <View style={[styles.row, styles.expenseCardHeader]}>
              <AppText size={16} color={colors.blue} family="InterBold">Expense {index + 1}</AppText>
              {items.length > 1 && (
                <Pressable hitSlop={8} onPress={() => removeExpenseItem(item.key)}>
                  <AppText size={13} color="#C25050" family="InterSemiBold">Remove</AppText>
                </Pressable>
              )}
            </View>
          )}

          <AppText size={16} color="#000000" family="InterSemiBold">Select Expense Type</AppText>
          <Dropdown
            style={styles.UserBox}
            placeholderStyle={{ color: '#718096', fontSize: 14 }}
            selectedTextStyle={{ color: colors.black, fontSize: 14 }}
            data={expenseTypes}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder={typesLoading ? 'Loading...' : 'Select Expense Type'}
            value={item.type}
            onChange={(typeItem) => {
              const nextRate = normalizeNumericInput(typeItem.rate === false || typeItem.rate === '' || typeItem.rate == null ? '0' : String(typeItem.rate)) || '0';
              updateItem(item.key, {
                type: typeItem.value,
                rate: nextRate,
                startKm: '',
                stopKm: '',
                claimAmount: isTravellingAllowance(typeItem.allowanceTypeId) ? '0' : '',
              });
            }}
            renderRightIcon={() => typesLoading ? <ActivityIndicator size="small" color={colors.blue} /> : <ArrowDownIcon color="#000000" />}
          />

          <AppText size={16} color="#000000" family="InterSemiBold">Rate</AppText>
          <TextInput
            style={[styles.input, styles.disabledInput]}
            placeholder="Rate"
            placeholderTextColor="#718096"
            keyboardType="numeric"
            value={item.rate || '0'}
            editable={false}
          />

          {travelling && (
            <>
              <AppText size={16} color="#000000" family="InterSemiBold">Start Km</AppText>
              <TextInput
                style={styles.input}
                placeholder="km"
                placeholderTextColor="#718096"
                keyboardType="decimal-pad"
                value={item.startKm}
                onChangeText={(text) => updateItem(item.key, { startKm: normalizeNumericInput(text) })}
              />
              <AppText size={16} color="#000000" family="InterSemiBold">Stop Km</AppText>
              <TextInput
                style={styles.input}
                placeholder="km"
                placeholderTextColor="#718096"
                keyboardType="decimal-pad"
                value={item.stopKm}
                onChangeText={(text) => updateItem(item.key, { stopKm: normalizeNumericInput(text) })}
              />
              <AppText size={16} color="#000000" family="InterSemiBold">Total Km</AppText>
              <View style={[styles.UserBox, styles.row]}>
                <AppText size={14} color="#718096" family="InterRegular">{getTotalKm(item)} km</AppText>
              </View>
            </>
          )}

          <AppText size={16} color="#000000" family="InterSemiBold">Claim Amount</AppText>
          <TextInput
            style={[styles.input, travelling && styles.disabledInput]}
            placeholder="₹ 0.00"
            placeholderTextColor="#718096"
            keyboardType="decimal-pad"
            value={item.claimAmount}
            onChangeText={(text) => updateItem(item.key, { claimAmount: normalizeNumericInput(text) })}
            editable={!travelling}
          />

          <AppText size={16} color="#000000" family="InterSemiBold">Note *</AppText>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter note"
            placeholderTextColor="#718096"
            multiline
            value={item.note}
            onChangeText={(text) => updateItem(item.key, { note: text })}
          />
        </View>

        <View style={[styles.sectionContent, { flexDirection: 'row', alignItems: 'center', marginTop: 12 }]}>
          <Pressable style={styles.uploadBox} onPress={() => pickAttachmentFromCamera(item.key)}>
            <UploadIcon width={24} height={24} />
            <AppText size={13} color="#64748B" family="InterMedium">
              Camera
            </AppText>
          </Pressable>
          <Pressable style={styles.uploadBox} onPress={() => pickAttachmentFromGallery(item.key)}>
            <UploadIcon width={24} height={24} />
            <AppText size={13} color="#64748B" family="InterMedium">
              Gallery
            </AppText>
          </Pressable>
          <View style={{ gap: 3, flex: 1 }}>
            <AppText size={16} color="#000000" family="InterSemiBold" horizontal={6} numLines={2}>
              {attachmentCount ? `${attachmentCount} attachment(s) selected` : 'Expense Attachment'}
            </AppText>
            <AppText size={12} color="#C25050" family="InterRegular" horizontal={6}>
              {travelling
                ? 'Required · Images/PDF, max 5 MB each · Large images auto-compressed'
                : 'Images/PDF, max 5 MB each · Large images auto-compressed'}
            </AppText>
          </View>
        </View>
        {attachmentCount > 0 && (
          <View style={styles.sectionContent}>
            {item.existingAttachments.map((file, fileIndex) => (
              <View key={`${file.uri}-${fileIndex}`} style={[styles.row, styles.attachmentRow]}>
                <AppText size={13} color="#000000" family="InterMedium" width="75%" numLines={1}>
                  {file.name || `Attachment ${fileIndex + 1}`}
                </AppText>
                <Pressable onPress={() => updateItem(item.key, {
                  removedAttachmentIds: file.id ? [...item.removedAttachmentIds, file.id] : item.removedAttachmentIds,
                  existingAttachments: item.existingAttachments.filter((_, itemIndex) => itemIndex !== fileIndex),
                })}>
                  <AppText size={13} color="#C25050" family="InterSemiBold">Remove</AppText>
                </Pressable>
              </View>
            ))}
            {item.attachments.map((file, fileIndex) => (
              <View key={`${file.uri}-${fileIndex}`} style={[styles.row, styles.attachmentRow]}>
                <AppText size={13} color="#000000" family="InterMedium" width="75%" numLines={1}>
                  {file.fileName || `Attachment ${fileIndex + 1}`}
                </AppText>
                <Pressable onPress={() => updateItem(item.key, {
                  attachments: item.attachments.filter((_, itemIndex) => itemIndex !== fileIndex),
                })}>
                  <AppText size={13} color="#C25050" family="InterSemiBold">Remove</AppText>
                </Pressable>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={[styles.container, { paddingHorizontal: rw(18), paddingTop: 20 }]} keyboardShouldPersistTaps="handled">
        <View style={styles.sectionContent}>
          <AppText size={16} color="#000000" family="InterSemiBold">Select Expense Date</AppText>
          <Pressable style={[styles.UserBox, styles.row]} onPress={() => setShowDatePicker(true)}>
            <View style={{ flex: 1, flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <CalenderIcon color="#3C3C3C" />
              <AppText size={14} color="#718096" family="InterRegular">{expenseDate}</AppText>
            </View>
            <ArrowDownIcon color="#000000" />
          </Pressable>
          {showDatePicker && (
            <View style={Platform.OS === 'ios' ? styles.iosDatePickerContainer : undefined}>
              <DateTimePicker
                value={expenseDate ? new Date(expenseDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                themeVariant="light"
                maximumDate={new Date()}
                onChange={(_, date) => {
                  if (Platform.OS !== 'ios') {
                    setShowDatePicker(false);
                  }
                  if (date) setExpenseDate(formatLocalDate(date));
                }}
              />
              {Platform.OS === 'ios' && (
                <Pressable style={styles.dateDoneButton} onPress={() => setShowDatePicker(false)}>
                  <AppText size={14} color="white" family="InterSemiBold">Done</AppText>
                </Pressable>
              )}
            </View>
          )}

          <AppText size={16} color="#000000" family="InterSemiBold">Night Halt *</AppText>
          <View style={styles.radioGroup}>
            {([
              { label: 'Yes', value: '1' },
              { label: 'No', value: '0' },
            ] as const).map((option) => (
              <Pressable
                key={option.value}
                style={styles.radioOption}
                onPress={() => setNightHalt(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ checked: nightHalt === option.value }}
              >
                <View style={[styles.radioCircle, nightHalt === option.value && styles.radioCircleSelected]}>
                  {nightHalt === option.value && <View style={styles.radioDot} />}
                </View>
                <AppText size={14} color="#000000" family="InterRegular">{option.label}</AppText>
              </Pressable>
            ))}
          </View>

          <AppText size={16} color="#000000" family="InterSemiBold">From *</AppText>
          <TextInput
            style={styles.input}
            placeholder="Enter starting location"
            placeholderTextColor="#718096"
            value={expenseFrom}
            onChangeText={setExpenseFrom}
            autoCapitalize="words"
          />

          <AppText size={16} color="#000000" family="InterSemiBold">To *</AppText>
          <TextInput
            style={styles.input}
            placeholder="Enter destination"
            placeholderTextColor="#718096"
            value={expenseTo}
            onChangeText={setExpenseTo}
            autoCapitalize="words"
          />
        </View>

        {items.map(renderExpenseItem)}

        {!isEditMode && (
          <>
            <Pressable style={styles.addExpenseButton} onPress={addExpenseItem}>
              <AppText size={15} color={colors.blue} family="InterBold">+ Add Another Expense</AppText>
            </Pressable>
            <View style={[styles.row, styles.totalRow]}>
              <AppText size={15} color="#000000" family="InterSemiBold">Total Claim ({items.length} expense{items.length > 1 ? 's' : ''})</AppText>
              <AppText size={16} color={colors.blue} family="InterBold">₹ {roundedAmount(totalClaim)}</AppText>
            </View>
          </>
        )}

        <Pressable style={styles.buttonView} disabled={loading} onPress={submitExpense}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <AppText color="white" family="InterBold" size={16}>{isEditMode ? 'UPDATE' : items.length > 1 ? `SUBMIT ALL (${items.length})` : 'SUBMIT'}</AppText>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
};

export default AddNewExpense;
