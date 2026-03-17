import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

export const ZenLogModal = ({ visible, onSave }) => {
  const [note, setNote] = useState('');

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContent}>
          <Text style={styles.title}>Session Complete</Text>
          <Text style={styles.subtitle}>
            In one sentence, how is your mind now?
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Still, clear, or peaceful..."
            placeholderTextColor="#999"
            onChangeText={setNote}
            multiline
          />
          <TouchableOpacity
            style={[styles.saveBtn, !note.trim() && { opacity: 0.6 }]}
            onPress={() => note.trim() && onSave(note)}
          >
            <Text style={styles.saveBtnText}>Seal Reflection</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 30, 30, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    padding: 25,
    alignItems: 'center',
    elevation: 20,
  },
  title: {
    color: '#004346',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
  },
  subtitle: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#F0F4F4',
    borderRadius: 15,
    width: '100%',
    padding: 15,
    color: '#004346',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  saveBtn: {
    marginTop: 20,
    backgroundColor: '#004346',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
