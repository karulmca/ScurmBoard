import React, { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, ScrollView,
  TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, RADIUS, SHADOW } from '../theme';
import { WORK_ITEM_TYPES, STATES, PRIORITIES } from '../constants';
import { TypeBadge, StatePill, Divider } from './UIComponents';

// ── Picker row (tap to cycle options) ────────────────────────────────────────
function CyclePicker({ label, options, valueKey = 'value', labelKey = 'label', value, onChange, renderValue }) {
  const idx = options.findIndex(o => String(o[valueKey]) === String(value));

  const next = () => {
    const nextIdx = (idx + 1) % options.length;
    onChange(options[nextIdx][valueKey]);
  };

  const current = options[idx] || options[0];

  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity onPress={next} style={styles.cyclePicker}>
        {renderValue
          ? renderValue(current)
          : <Text style={styles.cycleText}>{current?.[labelKey] || '—'}</Text>
        }
        <Text style={styles.cycleArrow}>⟳</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Text field ────────────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, multiline = false, keyboardType = 'default' }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMulti]}
        value={value ?? ''}
        onChangeText={onChange}
        placeholder={placeholder || label}
        placeholderTextColor={COLORS.textMuted}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
        keyboardType={keyboardType}
      />
    </View>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function WorkItemModal({ visible, item, onClose, onSave }) {
  const isEdit = !!item;

  const defaults = {
    title:          '',
    work_item_type: 'Task',
    state:          'New',
    priority:       3,
    assigned_to:    '',
    description:    '',
    sprint:         '',
    story_points:   '',
    tags:           '',
    area_path:      '',
    iteration_path: '',
    target_date:    '',
  };

  const [form, setForm] = useState(defaults);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setForm(item ? { ...defaults, ...item, story_points: String(item.story_points ?? ''), tags: item.tags ?? '' } : defaults);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, item]);

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        story_points: form.story_points ? Number(form.story_points) : null,
        priority:     Number(form.priority),
      };
      await onSave(payload, isEdit);
      onClose();
    } catch (e) {
      console.error('Save error', e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.kavWrap}
        >
          <View style={styles.sheet}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>{isEdit ? 'Edit Work Item' : 'New Work Item'}</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
              {/* Title */}
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Title *</Text>
                <TextInput
                  style={[styles.input, styles.titleInput]}
                  value={form.title}
                  onChangeText={v => set('title', v)}
                  placeholder="Enter title…"
                  placeholderTextColor={COLORS.textMuted}
                />
              </View>

              <Divider />

              {/* Type + State */}
              <CyclePicker
                label="Type"
                options={WORK_ITEM_TYPES}
                value={form.work_item_type}
                onChange={v => set('work_item_type', v)}
                renderValue={opt => <TypeBadge type={opt.value} />}
              />
              <CyclePicker
                label="State"
                options={STATES}
                value={form.state}
                onChange={v => set('state', v)}
                renderValue={opt => <StatePill state={opt.value} />}
              />
              <CyclePicker
                label="Priority"
                options={PRIORITIES}
                value={form.priority}
                onChange={v => set('priority', v)}
                renderValue={opt => (
                  <View style={[styles.priBadge, { backgroundColor: opt.color + '22', borderColor: opt.color }]}>
                    <Text style={[styles.priText, { color: opt.color }]}>{opt.label}</Text>
                  </View>
                )}
              />

              <Divider />

              <Field label="Assigned To"  value={form.assigned_to}  onChange={v => set('assigned_to', v)}  />
              <Field label="Sprint"        value={form.sprint}        onChange={v => set('sprint', v)}        />
              <Field label="Story Points" value={form.story_points}  onChange={v => set('story_points', v)} keyboardType="numeric" />
              <Field label="Tags"         value={form.tags}          onChange={v => set('tags', v)}         placeholder="tag1, tag2" />
              <Field label="Area Path"    value={form.area_path}     onChange={v => set('area_path', v)}    />
              <Field label="Iteration"    value={form.iteration_path}onChange={v => set('iteration_path', v)}/>
              <Field label="Target Date"  value={form.target_date}   onChange={v => set('target_date', v)}  placeholder="YYYY-MM-DD" />
              <Field label="Description"  value={form.description}   onChange={v => set('description', v)}  multiline />
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, (!form.title.trim() || saving) && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={!form.title.trim() || saving}
              >
                <Text style={styles.saveText}>{saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  kavWrap:    { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius:  RADIUS.lg,
    borderTopRightRadius: RADIUS.lg,
    maxHeight: '92%',
    ...SHADOW.card,
  },

  header: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    padding:        SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle:  { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.sizeLg, fontWeight: TYPOGRAPHY.weightSemibold },
  closeBtn:     { padding: SPACING.xs },
  closeBtnText: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sizeLg },

  body: { padding: SPACING.lg, gap: SPACING.sm },

  fieldRow: {
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  fieldLabel: { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sizeSm, fontWeight: TYPOGRAPHY.weightMedium },
  input: {
    backgroundColor: COLORS.surfaceAlt,
    borderWidth:     1,
    borderColor:     COLORS.border,
    borderRadius:    RADIUS.sm,
    padding:         SPACING.sm,
    color:           COLORS.textPrimary,
    fontSize:        TYPOGRAPHY.sizeMd,
  },
  inputMulti:  { minHeight: 80, textAlignVertical: 'top' },
  titleInput:  { fontSize: TYPOGRAPHY.sizeMd, fontWeight: TYPOGRAPHY.weightMedium },

  // Cycle picker
  cyclePicker: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceAlt,
    borderWidth:     1,
    borderColor:     COLORS.border,
    borderRadius:    RADIUS.sm,
    padding:         SPACING.sm,
  },
  cycleText:  { color: COLORS.textPrimary, fontSize: TYPOGRAPHY.sizeMd },
  cycleArrow: { color: COLORS.textMuted,   fontSize: TYPOGRAPHY.sizeLg, marginLeft: SPACING.sm },

  // Priority badge inside picker
  priBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical:   3,
    borderRadius:      RADIUS.full,
    borderWidth:       1,
  },
  priText: { fontSize: TYPOGRAPHY.sizeSm, fontWeight: TYPOGRAPHY.weightMedium },

  // Footer
  footer: {
    flexDirection: 'row',
    gap:           SPACING.sm,
    padding:       SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  cancelBtn:     { flex: 1, padding: SPACING.md, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  cancelText:    { color: COLORS.textSecondary, fontSize: TYPOGRAPHY.sizeMd },
  saveBtn:       { flex: 2, padding: SPACING.md, borderRadius: RADIUS.sm, backgroundColor: COLORS.accent, alignItems: 'center' },
  saveBtnDisabled:{ opacity: 0.5 },
  saveText:      { color: COLORS.white, fontSize: TYPOGRAPHY.sizeMd, fontWeight: TYPOGRAPHY.weightSemibold },
});
