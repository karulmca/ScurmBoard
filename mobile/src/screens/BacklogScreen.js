import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS } from '../theme';
import { TYPE_HIERARCHY, getTypeInfo, getStateInfo } from '../constants';
import { TypeBadge, StatePill, Avatar, Spinner, EmptyState } from '../components/UIComponents';
import WorkItemModal from '../components/WorkItemModal';
import { getWorkItems, createWorkItem, deleteWorkItem } from '../services/api';

// ── Build parent→children tree ────────────────────────────────────────────────
function buildTree(flat) {
  const byId  = {};
  const roots = [];

  flat.forEach(item => { byId[item.task_id] = { ...item, children: [] }; });

  flat.forEach(item => {
    if (item.parent_task_id && byId[item.parent_task_id]) {
      byId[item.parent_task_id].children.push(byId[item.task_id]);
    } else {
      roots.push(byId[item.task_id]);
    }
  });

  // Sort roots by type hierarchy
  roots.sort((a, b) => TYPE_HIERARCHY.indexOf(a.work_item_type) - TYPE_HIERARCHY.indexOf(b.work_item_type));
  return roots;
}

// Flatten a tree with depth info, respecting collapsed state
function flattenVisible(nodes, collapsed, depth = 0) {
  const result = [];
  for (const node of nodes) {
    result.push({ ...node, _depth: depth });
    if (!collapsed[node.task_id] && node.children?.length) {
      result.push(...flattenVisible(node.children, collapsed, depth + 1));
    }
  }
  return result;
}

// ── Row ───────────────────────────────────────────────────────────────────────
function BacklogRow({ item, collapsed, onToggle, onEdit, onDelete, onAddChild }) {
  const hasChildren = item.children?.length > 0;
  const indent      = item._depth * 16;
  const stateInfo   = getStateInfo(item.state);

  return (
    <View style={[styles.row, { paddingLeft: SPACING.md + indent }]}>
      {/* Expand/collapse toggle */}
      <TouchableOpacity
        style={styles.toggleBtn}
        onPress={() => hasChildren && onToggle(item.task_id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.toggleIcon}>
          {hasChildren ? (collapsed[item.task_id] ? '▶' : '▼') : '·'}
        </Text>
      </TouchableOpacity>

      {/* Type icon */}
      <View style={[styles.typeIndicator, { backgroundColor: getTypeInfo(item.work_item_type).color }]} />

      {/* Content */}
      <TouchableOpacity style={styles.rowContent} onPress={() => onEdit(item)} activeOpacity={0.7}>
        <View style={styles.rowTop}>
          <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
          <StatePill state={item.state} />
        </View>
        <View style={styles.rowMeta}>
          <Text style={styles.rowId}>{item.task_id}</Text>
          {item.assigned_to ? <Avatar name={item.assigned_to} size={18} /> : null}
          {item.story_points ? <Text style={styles.rowSp}>{item.story_points}sp</Text> : null}
        </View>
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.rowActions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onAddChild(item)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={styles.actionIcon}>＋</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onDelete(item)}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Text style={[styles.actionIcon, { color: COLORS.error }]}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────
export default function BacklogScreen() {
  const [items,     setItems]     = useState([]);
  const [tree,      setTree]      = useState([]);
  const [collapsed, setCollapsed] = useState({});
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [modal,     setModal]     = useState({ visible: false, item: null, parentId: null });

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const data = await getWorkItems();
      const flat = Array.isArray(data) ? data : [];
      setItems(flat);
      setTree(buildTree(flat));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function toggleCollapse(taskId) {
    setCollapsed(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  }

  function openEdit(item) {
    setModal({ visible: true, item, parentId: null });
  }

  function openAddChild(parentItem) {
    setModal({ visible: true, item: null, parentId: parentItem.task_id });
  }

  function handleDelete(item) {
    Alert.alert(
      'Delete Work Item',
      `Delete "${item.title}"? This will also remove child items.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try {
              await deleteWorkItem(item.task_id);
              await load();
            } catch (e) {
              Alert.alert('Error', e.message);
            }
          },
        },
      ]
    );
  }

  async function handleSave(payload, isEdit) {
    if (modal.parentId) payload.parent_task_id = modal.parentId;
    if (isEdit) {
      // patch via updateTaskStatus-style; for simplicity re-use createWorkItem
      // (backend PATCH handles partial updates)
      const { updateTaskStatus } = await import('../services/api');
      await updateTaskStatus(modal.item.task_id, payload);
    } else {
      await createWorkItem(payload);
    }
    await load();
  }

  if (loading) return <Spinner />;

  const flatRows = flattenVisible(tree, collapsed);

  return (
    <View style={styles.container}>
      <View style={styles.toolbar}>
        <Text style={styles.toolbarTitle}>Backlog  <Text style={styles.toolbarCount}>({items.length})</Text></Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModal({ visible: true, item: null, parentId: null })}
        >
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {flatRows.length === 0
        ? <EmptyState icon="📋" message="No backlog items yet." />
        : (
          <FlatList
            data={flatRows}
            keyExtractor={r => String(r.id)}
            renderItem={({ item }) => (
              <BacklogRow
                item={item}
                collapsed={collapsed}
                onToggle={toggleCollapse}
                onEdit={openEdit}
                onDelete={handleDelete}
                onAddChild={openAddChild}
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
        onClose={() => setModal({ visible: false, item: null, parentId: null })}
        onSave={handleSave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  toolbarTitle: { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.sizeLg, fontWeight: TYPOGRAPHY.weightSemibold },
  toolbarCount: { color: COLORS.textSecondary, fontWeight: TYPOGRAPHY.weightNormal },
  addBtn:       { backgroundColor: COLORS.accent, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.sm },
  addBtnText:   { color: COLORS.white, fontSize: TYPOGRAPHY.sizeSm, fontWeight: TYPOGRAPHY.weightSemibold },

  sep: { height: 1, backgroundColor: COLORS.border },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingRight: SPACING.md,
    backgroundColor: COLORS.bg,
    minHeight: 52,
  },
  toggleBtn:  { width: 20, alignItems: 'center' },
  toggleIcon: { color: COLORS.textMuted, fontSize: 11 },
  typeIndicator: { width: 4, height: 32, borderRadius: 2, marginRight: SPACING.sm },

  rowContent: { flex: 1, gap: 3 },
  rowTop:  { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  rowTitle:{ flex: 1, color: COLORS.textPrimary, fontSize: TYPOGRAPHY.sizeMd },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  rowId:   { color: COLORS.textMuted, fontSize: TYPOGRAPHY.sizeXs, fontFamily: TYPOGRAPHY.fontMono },
  rowSp:   { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sizeXs },

  rowActions: { flexDirection: 'row', gap: SPACING.sm, marginLeft: SPACING.sm },
  actionBtn:  { padding: 4 },
  actionIcon: { color: COLORS.textSecondary, fontSize: 16 },
});
