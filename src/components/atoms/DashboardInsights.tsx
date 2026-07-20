import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../AppText/AppText';
import { rw } from '../../utils/responsive';

type ZoneItem = { zone?: string; name?: string; percentage?: number; percent?: number; pct?: number; achievement_percentage?: number };
type HighlightItem = { label?: string; title?: string; description?: string; desc?: string; icon?: string; iconBg?: string };
type AlertItem = { title?: string; description?: string; desc?: string; severity?: 'high' | 'medium' | 'low'; icon?: string };

const STATIC_ZONES: ZoneItem[] = [
  { zone: 'West', pct: 59 },
  { zone: 'East', pct: 55 },
  { zone: 'North', pct: 52 },
  { zone: 'South', pct: 51 },
  { zone: 'Central', pct: 50 },
];

const STATIC_HIGHLIGHTS: HighlightItem[] = [
  { label: 'Gradation Of The Month', title: 'Ramesh Kumar — Rating 95%', desc: 'Top performer across all zones · MTD', iconBg: '#3fb6e0', icon: '📌' },
  { label: 'Top Customer', title: 'Shree Balaji Traders', desc: 'Highest order value MTD — ₹4.8 L', iconBg: '#4a4ab0', icon: '🏬' },
  { label: 'Special Offer', title: 'Monsoon Dealer Bonanza', desc: 'Extra 2% incentive on HDPE Pipe orders this month', iconBg: '#eb9b1e', icon: '➤' },
  { label: 'Milestone', title: '10+ customers onboarded', desc: 'Crossed a new customer milestone this quarter', iconBg: '#1fb87a', icon: '★' },
  { label: 'New Launch', title: 'uPVC UDS pipe — now in West zone', desc: 'Available for order starting this week', iconBg: '#2f8fe0', icon: '🖥️' },
  { label: 'Product Of The Month', title: 'F4.0"(110mm) Sprinkler Irrigation System', desc: '220 units sold MTD — highest selling SKU', iconBg: '#d6634a', icon: '📊' },
  { label: 'Fastest Growing Zone', title: 'West zone — up 24% MTD', desc: 'Best zone-on-zone growth this month', iconBg: '#0e9f8f', icon: '📈' },
];

const STATIC_ALERTS: AlertItem[] = [
  { title: 'High Mis Punch — West Zone', desc: '5 mis-punches recorded today, most from West zone. Needs immediate review.', severity: 'high', icon: '⚠️' },
  { title: 'South Zone Lagging On Target', desc: 'Only 34% of MTD target achieved with 14 days left in the month.', severity: 'high', icon: '⚠️' },
  { title: 'Inactive Customers Rising', desc: '8 customers have placed no order in the last 30 days — churn risk.', severity: 'medium', icon: '🔴' },
  { title: 'High Outstanding Dues', desc: '₹12.40 L outstanding from 9 customers, overdue by 30+ days.', severity: 'high', icon: '₹' },
  { title: 'Low Visit Compliance', desc: 'Only 62% of planned customer visits completed this week across zones.', severity: 'medium', icon: '📍' },
];

export const ZonePerformanceCard = ({ data }: { data: any }) => {
  const zones: ZoneItem[] = data?.zone_performance_mtd?.length ? data.zone_performance_mtd : data?.zone_performance?.length ? data.zone_performance : STATIC_ZONES;
  const sorted = [...zones].sort((a, b) =>
    (b.percentage ?? b.percent ?? b.pct ?? b.achievement_percentage ?? 0) -
    (a.percentage ?? a.percent ?? a.pct ?? a.achievement_percentage ?? 0),
  );

  return (
    <View style={styles.card}>
      <>
          <View style={styles.topZone}>
            <View style={styles.icon}><AppText size={18}>🏆</AppText></View>
            <View style={{ flex: 1 }}>
              <AppText size={11} color="#6b7280" family="InterMedium">Top Performing Zone</AppText>
              <AppText size={14} color="#1f2437" family="InterSemiBold">
                {sorted[0]?.zone || sorted[0]?.name} Zone — {sorted[0]?.percentage ?? sorted[0]?.percent ?? sorted[0]?.pct ?? sorted[0]?.achievement_percentage ?? 0}% MTD Achievement
              </AppText>
            </View>
          </View>
          {sorted.map((item, index) => {
            const value = Math.max(0, Math.min(100, Number(item.percentage ?? item.percent ?? item.pct ?? item.achievement_percentage ?? 0)));
            return (
              <View key={`${item.zone || item.name}-${index}`} style={styles.zoneRow}>
                <View style={styles.rowBetween}>
                  <View style={styles.row}>
                    <View style={[styles.rank, index === 0 && styles.rankTop]}><AppText size={11} color="white" family="InterSemiBold">{index + 1}</AppText></View>
                    <AppText size={13} color="#1f2437" family="InterSemiBold">{item.zone || item.name}</AppText>
                  </View>
                  <AppText size={13} color={index === 0 ? '#1f8a4c' : '#3b478c'} family="InterSemiBold">{value}%</AppText>
                </View>
                <View style={styles.track}><View style={[styles.fill, { width: `${value}%`, backgroundColor: index === 0 ? '#1f8a4c' : '#8b93ff' }]} /></View>
              </View>
            );
          })}
      </>
    </View>
  );
};

export const DashboardHighlights = ({ data }: { data: any }) => {
  const highlights: HighlightItem[] = data?.highlights?.length ? data.highlights : data?.dashboard_highlights?.length ? data.dashboard_highlights : STATIC_HIGHLIGHTS;
  return (
    <View>
      {highlights.map((item, index) => (
        <View key={`${item.title}-${index}`} style={styles.highlightCard}>
          <View style={[styles.icon, { backgroundColor: item.iconBg || '#0e9f8f' }]}><AppText size={16}>{item.icon || '↗'}</AppText></View>
          <View style={{ flex: 1 }}>
            {!!item.label && <AppText size={10} color="#8a8fa3" family="InterSemiBold">{item.label.toUpperCase()}</AppText>}
            <AppText size={14} color="#1f2437" family="InterSemiBold">{item.title}</AppText>
            <AppText size={12} color="#6b7280">{item.description || item.desc}</AppText>
          </View>
        </View>
      ))}
    </View>
  );
};

export const DashboardAlerts = ({ data }: { data: any }) => {
  const alerts: AlertItem[] = data?.alerts?.length ? data.alerts : data?.dashboard_alerts?.length ? data.dashboard_alerts : STATIC_ALERTS;
  return (
    <View>
      {alerts.map((item, index) => {
        const severity = item.severity || 'low';
        const color = severity === 'high' ? '#d5453f' : severity === 'medium' ? '#e0942f' : '#3b6fc9';
        const soft = severity === 'high' ? '#fbe7e6' : severity === 'medium' ? '#fbeedd' : '#e6eefb';
        return (
          <View key={`${item.title}-${index}`} style={[styles.alertCard, { borderLeftColor: color }]}>
            <View style={[styles.icon, { backgroundColor: soft }]}><AppText size={16}>{item.icon || '!'}</AppText></View>
            <View style={{ flex: 1 }}>
              <View style={styles.rowBetween}>
                <AppText size={13} color="#1f2437" family="InterSemiBold" style={{ flex: 1 }}>{item.title}</AppText>
                <View style={[styles.severity, { backgroundColor: soft }]}><AppText size={9} color={color} family="InterSemiBold">{severity.toUpperCase()}</AppText></View>
              </View>
              <AppText size={12} color="#6b7280">{item.description || item.desc}</AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { marginHorizontal: rw(19), marginTop: rw(12), backgroundColor: 'white', borderRadius: 16, padding: rw(18), shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 },
  topZone: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#e6f6ec', borderRadius: 12, padding: 12, marginBottom: 18 },
  icon: { width: 38, height: 38, borderRadius: 11, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  zoneRow: { marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rank: { width: 22, height: 22, borderRadius: 7, backgroundColor: '#8b93ff', alignItems: 'center', justifyContent: 'center' },
  rankTop: { backgroundColor: '#1f8a4c' },
  track: { height: 6, borderRadius: 99, backgroundColor: '#e3e5ee', marginTop: 7, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 99 },
  highlightCard: { marginHorizontal: rw(19), marginTop: rw(10), backgroundColor: 'white', borderRadius: 14, padding: 14, flexDirection: 'row', gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  alertCard: { marginHorizontal: rw(19), marginTop: rw(10), backgroundColor: 'white', borderRadius: 12, padding: 14, borderLeftWidth: 4, flexDirection: 'row', gap: 12 },
  severity: { borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2, marginLeft: 8 },
});
