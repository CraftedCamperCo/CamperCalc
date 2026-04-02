import { useTheme } from '@/context/ThemeContext';
import { ConsumptionBreakdown, GenerationBreakdown } from '@/utils/calculator';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Text, View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - 56;
const CHART_H = 180;
const PAD_LEFT = 38;
const PAD_RIGHT = 12;
const PAD_TOP = 16;
const PAD_BOTTOM = 28;
const PLOT_W = CHART_W - PAD_LEFT - PAD_RIGHT;
const PLOT_H = CHART_H - PAD_TOP - PAD_BOTTOM;

interface ChartCategory {
  label: string;
  value: number;
  color: string;
}

interface Props {
  consumption: ConsumptionBreakdown;
  generation: GenerationBreakdown;
  totalAh: number;
}

// Build a cumulative line path from data points
function buildPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
}

// Build a closed area path (path + down to baseline + back)
function buildAreaPath(points: { x: number; y: number }[], baselineY: number): string {
  if (points.length === 0) return '';
  const line = buildPath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x.toFixed(1)},${baselineY.toFixed(1)} L ${first.x.toFixed(1)},${baselineY.toFixed(1)} Z`;
}

export default function ConsumptionLineChart({ consumption, generation, totalAh }: Props) {
  const theme = useTheme();
  const animProgress = useRef(new Animated.Value(0)).current;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    animProgress.addListener(({ value }) => setProgress(value));
    Animated.timing(animProgress, {
      toValue: 1,
      duration: 5000,
      useNativeDriver: false,
    }).start();
    return () => animProgress.removeAllListeners();
  }, []);

  // Build categories: cumulative consumption build-up
  const categories: ChartCategory[] = [
    { label: 'Base', value: consumption.base, color: theme.accent },
    { label: 'People', value: consumption.party, color: '#E8A87C' },
    { label: 'Heat', value: consumption.heating, color: '#E07B4A' },
    { label: 'Cook', value: consumption.cooking, color: '#C96B3A' },
    { label: 'Water', value: consumption.hotWater, color: '#B85A2A' },
    { label: 'Apps', value: consumption.appliances, color: '#A04820' },
    { label: 'Custom', value: consumption.custom, color: '#8A3810' },
  ].filter(c => c.value > 0);

  const genCategories: ChartCategory[] = [
    { label: 'Solar', value: generation.solar, color: theme.successBright },
    { label: 'Drive', value: generation.alternator, color: '#5A9A6A' },
  ].filter(c => c.value > 0);

  const maxVal = Math.max(totalAh, totalAh * 1.1);
  const scaleY = (val: number) => PAD_TOP + PLOT_H - (val / maxVal) * PLOT_H;

  // Points for the cumulative consumption line
  const consumptionPoints: { x: number; y: number }[] = [];
  let cumulative = 0;
  const stepCount = categories.length + 1;
  const stepX = PLOT_W / Math.max(stepCount - 1, 1);

  // Start at 0
  consumptionPoints.push({ x: PAD_LEFT, y: scaleY(0) });
  categories.forEach((cat, i) => {
    cumulative += cat.value;
    consumptionPoints.push({ x: PAD_LEFT + (i + 1) * stepX, y: scaleY(cumulative) });
  });

  // Generation offset line (starts from peak and goes down)
  const peakAh = cumulative;
  const genPoints: { x: number; y: number }[] = [];
  if (genCategories.length > 0) {
    genPoints.push({ x: PAD_LEFT + stepCount * stepX - stepX, y: scaleY(peakAh) });
    let genCumul = peakAh;
    genCategories.forEach((cat, i) => {
      genCumul -= cat.value;
      genPoints.push({
        x: PAD_LEFT + (stepCount + i) * stepX * 0.4,
        y: scaleY(Math.max(0, genCumul)),
      });
    });
  }

  // Animate: only show points up to current progress
  const totalPoints = consumptionPoints.length + genPoints.length;
  const visibleCount = Math.floor(progress * totalPoints);
  const visibleConsumption = consumptionPoints.slice(0, Math.min(visibleCount, consumptionPoints.length));
  const visibleGen = genPoints.slice(0, Math.max(0, visibleCount - consumptionPoints.length));

  const linePath = buildPath(visibleConsumption);
  const areaPath = visibleConsumption.length > 1
    ? buildAreaPath(visibleConsumption, scaleY(0))
    : '';
  const genLinePath = buildPath(visibleGen);

  // Y-axis gridlines & labels
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(frac => ({
    y: PAD_TOP + PLOT_H - frac * PLOT_H,
    label: Math.round(frac * maxVal),
  }));

  const isDark = theme.blurTint === 'dark';
  const gridColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const axisColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';
  const textColor = theme.textSecondary;

  return (
    <View>
      <Svg width={CHART_W} height={CHART_H}>
        <Defs>
          <LinearGradient id="consumptionGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={theme.accent} stopOpacity={0.25} />
            <Stop offset="1" stopColor={theme.accent} stopOpacity={0.02} />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {gridLines.map(({ y, label }) => (
          <React.Fragment key={label}>
            <Line x1={PAD_LEFT} y1={y} x2={CHART_W - PAD_RIGHT} y2={y}
              stroke={gridColor} strokeWidth="1" strokeDasharray="3,4" />
            <SvgText x={PAD_LEFT - 4} y={y + 4} fontSize="9" fill={textColor} textAnchor="end">
              {label > 0 ? `${label}` : ''}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Axes */}
        <Line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={PAD_TOP + PLOT_H} stroke={axisColor} strokeWidth="1" />
        <Line x1={PAD_LEFT} y1={PAD_TOP + PLOT_H} x2={CHART_W - PAD_RIGHT} y2={PAD_TOP + PLOT_H} stroke={axisColor} strokeWidth="1" />

        {/* Consumption area fill */}
        {areaPath ? <Path d={areaPath} fill="url(#consumptionGrad)" /> : null}

        {/* Consumption line */}
        {linePath ? (
          <Path d={linePath} stroke={theme.accent} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        ) : null}

        {/* Generation offset line */}
        {genLinePath ? (
          <Path d={genLinePath} stroke={theme.successBright} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6,3" />
        ) : null}

        {/* Data point dots — consumption */}
        {visibleConsumption.slice(1).map((p, i) => (
          <Circle key={`cp-${i}`} cx={p.x} cy={p.y} r={3.5}
            fill={categories[i]?.color || theme.accent}
            stroke={isDark ? '#1E1E22' : '#fff'}
            strokeWidth="1.5"
          />
        ))}

        {/* Data point dots — generation */}
        {visibleGen.slice(1).map((p, i) => (
          <Circle key={`gp-${i}`} cx={p.x} cy={p.y} r={3}
            fill={theme.successBright}
            stroke={isDark ? '#1E1E22' : '#fff'}
            strokeWidth="1.5"
          />
        ))}

        {/* X-axis category labels */}
        {categories.map((cat, i) => {
          const x = PAD_LEFT + (i + 1) * stepX;
          return (
            <SvgText key={cat.label} x={x} y={CHART_H - 6} fontSize="8.5" fill={textColor} textAnchor="middle">
              {cat.label}
            </SvgText>
          );
        })}

        {/* Ah label */}
        <SvgText x={PAD_LEFT - 14} y={PAD_TOP - 4} fontSize="8" fill={textColor} textAnchor="middle">Ah</SvgText>
      </Svg>

      {/* Legend */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10, paddingHorizontal: 4 }}>
        {categories.map(cat => (
          <View key={cat.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: cat.color }} />
            <Text style={{ fontSize: 10, color: textColor, fontWeight: '500' }}>{cat.label}</Text>
          </View>
        ))}
        {genCategories.map(cat => (
          <View key={cat.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 8, height: 3, backgroundColor: cat.color, opacity: 0.8 }} />
            <Text style={{ fontSize: 10, color: textColor, fontWeight: '500' }}>{cat.label} (gen)</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
