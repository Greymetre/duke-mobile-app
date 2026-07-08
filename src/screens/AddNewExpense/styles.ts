

import { Platform, StyleSheet } from "react-native";
import { rw } from "../../utils/responsive";
import { colors } from "../../utils/Colors";

export const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    sectionContent: {
        backgroundColor: '#fff',
        paddingHorizontal: rw(10),
        paddingVertical: rw(10),
        marginTop: rw(4),
        borderRadius: 8,
        shadowOffset: { width: 4, height: 5 },
        shadowColor: Platform.OS == "ios" ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.1)',
        shadowOpacity: 1,
        shadowRadius: 5,
        elevation: 8,
    },
    row: {
        flexDirection: "row",
        alignItems: "center"
    },
    UserBox: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#CBD5E0",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 14,
        marginVertical:10
    },
    uploadBox: {
        height: 69,
        width: 150,
        borderWidth: 2,
        borderColor: 'rgba(57, 82, 153, 1)',
        borderStyle: 'dashed',
        backgroundColor: 'rgba(57, 82, 153, 0.1)',
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection:'row',
        gap: 6,
        marginTop: rw(14),
        marginHorizontal:5
    },
    buttonView: {
        backgroundColor: colors.blue,
        width: '100%',
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 6,
        marginTop: 15,
        marginBottom:50
    },
})