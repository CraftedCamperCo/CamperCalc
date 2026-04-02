import GlassCard from '@/components/GlassCard';
import { useTheme } from '@/context/ThemeContext';
import { generateInvoice, InvoiceCustomer, InvoiceData, shareInvoice } from '@/utils/invoiceGenerator';
import { supabase } from '@/utils/supabase';
import type { SupplierProduct } from '@/utils/supplierCatalog';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface InvoiceFormProps {
  visible: boolean;
  onDismiss: () => void;
  items: SupplierProduct[];
  totalRRP: number;
  totalCrafted: number;
  savings: number;
  hasCraftedDiscount: boolean;
}

async function sendInvoiceNotification(data: InvoiceData) {
  try {
    const { error } = await supabase.functions.invoke('invoice-notification', {
      body: {
        reference: data.reference,
        customer_name: data.customer.name,
        customer_email: data.customer.email,
        customer_phone: data.customer.phone,
        items: data.items.map(i => ({ name: i.name, price: data.hasCraftedDiscount ? i.craftedPrice : i.supplierPrice })),
        total_rrp: data.totalRRP,
        total_crafted: data.totalCrafted,
        savings: data.savings,
        has_discount: data.hasCraftedDiscount,
      },
    });
    if (error) console.warn('Invoice notification failed:', error);
  } catch (e) {
    console.warn('Invoice notification error:', e);
  }
}

export default function InvoiceForm({ visible, onDismiss, items, totalRRP, totalCrafted, savings, hasCraftedDiscount }: InvoiceFormProps) {
  const theme = useTheme();
  const isDark = theme.blurTint === 'dark';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const placeholderColor = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.35)';
  const inputStyle = [styles.input, {
    color: theme.text,
    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
  }];

  const handleGenerate = async () => {
    Keyboard.dismiss();
    setError('');

    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!email.trim() || !email.includes('@')) { setError('Please enter a valid email'); return; }
    if (!phone.trim()) { setError('Please enter your phone number'); return; }

    setLoading(true);
    try {
      const customer: InvoiceCustomer = { name: name.trim(), email: email.trim(), phone: phone.trim() };
      const { uri, data } = await generateInvoice(customer, items, totalRRP, totalCrafted, savings, hasCraftedDiscount);
      setSuccess(true);

      sendInvoiceNotification(data).catch(() => {});

      await shareInvoice(uri);
    } catch (e: any) {
      setError(e?.message || 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setName(''); setEmail(''); setPhone('');
    setError(''); setSuccess(false);
    onDismiss();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={handleClose} activeOpacity={1} />
        <View style={[styles.sheet, { backgroundColor: theme.background }]}>
          <View style={[styles.handle, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }]} />

          {success ? (
            <View style={styles.successWrap}>
              <FontAwesome name="check-circle" size={48} color={theme.accent} />
              <Text style={[styles.successTitle, { color: theme.text }]}>Invoice Generated</Text>
              <Text style={[styles.successDesc, { color: theme.textSecondary }]}>
                Your invoice has been created and is ready to share or save.
              </Text>
              <TouchableOpacity style={[styles.doneBtn, { backgroundColor: theme.accent }]} onPress={handleClose} activeOpacity={0.85}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={[styles.title, { color: theme.text }]}>Generate Invoice</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                Enter your details to create a PDF invoice with your component list.
              </Text>

              <GlassCard style={styles.totalCard}>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>
                    {items.length} components
                  </Text>
                  <Text style={[styles.totalPrice, { color: theme.accent }]}>
                    £{(hasCraftedDiscount ? totalCrafted : totalRRP).toFixed(2)}
                  </Text>
                </View>
                {hasCraftedDiscount && (
                  <Text style={[styles.savingsText, { color: theme.successBright }]}>
                    You save £{savings.toFixed(2)} with Crafted discount
                  </Text>
                )}
              </GlassCard>

              <TextInput
                style={inputStyle}
                placeholder="Full Name"
                placeholderTextColor={placeholderColor}
                value={name}
                onChangeText={v => { setName(v); setError(''); }}
                autoCapitalize="words"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
              />
              <TextInput
                style={inputStyle}
                placeholder="Email Address"
                placeholderTextColor={placeholderColor}
                value={email}
                onChangeText={v => { setEmail(v); setError(''); }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
              />
              <TextInput
                style={inputStyle}
                placeholder="Phone Number"
                placeholderTextColor={placeholderColor}
                value={phone}
                onChangeText={v => { setPhone(v); setError(''); }}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                returnKeyType="go"
                onSubmitEditing={handleGenerate}
              />

              {error ? <Text style={[styles.errorText, { color: theme.danger }]}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.generateBtn, { backgroundColor: theme.accent, opacity: loading ? 0.7 : 1 }]}
                onPress={handleGenerate}
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.generateBtnText}>Generate PDF Invoice</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingTop: 12 },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },

  title: { fontSize: 22, fontWeight: '800', marginBottom: 6 },
  subtitle: { fontSize: 13, lineHeight: 19, marginBottom: 20 },

  totalCard: { marginBottom: 18 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 13, fontWeight: '500' },
  totalPrice: { fontSize: 22, fontWeight: '800' },
  savingsText: { fontSize: 12, fontWeight: '600', marginTop: 4 },

  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, marginBottom: 10 },
  errorText: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4 },

  generateBtn: { paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 6, marginBottom: 8 },
  generateBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },

  successWrap: { alignItems: 'center', paddingVertical: 24 },
  successTitle: { fontSize: 22, fontWeight: '800', marginTop: 16, marginBottom: 6 },
  successDesc: { fontSize: 13, textAlign: 'center', lineHeight: 19, marginBottom: 24 },
  doneBtn: { paddingVertical: 14, paddingHorizontal: 48, borderRadius: 10 },
  doneBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
