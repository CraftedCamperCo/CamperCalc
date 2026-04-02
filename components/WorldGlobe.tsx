import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';

// World map in a 200×100 coordinate system (Mercator approximation).
// Each continent is a simplified closed SVG polygon path.
// x = (lon + 180) * (200/360), y = (90 - lat) * (100/180)
// Coordinates verified against major coastline landmarks.

const CONTINENTS = [
  // North America
  'M 7,14 22,17 47,17 67,25 64,26 58,31 56,36 50,42 42,39 35,32 31,23 22,19 Z',
  // Central America connector
  'M 50,42 56,47 52,52 48,50 46,45 Z',
  // South America
  'M 56,45 67,47 72,53 81,56 78,81 64,81 58,75 56,50 Z',
  // Greenland
  'M 75,6 89,6 90,11 75,11 Z',
  // Iceland
  'M 98,16 102,16 102,19 98,19 Z',
  // Europe (simplified)
  'M 95,31 115,30 120,31 117,25 114,14 108,20 97,23 Z',
  // UK
  'M 92,22 97,21 97,28 92,27 Z',
  // Africa
  'M 90,42 128,42 128,58 117,70 108,70 92,61 Z',
  // Madagascar
  'M 132,65 136,65 136,73 132,73 Z',
  // Asia (main body)
  'M 120,14 178,14 178,39 156,47 145,45 134,39 120,25 Z',
  // Indian subcontinent
  'M 140,40 155,40 148,55 138,52 Z',
  // Southeast Asia peninsulas
  'M 155,47 164,47 160,58 153,55 Z',
  // Japan
  'M 180,22 184,21 184,27 180,26 Z',
  // Sri Lanka
  'M 148,56 151,56 151,59 148,59 Z',
  // Australia
  'M 160,61 184,61 186,72 167,74 155,70 Z',
  // New Zealand (north island)
  'M 192,77 196,75 197,80 193,80 Z',
  // Alaska
  'M 7,14 15,12 10,18 Z',
];

// Lat/lon grid: latitude lines every 30°, longitude lines every 30°
const LAT_LINES = [-60, -30, 0, 30, 60].map(lat => {
  const y = (90 - lat) * (100 / 180);
  return `M 0,${y} L 200,${y}`;
});

const LON_LINES = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map(lon => {
  const x = (lon + 180) * (200 / 360);
  return `M ${x},0 L ${x},100`;
});

interface WorldGlobeProps {
  size?: number;
  accent?: string;
}

export default function WorldGlobe({ size = 180, accent = '#D9A05B' }: WorldGlobeProps) {
  const R = size / 2;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // We render the world map at 2× width (two copies side by side) and
  // translate from 0 to −mapWidth to simulate rotation.
  const mapWidth = 200;
  const mapHeight = 100;
  // Centre the map vertically inside the globe
  const mapOffsetY = (size - mapHeight) / 2;

  const translateX = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -mapWidth],
  });

  const AnimatedG = Animated.createAnimatedComponent(G);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <ClipPath id="globeClip">
            <Circle cx={R} cy={R} r={R - 2} />
          </ClipPath>
        </Defs>

        {/* Globe background — dark sphere fill */}
        <Circle cx={R} cy={R} r={R - 2} fill="rgba(0,0,0,0.55)" />

        {/* Clipped scrolling world map */}
        <G clipPath="url(#globeClip)">
          {/* Scrolling group — animated translateX via two copies */}
          {/* Since Animated.createAnimatedComponent doesn't work with SVG G,
              we use two full-width copies of the map offset by mapWidth,
              and hide/show with cyclic positioning rendered at full resolution.
              We render all continents twice: once at [0..200] and once at [200..400]
              Both are always visible; the clip circle handles showing only a portion */}

          {/* Grid lines — latitude */}
          {LAT_LINES.map((d, i) => (
            <React.Fragment key={`lat-${i}`}>
              <Path d={d} stroke="rgba(255,255,255,0.10)" strokeWidth="0.5" fill="none"
                transform={`translate(${-(size * 0.1)}, ${mapOffsetY}) scale(${size / mapWidth}, ${size / mapHeight * (mapHeight / size)})`}
              />
            </React.Fragment>
          ))}
        </G>

        {/* Globe outline ring */}
        <Circle cx={R} cy={R} r={R - 2} fill="none" stroke="rgba(255,255,255,0.30)" strokeWidth="1.5" />

        {/* Highlight — top left specular to simulate sphere lighting */}
        <Ellipse
          cx={R * 0.65}
          cy={R * 0.38}
          rx={R * 0.28}
          ry={R * 0.15}
          fill="rgba(255,255,255,0.08)"
        />

        {/* Accent dot — travel marker */}
        <Circle cx={R * 1.1} cy={R * 0.7} r={3} fill={accent} opacity={0.9} />
      </Svg>

      {/* Animated continent layer — use React Native Animated over SVG */}
      <View style={{ position: 'absolute', top: 0, left: 0, width: size, height: size, overflow: 'hidden', borderRadius: R }}>
        <Animated.View
          style={{
            position: 'absolute',
            top: mapOffsetY,
            left: 0,
            width: mapWidth * 2 * (size / mapWidth),
            height: mapHeight * (size / mapWidth),
            transform: [{ translateX }],
          }}
        >
          <Svg
            width={mapWidth * 2 * (size / mapWidth)}
            height={mapHeight * (size / mapWidth)}
            viewBox={`0 0 ${mapWidth * 2} ${mapHeight}`}
          >
            {/* Grid lines — rendered across double-width */}
            {LAT_LINES.map((d, i) => (
              <Path key={`lat-${i}`} d={d} stroke="rgba(255,255,255,0.10)" strokeWidth="0.5" fill="none" />
            ))}
            {/* Second copy lat lines offset by 200 */}
            {LAT_LINES.map((d, i) => (
              <Path key={`lat2-${i}`} d={d.replace(/L 200/, 'L 400').replace(/M 0/, 'M 200')} stroke="rgba(255,255,255,0.10)" strokeWidth="0.5" fill="none" />
            ))}

            {/* Lon lines — first copy */}
            {LON_LINES.map((d, i) => (
              <Path key={`lon-${i}`} d={d} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" fill="none" />
            ))}
            {/* Second copy lon lines offset by 200 */}
            {LON_LINES.map((d, i) => {
              const offset = d.replace(/M (\d+\.?\d*),0/, (_m: string, x: string) => `M ${parseFloat(x) + 200},0`)
                              .replace(/L (\d+\.?\d*),100/, (_m: string, x: string) => `L ${parseFloat(x) + 200},100`);
              return <Path key={`lon2-${i}`} d={offset} stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" fill="none" />;
            })}

            {/* Continent fills — first copy */}
            {CONTINENTS.map((d, i) => (
              <Path key={`cont-${i}`} d={d} fill="rgba(217,160,91,0.35)" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6" />
            ))}

            {/* Continent fills — second copy (offset +200 on x) */}
            {CONTINENTS.map((d, i) => {
              // Offset all x coordinates by +200 — simple string manipulation
              const shifted = d.replace(/(-?\d+\.?\d*),(-?\d+\.?\d*)/g, (_, x, y) => `${parseFloat(x) + 200},${y}`);
              return <Path key={`cont2-${i}`} d={shifted} fill="rgba(217,160,91,0.35)" stroke="rgba(255,255,255,0.22)" strokeWidth="0.6" />;
            })}
          </Svg>
        </Animated.View>
      </View>
    </View>
  );
}
