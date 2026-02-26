import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOW } from '../theme';
import { Spinner, EmptyState, Divider } from '../components/UIComponents';
import { getDailyReport, getWeeklyReport, getMonthlyReport, uploadAdoDump } from '../services/api';

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color || COLORS.accent }]}>
      <Text style={styles.statValue}>{value ?? '—'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Simple horizontal bar ─────────────────────────────────────────────────────
function BarRow({ label, value, maxValue, color }) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel} numberOfLines={1}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: color || COLORS.accent }]} />
      </View>
      <Text style={styles.barValue}>{value}</Text>
    </View>
  );
}

// ── Tab button ────────────────────────────────────────────────────────────────
function TabBtn({ label, active, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.tab, active && styles.tabActive]}
      onPress={onPress}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Daily report view ─────────────────────────────────────────────────────────
function DailyView({ data }) {
  if (!data) return <EmptyState message="No daily data." />;
  const { summary = {}, states = {}, types = {}, priorities = {}, tasks = [] } = data;
  const stateMax   = Math.max(...Object.values(states),   1);
  const typeMax    = Math.max(...Object.values(types),    1);
  const stateColors= { New: COLORS.stateNew, Active: COLORS.stateActive, Resolved: COLORS.stateResolved, Closed: COLORS.stateClosed };
  const typeColors = { Epic: COLORS.typeEpic, Feature: COLORS.typeFeature, 'User Story': COLORS.typeStory, Task: COLORS.typeTask, Bug: COLORS.typeBug };

  return (
    <ScrollView contentContainerStyle={styles.reportBody} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Summary</Text>
      <View style={styles.statRow}>
        <StatCard label="Total"    value={summary.total}    color={COLORS.accent} />
        <StatCard label="Active"   value={summary.active}   color={COLORS.stateActive} />
        <StatCard label="Resolved" value={summary.resolved} color={COLORS.stateResolved} />
        <StatCard label="Closed"   value={summary.closed}   color={COLORS.stateClosed} />
      </View>

      <Divider />
      <Text style={styles.sectionTitle}>By State</Text>
      {Object.entries(states).map(([k, v]) => (
        <BarRow key={k} label={k} value={v} maxValue={stateMax} color={stateColors[k]} />
      ))}

      <Divider />
      <Text style={styles.sectionTitle}>By Type</Text>
      {Object.entries(types).map(([k, v]) => (
        <BarRow key={k} label={k} value={v} maxValue={typeMax} color={typeColors[k]} />
      ))}

      {tasks.length > 0 && (
        <>
          <Divider />
          <Text style={styles.sectionTitle}>Delayed Tasks ({tasks.filter(t => t.delayed).length})</Text>
          {tasks.filter(t => t.delayed).slice(0, 10).map(t => (
            <View key={t.task_id} style={styles.taskRow}>
              <Text style={styles.taskId}>{t.task_id}</Text>
              <Text style={styles.taskTitle} numberOfLines={1}>{t.title}</Text>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

// ── Weekly report view ────────────────────────────────────────────────────────
function WeeklyView({ data }) {
  if (!data) return <EmptyState message="No weekly data." />;
  const { summary = {}, sprint_breakdown = [], velocity = {} } = data;
  const maxSp = Math.max(...(sprint_breakdown.map(s => s.story_points || 0)), 1);

  return (
    <ScrollView contentContainerStyle={styles.reportBody} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Sprint Velocity</Text>
      <View style={styles.statRow}>
        <StatCard label="Completed SP" value={velocity.completed_sp}  color={COLORS.stateResolved} />
        <StatCard label="Remaining SP" value={velocity.remaining_sp}  color={COLORS.stateActive}   />
        <StatCard label="Total Items"  value={summary.total}           color={COLORS.accent}        />
      </View>

      {sprint_breakdown.length > 0 && (
        <>
          <Divider />
          <Text style={styles.sectionTitle}>By Sprint</Text>
          {sprint_breakdown.map((s, i) => (
            <BarRow key={i} label={s.sprint || 'Unassigned'} value={s.story_points || 0} maxValue={maxSp} color={COLORS.accent} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

// ── Monthly report view ───────────────────────────────────────────────────────
function MonthlyView({ data }) {
  if (!data) return <EmptyState message="No monthly data." />;
  const { summary = {}, monthly_trend = [], carry_forward = [] } = data;
  const maxItems = Math.max(...(monthly_trend.map(m => m.count || 0)), 1);

  return (
    <ScrollView contentContainerStyle={styles.reportBody} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Monthly Overview</Text>
      <View style={styles.statRow}>
        <StatCard label="Total"       value={summary.total}        color={COLORS.accent} />
        <StatCard label="Carry Fwd"   value={carry_forward.length} color={COLORS.warning} />
        <StatCard label="Avg Cycle"   value={summary.avg_cycle_time ? summary.avg_cycle_time.toFixed(1) + 'd' : '—'} color={COLORS.info} />
      </View>

      {monthly_trend.length > 0 && (
        <>
          <Divider />
          <Text style={styles.sectionTitle}>Monthly Trend</Text>
          {monthly_trend.map((m, i) => (
            <BarRow key={i} label={m.month || `Month ${i+1}`} value={m.count || 0} maxValue={maxItems} color={COLORS.accent} />
          ))}
        </>
      )}
    </ScrollView>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
const TABS = ['Daily', 'Weekly', 'Monthly'];

export default function ReportsScreen() {
  const [activeTab,  setActiveTab]  = useState('Daily');
  const [data,       setData]       = useState({ Daily: null, Weekly: null, Monthly: null });
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading,  setUploading]  = useState(false);

  const loadTab = useCallback(async (tab, isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const fetchers = { Daily: getDailyReport, Weekly: getWeeklyReport, Monthly: getMonthlyReport };
      const result = await fetchers[tab]();
      setData(prev => ({ ...prev, [tab]: result }));
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => {
    if (!data[activeTab]) loadTab(activeTab);
  }, [activeTab, loadTab]));

  function switchTab(tab) {
    setActiveTab(tab);
    if (!data[tab]) loadTab(tab);
  }

  async function handleImport() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'application/json',
               'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
               'application/vnd.ms-excel'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const file = result.assets[0];

      setUploading(true);
      await uploadAdoDump(file);
      Alert.alert('Import complete', 'ADO dump imported successfully.');
      // Refresh all report data
      setData({ Daily: null, Weekly: null, Monthly: null });
      loadTab(activeTab, false);
    } catch (e) {
      Alert.alert('Import failed', e.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.container}>
      {/* Header with import button */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Reports</Text>
        <TouchableOpacity
          style={[styles.importBtn, uploading && styles.importBtnDisabled]}
          onPress={handleImport}
          disabled={uploading}
        >
          <Text style={styles.importBtnText}>{uploading ? 'Importing…' : '⬆ Import ADO'}</Text>
        </TouchableOpacity>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TabBtn key={tab} label={tab} active={activeTab === tab} onPress={() => switchTab(tab)} />
        ))}
      </View>

      {/* Content */}
      {loading && !data[activeTab]
        ? <Spinner />
        : activeTab === 'Daily'   ? <DailyView   data={data.Daily}   />
        : activeTab === 'Weekly'  ? <WeeklyView  data={data.Weekly}  />
        :                           <MonthlyView data={data.Monthly} />
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.sizeLg, fontWeight: TYPOGRAPHY.weightSemibold },
  importBtn:   { backgroundColor: COLORS.surfaceAlt, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.sm },
  importBtnDisabled: { opacity: 0.5 },
  importBtnText:     { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.sizeSm },

  // Tabs
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab:    { flex: 1, paddingVertical: SPACING.sm, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive:    { borderBottomColor: COLORS.accent },
  tabText:      { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sizeSm, fontWeight: TYPOGRAPHY.weightMedium },
  tabTextActive:{ color: COLORS.accent,         fontWeight: TYPOGRAPHY.weightSemibold },

  // Report body
  reportBody: { padding: SPACING.lg, gap: SPACING.sm },
  sectionTitle:{ color: COLORS.textPrimary, fontSize: TYPOGRAPHY.sizeMd, fontWeight: TYPOGRAPHY.weightSemibold, marginBottom: SPACING.xs },

  // Stat cards
  statRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  statCard: {
    flex: 1, minWidth: 80,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    padding: SPACING.md, borderLeftWidth: 3,
    ...SHADOW.card,
  },
  statValue:{ color: COLORS.textPrimary, fontSize: TYPOGRAPHY.size2xl, fontWeight: TYPOGRAPHY.weightBold },
  statLabel:{ color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sizeXs, marginTop: 2 },

  // Bar chart rows
  barRow:   { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.xs },
  barLabel: { width: 80, color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sizeSm },
  barTrack: { flex: 1, height: 10, backgroundColor: COLORS.surfaceAlt, borderRadius: RADIUS.full, overflow: 'hidden' },
  barFill:  { height: 10, borderRadius: RADIUS.full },
  barValue: { width: 30, color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sizeSm, textAlign: 'right' },

  // Task rows
  taskRow:  { flexDirection: 'row', gap: SPACING.sm, paddingVertical: SPACING.xs },
  taskId:   { color: COLORS.textMuted, fontSize: TYPOGRAPHY.sizeXs, fontFamily: TYPOGRAPHY.fontMono, width: 70 },
  taskTitle:{ flex: 1, color: COLORS.textPrimary, fontSize: TYPOGRAPHY.sizeSm },
});
