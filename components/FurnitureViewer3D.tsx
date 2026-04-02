/**
 * 3D furniture kit viewer — Three.js in WebView.
 * Uses global script tags (no import maps) for maximum WebView compatibility.
 * Loads the GLB model via the asset URI passed from React Native.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import type { CountertopOption } from '@/utils/furnitureKits';

interface FurnitureViewer3DProps {
  cabinetHex: string;
  countertop: CountertopOption;
  sinkCutout: boolean;
  fridgeCutout: boolean;
  style?: any;
}

const COUNTERTOP_HEX: Record<CountertopOption, string> = {
  'solid-oak': '#C4A060',
  'white-laminate': '#F0EDE6',
};

export default function FurnitureViewer3D({
  cabinetHex,
  countertop,
  sinkCutout,
  fridgeCutout,
  style,
}: FurnitureViewer3DProps) {
  const webRef = useRef<WebView>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [glbBase64, setGlbBase64] = useState<string | null>(null);
  const webViewReady = useRef(false);
  const sentModel = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const asset = Asset.fromModule(
          require('../assets/models/karavan7510.glb'),
        );
        await asset.downloadAsync();
        const uri = asset.localUri;
        if (!uri) {
          setError('Could not resolve model file');
          return;
        }
        const b64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        setGlbBase64(b64);
      } catch (e: any) {
        console.warn('GLB load error:', e);
        setError(e?.message ?? 'Failed to load 3D model');
      }
    })();
  }, []);

  useEffect(() => {
    if (glbBase64 && webViewReady.current && !sentModel.current) {
      sentModel.current = true;
      webRef.current?.postMessage(
        JSON.stringify({ type: 'loadModel', data: glbBase64 }),
      );
    }
  }, [glbBase64]);

  const sendConfig = useCallback(() => {
    if (!webRef.current || !webViewReady.current) return;
    webRef.current.postMessage(
      JSON.stringify({
        type: 'updateConfig',
        cabinetHex,
        countertopHex: COUNTERTOP_HEX[countertop],
        sinkCutout,
        fridgeCutout,
      }),
    );
  }, [cabinetHex, countertop, sinkCutout, fridgeCutout]);

  useEffect(() => {
    sendConfig();
  }, [sendConfig]);

  const onMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === 'ready') {
          webViewReady.current = true;
          if (glbBase64 && !sentModel.current) {
            sentModel.current = true;
            webRef.current?.postMessage(
              JSON.stringify({ type: 'loadModel', data: glbBase64 }),
            );
          }
          sendConfig();
        }
        if (msg.type === 'loaded') {
          setLoading(false);
        }
        if (msg.type === 'error') {
          setError(msg.message ?? 'Rendering error');
          setLoading(false);
        }
      } catch {}
    },
    [glbBase64, sendConfig],
  );

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webRef}
        source={{ html: VIEWER_HTML }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        allowsInlineMediaPlayback
        onMessage={onMessage}
        scrollEnabled={false}
        bounces={false}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        androidLayerType="hardware"
        allowFileAccessFromFileURLs
        allowUniversalAccessFromFileURLs
        mixedContentMode="always"
      />
      {loading && !error && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#D9A05B" />
          <Text style={styles.loadingText}>Loading 3D model...</Text>
        </View>
      )}
      {error && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const VIEWER_HTML = `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden;background:#1E1E22;touch-action:none}
canvas{width:100%;height:100%;display:block}
#info{position:absolute;bottom:8px;left:50%;transform:translateX(-50%);
  color:rgba(255,255,255,0.35);font:10px/1 -apple-system,sans-serif;pointer-events:none}
</style>
</head>
<body>
<div id="info">Drag to orbit · Pinch to zoom</div>
<script src="https://unpkg.com/three@0.147.0/build/three.min.js"></script>
<script src="https://unpkg.com/three@0.147.0/examples/js/controls/OrbitControls.js"></script>
<script src="https://unpkg.com/three@0.147.0/examples/js/loaders/GLTFLoader.js"></script>
<script>
(function(){
try {
var scene = new THREE.Scene();
scene.background = new THREE.Color('#1E1E22');

var camera = new THREE.PerspectiveCamera(45, window.innerWidth/window.innerHeight, 0.01, 100);
camera.position.set(3, 2.5, 4);

var renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

scene.add(new THREE.AmbientLight(0xffffff, 0.6));
var dir = new THREE.DirectionalLight(0xffffff, 1.2);
dir.position.set(5, 8, 5);
dir.castShadow = true;
dir.shadow.mapSize.set(1024, 1024);
scene.add(dir);
scene.add(new THREE.HemisphereLight(0xffeedd, 0x222244, 0.4));

var controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 1;
controls.maxDistance = 12;
controls.target.set(0, 0.8, 0);
controls.update();

var floorMat = new THREE.MeshStandardMaterial({color:0x1a1a1e, roughness:0.9});
var floor = new THREE.Mesh(new THREE.PlaneGeometry(20,20), floorMat);
floor.rotation.x = -Math.PI/2;
floor.position.y = -0.01;
floor.receiveShadow = true;
scene.add(floor);

var model = null;
var cabinetMats = [];
var countertopMats = [];
var curCabinetHex = '#C4A882';
var curCountertopHex = '#C4A060';

var FURNITURE_PREFIX = 'C-Furniture_';
var SUBMESH_PREFIX = 'G-.li3dsubmesh';
// Countertop is currently mapped to the wood-top material only.
// Laminate/Formica materials are treated as cabinet faces.
var CT_NAMES = ['Sicomoro'];
var CABINET_NAME_HINTS = ['Formica', 'Laminate'];

function applyColor(mats, hex) {
  var c = new THREE.Color(hex);
  for (var i=0; i<mats.length; i++) {
    mats[i].color.copy(c);
    if (mats[i].map) { mats[i].map = null; mats[i].needsUpdate = true; }
    mats[i].needsUpdate = true;
  }
}

function collectFurnitureMaterials(root) {
  var mats = [];
  function addMat(m) {
    if (m && mats.indexOf(m) === -1) mats.push(m);
  }
  function walk(node, inFurnitureBranch) {
    var thisBranch =
      inFurnitureBranch ||
      (node.name && (
        node.name.indexOf(FURNITURE_PREFIX) === 0 ||
        node.name.indexOf(SUBMESH_PREFIX) === 0
      ));

    if (node.isMesh && thisBranch) {
      var ms = Array.isArray(node.material) ? node.material : [node.material];
      for (var i = 0; i < ms.length; i++) addMat(ms[i]);
    }

    if (!node.children || node.children.length === 0) return;
    for (var j = 0; j < node.children.length; j++) {
      walk(node.children[j], thisBranch);
    }
  }
  walk(root, false);
  return mats;
}

function collectMaterialsByNameHints(root, hints) {
  var mats = [];
  function addMat(m) {
    if (!m || mats.indexOf(m) !== -1) return;
    if (!m.name) return;
    for (var i = 0; i < hints.length; i++) {
      if (m.name.indexOf(hints[i]) !== -1) {
        mats.push(m);
        return;
      }
    }
  }
  root.traverse(function(node) {
    if (!node.isMesh) return;
    var ms = Array.isArray(node.material) ? node.material : [node.material];
    for (var j = 0; j < ms.length; j++) addMat(ms[j]);
  });
  return mats;
}

function loadModel(b64) {
  try {
    var bin = atob(b64);
    var arr = new Uint8Array(bin.length);
    for (var i=0; i<bin.length; i++) arr[i] = bin.charCodeAt(i);

    var loader = new THREE.GLTFLoader();
    loader.parse(arr.buffer, '', function(gltf) {
      if (model) scene.remove(model);
      model = gltf.scene;

      var box = new THREE.Box3().setFromObject(model);
      var center = box.getCenter(new THREE.Vector3());
      var size = box.getSize(new THREE.Vector3());
      var maxDim = Math.max(size.x, size.y, size.z);
      var scale = 3/maxDim;
      model.scale.setScalar(scale);
      model.position.sub(center.multiplyScalar(scale));
      model.position.y += (size.y*scale)/2;

      cabinetMats = [];
      countertopMats = [];

      model.traverse(function(child) {
        if (!child.isMesh) return;
        child.castShadow = true;
        child.receiveShadow = true;
        var ms = Array.isArray(child.material) ? child.material : [child.material];
        for (var j = 0; j < ms.length; j++) {
          var m = ms[j];
          if (!m) continue;
          for (var k = 0; k < CT_NAMES.length; k++) {
            if (m.name && m.name.indexOf(CT_NAMES[k]) !== -1 && countertopMats.indexOf(m) === -1) {
              countertopMats.push(m);
            }
          }
        }
      });

      // Collect cabinet materials from:
      // 1) furniture node branches, and
      // 2) visible laminate/formica materials used as cabinet faces.
      var branchCabinets = collectFurnitureMaterials(model);
      var laminateCabinets = collectMaterialsByNameHints(model, CABINET_NAME_HINTS);
      cabinetMats = branchCabinets.concat(laminateCabinets).filter(function(m, idx, arr) {
        return arr.indexOf(m) === idx;
      }).filter(function(m) {
        return countertopMats.indexOf(m) === -1;
      });

      scene.add(model);
      if (cabinetMats.length>0) applyColor(cabinetMats, curCabinetHex);
      if (countertopMats.length>0) applyColor(countertopMats, curCountertopHex);

      controls.target.set(0, (size.y*scale)/2, 0);
      controls.update();

      window.ReactNativeWebView.postMessage(JSON.stringify({type:'loaded'}));
    }, function(err) {
      window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',message:'GLB parse: '+err}));
    });
  } catch(e) {
    window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',message:'Load error: '+e.message}));
  }
}

function handleMsg(raw) {
  try {
    var msg = JSON.parse(raw);
    if (msg.type==='loadModel' && msg.data) loadModel(msg.data);
    if (msg.type==='updateConfig') {
      curCabinetHex = msg.cabinetHex || curCabinetHex;
      curCountertopHex = msg.countertopHex || curCountertopHex;
      if (cabinetMats.length>0) applyColor(cabinetMats, curCabinetHex);
      if (countertopMats.length>0) applyColor(countertopMats, curCountertopHex);
    }
  } catch(e){}
}

window.addEventListener('message', function(e){handleMsg(e.data)});
document.addEventListener('message', function(e){handleMsg(e.data)});

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', function(){
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.ReactNativeWebView.postMessage(JSON.stringify({type:'ready'}));

} catch(e) {
  window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',message:'Init: '+e.message}));
}
})();
</script>
</body>
</html>`;

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 340,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1E1E22',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(30,30,34,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
  },
  errorText: {
    color: 'rgba(255,100,100,0.8)',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
