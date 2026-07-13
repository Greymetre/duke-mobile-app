import { StyleProp, TextStyle } from "react-native";

export type ParamList = {
  HomeScreen: {
    from: string | any;
  }
};

export type TopTabNameProps = {
  focused: boolean;
  tabName: string;
};

export type RootStackParamList = {
  LoginScreen: undefined;
  SignUpScreen: undefined;
  AccountPendingScreen: undefined;
  CustomerDetails: undefined;
  TourPlanPage: undefined;
  ForceUpdateScreen: undefined;
  CreatePlan: undefined;
  BottomTab: undefined;
  CustomerList: {
    type?: string;
    beatId?: string | number;
    customerTypeId?: string | number;
    customerTypeName?: string;
  } | undefined;
  AddCustomer:{
    customer?: any;
    customerTypeId?: string | number;
    customerTypeName?: string;
  } | undefined;
  AttendanceReport:undefined;
  ExpenseReport:undefined;
  ExpenseDetails:{
    expense?: any;
    expense_id?: string | number;
    mode?: 'my' | 'approval';
  } | undefined;
  UserActivityPage:undefined;
  ProductCatalogue:undefined;
  SubmitOrder:undefined;
  AddNewExpense:{
    expense?: any;
  } | undefined;
  AttendanceScreen:undefined;
  AddSecondaryCustomer:{
    customer?: any;
    type?: string;
    customerTypeId?: string | number;
    customerTypeName?: string;
  } | undefined;
  VisitReport:undefined;
  UserTourList:undefined;
  BeatCustomerList:undefined;
  OrderHistoryDetailsScreen:undefined
  Reports:undefined
  OrderListDetails:undefined
  IndividualPage:undefined
  AttendanceViewAllScreen:undefined
  TargetArchieViewAllScreen:undefined
  RetailersPerformanceViewAllScreen:undefined
};

export type AppTextProps = {
  size?: number,
  color?: string,
  family?: 'InterBlack' | 'InterBold' | 'InterExtraBold' | 'InterExtraLight' | 'InterLight' | "InterMedium" | 'InterRegular' | 'InterSemiBold' | 'InterThin'
  align?: 'left' | 'center' | 'right' | 'justify'
  transform?: 'capitalize' | 'lowercase' | 'uppercase' | 'none'
  numLines?: number
  children?: React.ReactNode | React.ReactNode[]
  testID?: string,
  animateValue?: any,
  customColor?: string,
  spacing?: number | string | any,
  horizontal?: number | string | any,
  underlineColor?: string,
  underline?: 'underline' | 'line-through' | 'none' | 'underline line-through'
  textDecorationStyle?: 'dashed' | 'dotted' | 'solid' | 'double'
  onPress?: () => void,
  handleTextLayout?: (e: any) => void,
  dotMode?: 'head' | 'tail' | 'middle' | 'clip'
  width?: number | string | any
  maxWidth?: number | string | any
  opacity?: number | string | any
  lineHeight?: number | string | any
  fontStyle?: any
  style?: StyleProp<TextStyle>;
}

export type loginParmas ={
  username: any
  password: any
  app_version?: any
  device_name?: any
  device_type?: any
}

export type signupParmas ={
  name: any
  mobile: any
  email: any
  password: any
}
