import GlassCard from '@/components/GlassCard';
import TopographicBackground from '@/components/TopographicBackground';
import { useTheme } from '@/context/ThemeContext';
import { useScreenSlide } from '@/hooks/useScreenSlide';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const BUILD_SLOTS = {
  2026: { total: 4, remaining: 1 },
  2027: { total: 4, remaining: 3 },
};

interface YouTubeVideo {
  title: string;
  videoId: string;
  published: string;
  thumbnail: string;
}

function SlotIndicator({ year, remaining, total, delay = 0, theme }: {
  year: number; remaining: number; total: number; delay?: number; theme: any;
}) {
  const taken = total - remaining;
  const takenFraction = taken / total;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(barAnim, { toValue: takenFraction, delay, useNativeDriver: false, friction: 7, tension: 40 }).start();
  }, []);

  const isUrgent = remaining === 1;

  return (
    <View style={cal.row}>
      <View style={cal.rowHeader}>
        <Text style={[cal.yearLabel, { color: theme.text }]}>{year}</Text>
        <View style={[cal.slotBadge, { backgroundColor: `${isUrgent ? theme.danger : theme.accent}18`, borderColor: `${isUrgent ? theme.danger : theme.accent}44` }]}>
          <Text style={[cal.slotBadgeText, { color: isUrgent ? theme.danger : theme.accent }]}>
            {remaining} slot{remaining !== 1 ? 's' : ''} remaining
          </Text>
        </View>
      </View>
      <View style={[cal.track, { backgroundColor: theme.blurTint === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)', borderColor: theme.blurTint === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
        {Array.from({ length: total }).map((_, i) => {
          const isTaken = i < taken;
          return (
            <View
              key={i}
              style={[
                cal.segment,
                { left: `${(i / total) * 100}%`, width: `${(1 / total) * 100}%` },
                isTaken
                  ? { backgroundColor: theme.blurTint === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)' }
                  : { backgroundColor: `${theme.accent}18` },
              ]}
            >
              {!isTaken && <View style={[cal.segmentDot, { backgroundColor: theme.accent }]} />}
            </View>
          );
        })}
      </View>
      <Text style={[cal.hint, { color: theme.textSecondary }]}>Contact us to find out available dates →</Text>
    </View>
  );
}

function YouTubeCard({ theme }: { theme: any }) {
  const [video, setVideo] = useState<YouTubeVideo | null>(null);

  useEffect(() => {
    const CHANNEL_ID = 'UCFt9-XGxQHz4QlIuonHU3uQ';
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

    fetch(rssUrl)
      .then(r => r.text())
      .then(xml => {
        // Extract all entries
        const entryMatches = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
        for (const entry of entryMatches) {
          const titleMatch = entry.match(/<title>(.*?)<\/title>/);
          const idMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
          const pubMatch = entry.match(/<published>(.*?)<\/published>/);
          if (!titleMatch || !idMatch || !pubMatch) continue;
          const title = titleMatch[1];
          // Skip Shorts — identified by #shorts tag or very short title pattern
          if (title.toLowerCase().includes('#shorts') || title.toLowerCase().includes('short')) continue;
          setVideo({
            title,
            videoId: idMatch[1],
            published: pubMatch[1].slice(0, 10),
            thumbnail: `https://img.youtube.com/vi/${idMatch[1]}/hqdefault.jpg`,
          });
          return;
        }
      })
      .catch(() => {});
  }, []);

  const openYouTube = () => {
    Linking.openURL(video ? `https://www.youtube.com/watch?v=${video.videoId}` : 'https://www.youtube.com/@craftedcamperco');
  };

  return (
    <TouchableOpacity onPress={openYouTube} activeOpacity={0.8}>
      <GlassCard style={yt.card} noPadding>
        {video?.thumbnail ? (
          <Image source={{ uri: video.thumbnail }} style={yt.thumbnail} resizeMode="cover" />
        ) : (
          <View style={[yt.thumbnailPlaceholder, { backgroundColor: theme.blurTint === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}>
            <Text style={{ fontSize: 36, color: theme.textSecondary, opacity: 0.3 }}>▶</Text>
          </View>
        )}
        <View style={yt.body}>
          <View style={yt.header}>
            <View style={yt.youtubeTag}><Text style={yt.youtubeTagText}>▶ YouTube</Text></View>
            <Text style={[yt.channelName, { color: theme.textSecondary }]}>@craftedcamperco</Text>
          </View>
          <Text style={[yt.title, { color: theme.text }]} numberOfLines={2}>{video ? video.title : 'Watch our latest build on YouTube →'}</Text>
          {video?.published && <Text style={[yt.date, { color: theme.textSecondary }]}>{video.published}</Text>}
          <Text style={[yt.cta, { color: theme.accent }]}>Tap to watch →</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

function AnimatedCard({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: object }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 500, delay, useNativeDriver: true }).start();
  }, []);
  return (
    <Animated.View style={[{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }, style]}>
      {children}
    </Animated.View>
  );
}

export default function CraftWithUsScreen() {
  const theme = useTheme();
  const { style: slideStyle, panHandlers } = useScreenSlide(5);

  const openEmail = () => Linking.openURL('mailto:dan@craftedcamper.co?subject=Spec Consultation Booking&body=Hi Dan,%0D%0A%0D%0AI\'d like to book a 1-hour spec consultation.%0D%0A%0D%0AMy details:%0D%0AName: %0D%0AVan type: %0D%0ABrief description of my build: ');
  const openWebsite = () => Linking.openURL('https://craftedcamper.co');
  const openYouTube = () => Linking.openURL('https://www.youtube.com/@craftedcamperco');

  return (
    <Animated.View style={[{ flex: 1, backgroundColor: theme.background }, slideStyle]} {...panHandlers}>
      <TopographicBackground />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* HERO — real PNG logo */}
        <AnimatedCard delay={0}>
          <View style={styles.heroBlock}>
            <Image
              source={require('../../assets/images/crafted-logo.png')}
              style={styles.logoImage}
              resizeMode="contain"
            />
            <Text style={[styles.tagline, { color: theme.text }]}>Crafted for Discovery.{'\n'}Built for You.</Text>
            <Text style={[styles.byLine, { color: theme.textSecondary }]}>Bespoke handcrafted luxury campervans</Text>
          </View>
        </AnimatedCard>

        {/* CONSULTATION */}
        <AnimatedCard delay={100}>
          <GlassCard style={styles.consultCard} float>
            <Text style={[styles.consultLabel, { color: theme.accent }]}>SPEC CONSULTATION</Text>
            <Text style={[styles.consultTitle, { color: theme.text }]}>1-Hour Build Session</Text>
            <Text style={[styles.consultDesc, { color: theme.textSecondary }]}>
              Sit down with Dan and spec every cable, connection, and layout detail for your exact camper. No guesswork — your build, precisely engineered.
            </Text>
            <View style={styles.consultItems}>
              {[
                'Full electrical schematic for your layout',
                'Every cable size and fuse rating calculated',
                'Component list with specific product recommendations',
                'Layout optimisation for your van model',
              ].map((item, i) => (
                <View key={i} style={styles.consultItem}>
                  <Text style={[styles.consultTick, { color: theme.successBright }]}>✓</Text>
                  <Text style={[styles.consultItemText, { color: theme.text }]}>{item}</Text>
                </View>
              ))}
            </View>
            <View style={styles.consultFooter}>
              <Text style={[styles.consultPrice, { color: theme.accent }]}>£150</Text>
              <TouchableOpacity style={[styles.bookBtn, { backgroundColor: theme.text }]} onPress={openEmail} activeOpacity={0.85}>
                <Text style={[styles.bookBtnText, { color: theme.background }]}>Book via Email →</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </AnimatedCard>

        {/* BUILD AVAILABILITY */}
        <AnimatedCard delay={200}>
          <GlassCard style={styles.card}>
            <Text style={[styles.sectionLabel, { color: theme.accent }]}>BUILD AVAILABILITY</Text>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>We build just 4 vans a year.</Text>
            <Text style={[styles.sectionHelper, { color: theme.textSecondary }]}>Every build gets our full attention. That means limited slots and a waiting list that moves fast.</Text>
            <SlotIndicator year={2026} remaining={BUILD_SLOTS[2026].remaining} total={BUILD_SLOTS[2026].total} delay={300} theme={theme} />
            <SlotIndicator year={2027} remaining={BUILD_SLOTS[2027].remaining} total={BUILD_SLOTS[2027].total} delay={500} theme={theme} />
            <TouchableOpacity style={[styles.enquireBtn, { borderColor: `${theme.accent}44` }]} onPress={openWebsite} activeOpacity={0.8}>
              <Text style={[styles.enquireBtnText, { color: theme.accent }]}>Secure Your Slot →</Text>
            </TouchableOpacity>
          </GlassCard>
        </AnimatedCard>

        {/* YOUTUBE */}
        <AnimatedCard delay={300}>
          <Text style={[styles.sectionLabel2, { color: theme.accent }]}>LATEST FROM THE WORKSHOP</Text>
          <YouTubeCard theme={theme} />
        </AnimatedCard>

        {/* FOOTER */}
        <AnimatedCard delay={400}>
          <View style={styles.footer}>
            <TouchableOpacity onPress={openWebsite}><Text style={[styles.footerLinkText, { color: theme.textSecondary }]}>craftedcamper.co</Text></TouchableOpacity>
            <Text style={[styles.footerDot, { color: theme.textSecondary }]}>·</Text>
            <TouchableOpacity onPress={openYouTube}><Text style={[styles.footerLinkText, { color: theme.textSecondary }]}>@craftedcamperco</Text></TouchableOpacity>
          </View>
          <Text style={[styles.footerCopy, { color: theme.blurTint === 'dark' ? '#3A3A3C' : '#C0B8B0' }]}>© Crafted Camper Co. · Free to use. Built with pride.</Text>
        </AnimatedCard>

        <View style={{ height: 120 }} />
      </ScrollView>
    </Animated.View>
  );
}

const cal = StyleSheet.create({
  row: { marginBottom: 18 },
  rowHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  yearLabel: { fontSize: 16, fontWeight: '800' },
  slotBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  slotBadgeText: { fontSize: 11, fontWeight: '700' },
  track: { height: 44, borderRadius: 10, flexDirection: 'row', overflow: 'hidden', borderWidth: 1 },
  segment: { position: 'absolute', top: 0, bottom: 0, borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' },
  segmentDot: { width: 7, height: 7, borderRadius: 4, opacity: 0.7 },
  hint: { fontSize: 11, marginTop: 8, textAlign: 'right' },
});

const yt = StyleSheet.create({
  card: { marginBottom: 16 },
  thumbnail: { width: '100%', height: 190 },
  thumbnailPlaceholder: { width: '100%', height: 190, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 14 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  youtubeTag: { backgroundColor: 'rgba(255,0,0,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  youtubeTagText: { fontSize: 11, fontWeight: '700', color: '#FF453A' },
  channelName: { fontSize: 11 },
  title: { fontSize: 15, fontWeight: '700', lineHeight: 20, marginBottom: 6 },
  date: { fontSize: 11, marginBottom: 8 },
  cta: { fontSize: 12, fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingTop: 24 },
  heroBlock: { alignItems: 'center', marginBottom: 36, marginTop: 8 },
  logoImage: { width: 240, height: 90, marginBottom: 16 },
  tagline: { fontSize: 22, fontWeight: '700', textAlign: 'center', lineHeight: 28, marginBottom: 8 },
  byLine: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  consultCard: { marginBottom: 24 },
  consultLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 6 },
  consultTitle: { fontSize: 22, fontWeight: '800', marginBottom: 8 },
  consultDesc: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
  consultItems: { gap: 8, marginBottom: 18 },
  consultItem: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  consultTick: { fontSize: 13, fontWeight: '800', marginTop: 1 },
  consultItemText: { fontSize: 13, flex: 1, lineHeight: 18 },
  consultFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  consultPrice: { fontSize: 36, fontWeight: '800' },
  bookBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  bookBtnText: { fontSize: 14, fontWeight: '800' },
  card: { marginBottom: 24 },
  sectionLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 8 },
  sectionLabel2: { fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 8 },
  sectionHelper: { fontSize: 13, lineHeight: 19, marginBottom: 20 },
  enquireBtn: { marginTop: 10, borderWidth: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  enquireBtnText: { fontSize: 14, fontWeight: '700' },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 },
  footerLinkText: { fontSize: 13, fontWeight: '500' },
  footerDot: {},
  footerCopy: { textAlign: 'center', fontSize: 11 },
});
