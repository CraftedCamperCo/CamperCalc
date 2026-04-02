import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

export default class AppErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn('[AppErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={s.wrap}>
          <Text style={s.title}>Something went wrong</Text>
          <Text style={s.desc}>
            Your build is safe. Please try again. If the issue continues, contact Dan directly and we will sort it.
          </Text>
          <TouchableOpacity
            style={s.btn}
            onPress={() => Linking.openURL('mailto:dan@craftedcamper.co?subject=CamperPlan Support')}
            activeOpacity={0.85}
          >
            <Text style={s.btnText}>Contact Dan</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const s = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#F8F9FA' },
  title: { fontSize: 22, fontWeight: '800', color: '#1A1A1A', marginBottom: 8 },
  desc: { fontSize: 14, textAlign: 'center', color: '#333333', lineHeight: 20, marginBottom: 16 },
  btn: { backgroundColor: '#D9A05B', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: '#1A1A1A', fontWeight: '800' },
});

