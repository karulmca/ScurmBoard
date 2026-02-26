import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, TextInput,
  StyleSheet, RefreshControl, Alert, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme';
import { WORK_ITEM_TYPES, STATES, getTypeInfo, getStateInfo, getPriorityInfo } from '../constants';
import { TypeBadge, StatePill, Avatar, Spinner, EmptyState } from '../components/UIComponents';
import WorkItemModal from '../components/WorkItemModal';
import { getWorkItems, createWorkItem, deleteWorkItem, updateTaskStatus } from '../services/api';

// ── Filter chips ──────────────────────────────────────────────────────────────
function FilterChips({ label, options, active, onSelect }) {
  return (
    <View style={styles.chipGroup}>
      <Text style={styles.chipGroupLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.chip, active === '' && styles.chipActive]}
          onPress={() => onSelect('')}
        >
          <Text style={[styles.chipText, active === '' && styles.chipTextActive]}>All</Text>
        </TouchableOpacity>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, active === opt.value && styles.chipActive, { borderColor: opt.color }]}
            onPress={() => onSelect(opt.value === active ? '' : opt.value)}
          >
            <Text style={[styles.chipText, active === opt.value && { color: opt.color }]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// ── Work item row ─────────────────────────────────────────────────────────────
function WorkItemRow({ item, onEdit, onDelete }) {
  return (
    <TouchableOpacity style={styles.row} onPress={() => onEdit(item)} activeOpacity={0.8}>
      <View style={styles.rowLeft}>
        <TypeBadge type={item.work_item_type} size="sm" />
        <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.rowId}>{item.task_id}</Text>
      </View>
      <View style={styles.rowRight}>
        <StatePill state={item.state} />
        {item.assigned_to ? <Avatar name={item.assigned_to} size={22} /> : null}
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(item)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function WorkItemsScreen() {
  const [items,      setItems]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [stateFilter,setStateFilter]= useState('');
  const [modal,      setModal]      = useState({ visible: false, item: null });

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await getWorkItems();
      setItems(Array.isArray(data) ? data : []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter(i => {
      if (typeFilter  && i.work_item_type !== typeFilter)  return false;
      if (stateFilter && i.state          !== stateFilter) return false;
      if (q && !(i.title?.toLowerCase().includes(q) || i.task_id?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [items, typeFilter, stateFilter, search]);

  function handleDelete(item) {
    Alert.alert('Delete', `Delete "${item.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await deleteWorkItem(item.task_id); await load(); }
          catch (e) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  }

  async function handleSave(payload, isEdit) {
    if (isEdit) {
      await updateTaskStatus(modal.item.task_id, payload);
    } else {
      await createWorkItem(payload);
    }
    await load();
  }

  if (loading) return <Spinner />;

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search title or ID…"
          placeholderTextColor={COLORS.textMuted}
          clearButtonMode="while-editing"
        />
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModal({ visible: true, item: null })}
        >
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <FilterChips
        label="Type"
        options={WORK_ITEM_TYPES.map(t => ({ value: t.value, label: t.label, color: t.color }))}
        active={typeFilter}
        onSelect={setTypeFilter}
      />
      <FilterChips
        label="State"
        options={STATES.map(s => ({ value: s.value, label: s.label, color: s.color }))}
        active={stateFilter}
        onSelect={setStateFilter}
      />

      {/* Results count */}
      <Text style={styles.countText}>{filtered.length} item{filtered.length !== 1 ? 's' : ''}</Text>

      {/* List */}
      {filtered.length === 0
        ? <EmptyState icon="🔍" message="No matching work items." />
        : (
          <FlatList
            data={filtered}
            keyExtractor={i => String(i.id)}
            renderItem={({ item }) => (
              <WorkItemRow
                item={item}
                onEdit={it => setModal({ visible: true, item: it })}
                onDelete={handleDelete}
              />
            )}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={COLORS.accent} />}
          />
        )
      }

      <WorkItemModal
        visible={modal.visible}
        item={modal.item}
        onClose={() => setModal({ visible: false, item: null })}
        onSave={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  searchRow: {
    flexDirection: 'row', gap: SPACING.sm,
    padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  searchInput: {
    flex: 1, backgroundColor: COLORS.surface,
    borderWidth: 1, borderColor: COLORS.border, borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    color: COLORS.textPrimary, fontSize: TYPOGRAPHY.sizeMd,
  },
  addBtn:    { backgroundColor: COLORS.accent, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm, justifyContent: 'center' },
  addBtnText:{ color: COLORS.white, fontSize: TYPOGRAPHY.sizeSm, fontWeight: TYPOGRAPHY.weightSemibold },

  // Filter chips
  chipGroup: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  chipGroupLabel: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.sizeXs, marginBottom: 4 },
  chip: {
    marginRight: SPACING.xs, paddingHorizontal: SPACING.sm, paddingVertical: 3,
    borderRadius: RADIUS.full, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface,
  },
  chipActive:    { backgroundColor: COLORS.accent + '22', borderColor: COLORS.accent },
  chipText:      { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sizeXs },
  chipTextActive:{ color: COLORS.accent, fontWeight: TYPOGRAPHY.weightSemibold },

  countText: { color: COLORS.textMuted, fontSize: TYPOGRAPHY.sizeXs, padding: SPACING.sm, paddingLeft: SPACING.md },

  // Row
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: COLORS.bg,
  },
  rowLeft:    { flex: 1, gap: 4, marginRight: SPACING.sm },
  rowTitle:   { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.sizeMd },
  rowId:      { color: COLORS.textMuted, fontSize: TYPOGRAPHY.sizeXs, fontFamily: TYPOGRAPHY.fontMono },
  rowRight:   { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  deleteBtn:  { padding: 4 },
  deleteBtnText: { color: COLORS.error, fontSize: 14 },
  sep: { height: 1, backgroundColor: COLORS.border },
});
