import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOW } from '../theme';
import { KANBAN_COLUMNS, STATES, getTypeInfo, getPriorityInfo } from '../constants';
import { TypeBadge, StatePill, Avatar, Spinner, EmptyState } from '../components/UIComponents';
import WorkItemModal from '../components/WorkItemModal';
import { getWorkItems, createWorkItem, updateTaskStatus } from '../services/api';

// ── Card ──────────────────────────────────────────────────────────────────────
function KanbanCard({ item, onPress }) {
  const typeInfo = getTypeInfo(item.work_item_type);
  const priInfo  = getPriorityInfo(item.priority);

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(item)} activeOpacity={0.8}>
      <View style={styles.cardHeader}>
        <TypeBadge type={item.work_item_type} size="sm" />
        <View style={[styles.priDot, { backgroundColor: priInfo.color }]} />
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      {item.task_id && <Text style={styles.cardId}>{item.task_id}</Text>}
      <View style={styles.cardFooter}>
        {item.assigned_to ? <Avatar name={item.assigned_to} size={22} /> : null}
        {item.story_points ? (
          <View style={styles.spBadge}>
            <Text style={styles.spText}>{item.story_points} pts</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

// ── Column ────────────────────────────────────────────────────────────────────
function KanbanColumn({ state, items, onCardPress }) {
  const info  = STATES.find(s => s.value === state);
  const count = items.length;

  return (
    <View style={styles.column}>
      {/* Column header */}
      <View style={[styles.colHeader, { borderTopColor: info.color }]}>
        <Text style={[styles.colTitle, { color: info.color }]}>{state}</Text>
        <View style={[styles.countBadge, { backgroundColor: info.color + '33' }]}>
          <Text style={[styles.countText, { color: info.color }]}>{count}</Text>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={i => String(i.id)}
        renderItem={({ item }) => <KanbanCard item={item} onPress={onCardPress} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.colList}
        ListEmptyComponent={<Text style={styles.emptyCol}>No items</Text>}
      />
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function BoardsScreen() {
  const [items,       setItems]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editItem,    setEditItem]    = useState(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await getWorkItems();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function onCardPress(item) {
    setEditItem(item);
    setModalVisible(true);
  }

  async function handleMoveState(item, newState) {
    try {
      await updateTaskStatus(item.task_id, { state: newState });
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, state: newState } : i));
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  }

  async function handleSave(payload, isEdit) {
    if (isEdit) {
      await updateTaskStatus(editItem.task_id, payload);
    } else {
      await createWorkItem(payload);
    }
    await load();
  }

  if (loading) return <Spinner />;

  const byState = KANBAN_COLUMNS.reduce((acc, col) => {
    acc[col] = items.filter(i => i.state === col);
    return acc;
  }, {});

  return (
    <View style={styles.container}>
      {/* Add button */}
      <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>Sprint Board</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => { setEditItem(null); setModalVisible(true); }}
        >
          <Text style={styles.addBtnText}>+ New Item</Text>
        </TouchableOpacity>
      </View>

      {/* Horizontal scroll of columns */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.accent} />
        }
        contentContainerStyle={styles.board}
      >
        {KANBAN_COLUMNS.map(col => (
          <KanbanColumn
            key={col}
            state={col}
            items={byState[col] || []}
            onCardPress={onCardPress}
          />
        ))}
      </ScrollView>

      <WorkItemModal
        visible={modalVisible}
        item={editItem}
        onClose={() => setModalVisible(false)}
        onSave={handleSave}
      />
    </View>
  );
}

const COLUMN_WIDTH = 240;

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.bg },

  toolbar: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  toolbarTitle:{ color: COLORS.textPrimary, fontSize: TYPOGRAPHY.sizeLg, fontWeight: TYPOGRAPHY.weightSemibold },
  addBtn:      { backgroundColor: COLORS.accent, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.sm },
  addBtnText:  { color: COLORS.white, fontSize: TYPOGRAPHY.sizeSm, fontWeight: TYPOGRAPHY.weightSemibold },

  board:       { padding: SPACING.lg, gap: SPACING.md, alignItems: 'flex-start' },

  column: {
    width:           COLUMN_WIDTH,
    backgroundColor: COLORS.surface,
    borderRadius:    RADIUS.md,
    borderWidth:     1,
    borderColor:     COLORS.border,
    maxHeight:       '100%',
    ...SHADOW.card,
  },
  colHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    borderTopWidth:    3,
    borderTopLeftRadius:  RADIUS.md,
    borderTopRightRadius: RADIUS.md,
  },
  colTitle:   { fontSize: TYPOGRAPHY.sizeMd, fontWeight: TYPOGRAPHY.weightSemibold },
  countBadge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full },
  countText:  { fontSize: TYPOGRAPHY.sizeXs, fontWeight: TYPOGRAPHY.weightBold },
  colList:    { padding: SPACING.sm, gap: SPACING.sm },
  emptyCol:   { color: COLORS.textMuted, fontSize: TYPOGRAPHY.sizeSm, textAlign: 'center', padding: SPACING.md },

  // Card
  card: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth:     1,
    borderColor:     COLORS.border,
    borderRadius:    RADIUS.md,
    padding:         SPACING.sm,
    gap:             SPACING.xs,
    ...SHADOW.card,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priDot:     { width: 8, height: 8, borderRadius: 4 },
  cardTitle:  { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.sizeSm, fontWeight: TYPOGRAPHY.weightMedium, lineHeight: 18 },
  cardId:     { color: COLORS.textMuted,   fontSize: TYPOGRAPHY.sizeXs, fontFamily: TYPOGRAPHY.fontMono },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.xs },
  spBadge:    { backgroundColor: COLORS.bg, borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 1 },
  spText:     { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sizeXs },
});
