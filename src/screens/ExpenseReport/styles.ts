import { StyleSheet } from "react-native";
import { colors } from "../../utils/Colors";
import { rw } from "../../utils/responsive";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.offWHite
    },
    row: {
        flexDirection: "row",
        alignItems: "center"
    },
    UserBox: {
        flex: 0.5,
        height: 48,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(203, 213, 224, 1)",
        backgroundColor: "rgba(57, 82, 153, 0.07)",
        paddingHorizontal: 14
    },
    dateTimeBox: {
        height: 48,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "rgba(203, 213, 224, 1)",
        backgroundColor: "rgba(57, 82, 153, 0.07)",
        paddingHorizontal: 14,
        flex: 1

    },
    calenderICon: {
        height: 32,
        width: 32,
        backgroundColor: 'white',
        borderColor: "#CBD5E0",
        borderWidth: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    approveSubmitBox: {
        marginVertical: 15,
        height: 74,
        borderRadius: 10,
        backgroundColor: 'white',
        paddingHorizontal: 10,
        justifyContent: 'space-between',
    },
    approveView: {
        gap: 10
    },
    fab: {
        position: 'absolute',
        bottom: 40,
        right: 20,
        height: 60,
        width: 60,
        borderRadius: 30,
        backgroundColor: colors.blue,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 5,
    },
    circle: {
        height: 29,
        width: 29,
        borderRadius: 15,
        borderColor: '#339D4F',
        borderWidth: 2,
        padding: 6
    },
    circleInner: {

        backgroundColor: 'transparent',
        height: 18,
        width: 18,
        borderRadius: 12,
        overflow:'hidden'
    },
    todayContainer: {
        marginTop: rw(16),
    },
    todayInput: {
        height: rw(45),
        borderWidth: 1,
        borderColor: '#CBD5E0',
        borderRadius: rw(8),
        paddingHorizontal: rw(12),
        marginTop: rw(12),
        backgroundColor: '#FFFFFF',
        textAlignVertical: 'top',
    },
    submit: {
        paddingHorizontal: 15,
        height: 34,
        borderRadius: 6,
        backgroundColor: colors.blue,
    },
    listItem: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 15,
        marginBottom: 10
    },
    line: {
        width: "100%",
        height: 1,
        backgroundColor: "#D9D9D9",
        marginVertical: 16
    },
    firstPunchIN: {
        flex: 0.32,
        gap: 8
    },
    modalcontainer: {
        backgroundColor: 'rgba(0,0,0,0.8)',
        flex: 1
    },
    modalheader: {
        height: 61,
        backgroundColor: colors.blue,
        width: "100%",
        overflow: 'hidden',
        zIndex: 10,
        marginTop: -14,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        justifyContent: 'center',
        paddingHorizontal: 20

    },
    mainOCntainer: {
        width: "86%",
        paddingTop: 20,
        paddingHorizontal: 20,
        backgroundColor: colors.white
    },
    buttonView: {
        backgroundColor: colors.blue,
        width: '100%',
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
        marginTop: 10
    },
    firstViewModal: {
        flex: 0.55,
        gap: 4
    },
    approveRejectView: {
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 28,
        marginBottom: 20
    },
    selectUser: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(203, 213, 224, 1)",
        backgroundColor: 'rgba(57, 82, 153, 0.07)',
        height: 48,
        marginTop: 12,
        paddingHorizontal: 14
    },
    done:{
        backgroundColor: colors.blue,
        paddingHorizontal: 6,
        height: 45,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
});