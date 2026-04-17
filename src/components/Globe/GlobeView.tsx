// 3D 지구본 메인 컴포넌트 - CartoDB 라이트 지도 + 위성/레이더 오버레이
import { useRef, useCallback, useEffect, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import Globe from 'react-globe.gl';
import type { GlobeInstance } from 'globe.gl';
import * as THREE from 'three';
import { useMapStore } from '../../store/mapStore';
import { useRadarFrames } from '../../hooks/useRadarFrames';
import { getRadarTileUrl } from '../../services/radarApi';

// ── CartoDB 라이트 테마 타일 ──────────────────────────────────────────────────
// light_all: 밝은 회색 배경 + 지역별 현지 언어 라벨 (한국→한국어, 미국→영어 등)
// a~d 서브도메인을 번갈아 사용해 로딩 속도 향상 (CDN 병렬화)
const getCartoLightTileUrl = (x: number, y: number, level: number): string => {
  const subdomains = ['a', 'b', 'c', 'd'];
  const s = subdomains[(x + y) % 4]; // 균등 분산
  return `https://${s}.basemaps.cartocdn.com/light_all/${level}/${x}/${y}.png`;
};

// ── NASA GIBS 위성 타일 ──────────────────────────────────────────────────────
// MODIS Terra 트루컬러 - 이틀 전 데이터 (GIBS 처리 지연 고려)
const getSatelliteTileUrl = (x: number, y: number, level: number): string => {
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/${twoDaysAgo}/GoogleMapsCompatible_Level9/${level}/${y}/${x}.jpg`;
};

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
  // 타일 초기 로딩 완료 여부 (첫 렌더링 시 안내 표시용)
  const [tilesReady, setTilesReady] = useState(false);

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

  // 레이어 전환 시 로딩 상태 초기화
  useEffect(() => {
    setTilesReady(false);
    const timer = setTimeout(() => setTilesReady(true), 2000); // 2초 후 안내 숨김
    return () => clearTimeout(timer);
  }, [activeLayer]);

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

  // ── 레이어별 타일 설정 ────────────────────────────────────────────────────
  // 지도 보기: CartoDB 라이트 타일 (도시명/국가명 현지어)
  // 위성 보기: NASA GIBS MODIS Terra 위성 이미지
  // 레이더 보기: CartoDB 라이트 타일 + RainViewer 레이더 오버레이
  const isSatellite = activeLayer === 'satellite';
  const isRadar = activeLayer === 'radar';

  // 레이어에 따라 타일 URL 함수 선택
  const tileEngineUrl = useMemo(() => {
    if (isSatellite) return getSatelliteTileUrl;
    return getCartoLightTileUrl; // 지도/레이더 모두 CartoDB 라이트
  }, [isSatellite]);

  // 타일 엔진이 지구 텍스처를 대체하므로 globeImageUrl은 사용 안 함
  // (타일이 전체 구면을 덮기 때문)
  const globeImageUrl = null;
  const bumpImageUrl = null;

  // 선택 위치 마커 (클릭한 위치에 주황 점 표시)
  const markerData: MarkerData[] = useMemo(
    () => (selectedLocation ? [{ lat: selectedLocation.lat, lng: selectedLocation.lng }] : []),
    [selectedLocation]
  );

  // 레이더 커스텀 레이어 데이터
  const radarCustomLayer = useMemo(
    () => (isRadar && currentFrame && host ? [{ id: 'radar' }] : []),
    [isRadar, currentFrame, host]
  );

  // 레이더 구체 생성 (지구보다 약간 크게, 반투명)
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

  // 로딩 안내 문구 결정
  const loadingLabel = isSatellite
    ? '🛰️ NASA 위성 이미지 로딩 중...'
    : isRadar
    ? '🌧️ 레이더 + 지도 로딩 중...'
    : '🗺️ 지도 로딩 중...';

  return (
    // 우주 배경: 어두운 파란 그라디언트
    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, #0d1b3e 0%, #050d1a 100%)' }}>
      <Globe
        ref={globeRef as React.MutableRefObject<GlobeInstance>}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)"
        // 타일 엔진이 지구 표면을 직접 렌더링
        globeImageUrl={globeImageUrl}
        bumpImageUrl={bumpImageUrl}
        globeTileEngineUrl={tileEngineUrl}
        // 대기권 효과
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

      {/* 타일 로딩 중 안내 (2초 후 자동 숨김) */}
      {!tilesReady && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-slate-900/70 backdrop-blur-sm text-slate-300 text-xs px-3 py-1.5 rounded-full pointer-events-none transition-opacity duration-500">
          {loadingLabel}
        </div>
      )}
    </div>
  );
});

GlobeView.displayName = 'GlobeView';
export default GlobeView;
