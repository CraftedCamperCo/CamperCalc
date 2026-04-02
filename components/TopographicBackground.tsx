import { useCamper } from '@/context/CamperContext';
import { useTheme } from '@/context/ThemeContext';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Ellipse, Path } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

export default function TopographicBackground() {
  const theme = useTheme();
  const { state } = useCamper();
  const stroke = theme.mountainStroke;
  const ski = state.destinations?.includes('Ski Holiday');
  const coastal = state.destinations?.includes('Coastal & Beach');
  const festival = state.usage === 'Festival Goer';

  return (
    <View style={styles.container} pointerEvents="none">
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>

        {/* === MOUNTAIN RIDGELINES (lower half) === */}

        {/* Farthest ridge — most transparent */}
        <Path
          d={`M 0,${height * 0.72}
              C ${width * 0.12},${height * 0.62}
                ${width * 0.25},${height * 0.58}
                ${width * 0.38},${height * 0.61}
              C ${width * 0.50},${height * 0.64}
                ${width * 0.60},${height * 0.54}
                ${width * 0.72},${height * 0.52}
              C ${width * 0.84},${height * 0.50}
                ${width * 0.92},${height * 0.55}
                ${width},${height * 0.53}`}
          stroke={stroke}
          strokeWidth="0.8"
          fill="none"
          opacity={0.5}
        />

        {/* Mid ridge */}
        <Path
          d={`M 0,${height * 0.80}
              C ${width * 0.08},${height * 0.73}
                ${width * 0.18},${height * 0.70}
                ${width * 0.28},${height * 0.74}
              C ${width * 0.38},${height * 0.77}
                ${width * 0.48},${height * 0.67}
                ${width * 0.60},${height * 0.64}
              C ${width * 0.72},${height * 0.61}
                ${width * 0.86},${height * 0.68}
                ${width},${height * 0.65}`}
          stroke={stroke}
          strokeWidth="0.9"
          fill="none"
          opacity={0.7}
        />

        {/* Closest ridge — most visible */}
        <Path
          d={`M 0,${height * 0.88}
              C ${width * 0.10},${height * 0.82}
                ${width * 0.22},${height * 0.79}
                ${width * 0.35},${height * 0.83}
              C ${width * 0.45},${height * 0.86}
                ${width * 0.55},${height * 0.77}
                ${width * 0.65},${height * 0.74}
              C ${width * 0.78},${height * 0.70}
                ${width * 0.90},${height * 0.76}
                ${width},${height * 0.73}`}
          stroke={stroke}
          strokeWidth="1.1"
          fill="none"
        />

        {/* === TOPOGRAPHIC CONTOUR RINGS (upper area) === */}

        {/* Contour cluster 1 — upper right */}
        {[28, 52, 76, 100].map((r, i) => (
          <Ellipse
            key={`topo1-${i}`}
            cx={width * 0.78}
            cy={height * 0.18}
            rx={r * 1.3}
            ry={r * 0.7}
            stroke={stroke}
            strokeWidth="1"
            fill="none"
            opacity={0.9 - i * 0.18}
          />
        ))}

        {/* Contour cluster 2 — left middle */}
        {[22, 42, 62].map((r, i) => (
          <Ellipse
            key={`topo2-${i}`}
            cx={width * 0.14}
            cy={height * 0.42}
            rx={r * 1.1}
            ry={r * 0.65}
            stroke={stroke}
            strokeWidth="1"
            fill="none"
            opacity={0.7 - i * 0.18}
          />
        ))}

        {/* Contour cluster 3 — centre-top subtle */}
        {[18, 36, 54].map((r, i) => (
          <Ellipse
            key={`topo3-${i}`}
            cx={width * 0.5}
            cy={height * 0.08}
            rx={r * 1.6}
            ry={r * 0.5}
            stroke={stroke}
            strokeWidth="0.8"
            fill="none"
            opacity={0.5 - i * 0.14}
          />
        ))}

        {ski && (
          <Path
            d={`M ${width * 0.58},${height * 0.3} L ${width * 0.68},${height * 0.16} L ${width * 0.78},${height * 0.3}`}
            stroke={stroke}
            strokeWidth="1.1"
            fill="none"
            opacity={0.35}
          />
        )}
        {coastal && (
          <Path
            d={`M ${width * 0.05},${height * 0.26} C ${width * 0.2},${height * 0.23} ${width * 0.32},${height * 0.29} ${width * 0.46},${height * 0.25}`}
            stroke={stroke}
            strokeWidth="1"
            fill="none"
            opacity={0.3}
          />
        )}
        {festival && (
          <Path
            d={`M ${width * 0.79},${height * 0.38} L ${width * 0.86},${height * 0.30} L ${width * 0.93},${height * 0.38}`}
            stroke={stroke}
            strokeWidth="1"
            fill="none"
            opacity={0.32}
          />
        )}

      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
});
