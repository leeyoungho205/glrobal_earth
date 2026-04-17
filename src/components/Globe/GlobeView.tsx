// 3D 지구본 메인 컴포넌트 - 아름다운 지구 텍스처 + 위성/레이더 오버레이
import { useRef, useCallback, useEffect, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import Globe from 'react-globe.gl';
import type { GlobeInstance } from 'globe.gl';
import * as THREE from 'three';
import { useMapStore } from '../../store/mapStore';
import { useRadarFrames } from '../../hooks/useRadarFrames';
import { getRadarTileUrl } from '../../services/radarApi';

// ── 텍스처 URL ──────────────────────────────────────────────────────────────
// Blue Marble 지구 텍스처 (react-globe.gl 내장 CDN, 즉시 표시)
const BLUE_MARBLE_URL = '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
// 야간 도시불빛 텍스처 (범프 효과로 사용)
const NIGHT_LIGHTS_URL = '//unpkg.com/three-globe/example/img/earth-night.jpg';
// 표면 범프 맵
const BUMP_MAP_URL = '//unpkg.com/three-globe/example/img/earth-topology.png';

// NASA GIBS 위성 타일 URL - MODIS Terra 트루컬러 (더 빠르게 로드)
const getSatelliteTileUrl = (x: number, y: number, level: number): string => {
  // 이틀 전 데이터 사용 (GIBS 이미지 처리 지연 고려)
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${twoDaysAgo}/GoogleMapsCompatible_Level9/${level}/${y}/${x}.jpg`;
};

// 레이더 타일 URL (RainViewer)
const makeRadarTileUrl = (host: string, path: string) =>
  (x: number, y: number, level: number): string =>
    getRadarTileUrl(host, path, level, x, y);

interface MarkerData {
  lat: number;
  lng: number;
}

const GlobeView = forwardRef<GlobeInstance | undefined>((_, ref) => {
  const globeRef = useRef<GlobeInstance | undefined>(undefined);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const { selectedLocation, setSelectedLocation, pointOfView, setPointOfView, activeLayer } =
    useMapStore();
  const { currentFrame, host } = useRadarFrames();

  // 외부 ref 노출
  useImperativeHandle(ref, () => globeRef.current);

  // 창 크기 감지
  useEffect(() => {
    const handleResize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 초기 카메라 설정
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView(
        { lat: pointOfView.lat, lng: pointOfView.lng, altitude: pointOfView.altitude },
        0
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 지구본 클릭 → 위치 선택
  const handleGlobeClick = useCallback(
    (coords: { lat: number; lng: number }, _event: MouseEvent) => {
      const { lat, lng } = coords;
      setSelectedLocation({ lat, lng });
      if (globeRef.current) {
        const currentPov = globeRef.current.pointOfView();
        const newAlt = Math.min(currentPov.altitude, 1.5);
        globeRef.current.pointOfView({ lat, lng, altitude: newAlt }, 800);
        setPointOfView({ lat, lng, altitude: newAlt });
      }
    },
    [setSelectedLocation, setPointOfView]
  );

  // ── 레이어별 설정 ────────────────────────────────────────────────────────
  // 기본 지도: Blue Marble 텍스처 (즉시 표시, 아름다운 지구)
  // 위성: NASA GIBS 타일 오버레이
  // 레이더: Blue Marble + RainViewer 레이더
  const isSatellite = activeLayer === 'satellite';
  const isRadar = activeLayer === 'radar';

  // 위성 레이어일 때만 타일 엔진 사용
  const tileEngineUrl = useMemo(() => {
    if (isSatellite) return getSatelliteTileUrl;
    return undefined;
  }, [isSatellite]);

  // 기본/레이더 레이어일 때 Blue Marble 텍스처 표시
  // 위성 레이어일 때는 타일이 텍스처를 덮으므로 null
  const globeImageUrl = isSatellite ? null : BLUE_MARBLE_URL;
  const bumpImageUrl = isSatellite ? null : BUMP_MAP_URL;

  // 선택 위치 마커
  const markerData: MarkerData[] = useMemo(
    () => (selectedLocation ? [{ lat: selectedLocation.lat, lng: selectedLocation.lng }] : []),
    [selectedLocation]
  );

  // 레이더 커스텀 레이어
  const radarCustomLayer = useMemo(
    () => (isRadar && currentFrame && host ? [{ id: 'radar' }] : []),
    [isRadar, currentFrame, host]
  );

  const createRadarObject = useCallback(() => {
    if (!currentFrame || !host) return new THREE.Object3D();
    const geometry = new THREE.SphereGeometry(101, 64, 64);
    const loader = new THREE.TextureLoader();
    const sampleUrl = getRadarTileUrl(host, currentFrame.path, 2, 2, 1);
    const texture = loader.load(sampleUrl);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.6,
      side: THREE.FrontSide,
      depthWrite: false,
    });
    return new THREE.Mesh(geometry, material);
  }, [currentFrame, host]);

  return (
    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, #0d1b3e 0%, #050d1a 100%)' }}>
      <Globe
        ref={globeRef as React.MutableRefObject<GlobeInstance>}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)"
        // 기본/레이더: Blue Marble 텍스처 (즉시 렌더링)
        globeImageUrl={globeImageUrl}
        bumpImageUrl={bumpImageUrl}
        // 위성 레이어: NASA GIBS 타일
        globeTileEngineUrl={tileEngineUrl}
        showAtmosphere={true}
        atmosphereColor="#4fa8e8"
        atmosphereAltitude={0.18}
        onGlobeClick={handleGlobeClick}
        animateIn={true}
        // 선택 위치 마커 (주황 빛나는 점)
        pointsData={markerData}
        pointLat="lat"
        pointLng="lng"
        pointColor={() => '#f59e0b'}
        pointAltitude={0.01}
        pointRadius={0.5}
        pointResolution={12}
        // 레이더 오버레이
        customLayerData={radarCustomLayer}
        customThreeObject={createRadarObject}
        customThreeObjectUpdate={() => {}}
      />

      {/* 위성 레이어 로딩 중 안내 (타일 로드 시간 동안) */}
      {isSatellite && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-slate-900/70 backdrop-blur-sm text-slate-300 text-xs px-3 py-1.5 rounded-full pointer-events-none">
          🛰️ NASA 위성 이미지 로딩 중...
        </div>
      )}
    </div>
  );
});

GlobeView.displayName = 'GlobeView';
export default GlobeView;
