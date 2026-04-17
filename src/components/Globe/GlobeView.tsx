// 3D 지구본 메인 컴포넌트 - CartoDB 라이트 지도 + 구름 오버레이 + 위성/레이더
import { useRef, useCallback, useEffect, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import Globe from 'react-globe.gl';
import type { GlobeInstance } from 'globe.gl';
import * as THREE from 'three';
import { useMapStore } from '../../store/mapStore';
import { useRadarFrames } from '../../hooks/useRadarFrames';
import { getRadarTileUrl, buildCloudCanvasTexture } from '../../services/radarApi';

// ── CartoDB 라이트 테마 타일 ──────────────────────────────────────────────────
// light_all: 밝은 회색 배경 + 지역별 현지 언어 라벨
// a~d 서브도메인 순환으로 CDN 병렬화 → 로딩 속도 향상
const getCartoLightTileUrl = (x: number, y: number, level: number): string => {
  const subdomains = ['a', 'b', 'c', 'd'];
  const s = subdomains[(x + y) % 4];
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

// 커스텀 레이어 아이템 타입
interface OverlayItem {
  id: string; // 'cloud' | 'radar'
}

const GlobeView = forwardRef<GlobeInstance | undefined>((_, ref) => {
  const globeRef = useRef<GlobeInstance | undefined>(undefined);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  // 타일 로딩 안내 표시 여부
  const [tilesReady, setTilesReady] = useState(false);
  // 구름 Three.js 텍스처 (캔버스 합성 후 저장)
  const [cloudTexture, setCloudTexture] = useState<THREE.CanvasTexture | null>(null);

  const { selectedLocation, setSelectedLocation, pointOfView, setPointOfView, activeLayer } =
    useMapStore();
  const { currentFrame, host, latestCloudFrame } = useRadarFrames();

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

  // 레이어 전환 시 로딩 안내 초기화
  useEffect(() => {
    setTilesReady(false);
    const timer = setTimeout(() => setTilesReady(true), 2500);
    return () => clearTimeout(timer);
  }, [activeLayer]);

  // ── 구름 텍스처 빌드 ────────────────────────────────────────────────────────
  // 최신 적외선 위성 프레임이 로드되면 16장 타일을 합쳐 전구 텍스처 생성
  useEffect(() => {
    if (!latestCloudFrame || !host) return;

    let cancelled = false;
    buildCloudCanvasTexture(host, latestCloudFrame.path).then((canvas) => {
      if (cancelled) return;
      // 이전 텍스처 메모리 해제
      setCloudTexture(prev => {
        prev?.dispose();
        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
      });
    });

    return () => { cancelled = true; };
  }, [latestCloudFrame, host]);

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
  const isSatellite = activeLayer === 'satellite';
  const isRadar = activeLayer === 'radar';
  const isMap = activeLayer === 'base'; // 기본 지도 모드 (LayerType: 'base')

  // 레이어에 따라 타일 URL 함수 선택
  const tileEngineUrl = useMemo(() => {
    if (isSatellite) return getSatelliteTileUrl;
    return getCartoLightTileUrl; // 지도/레이더 모두 CartoDB 라이트
  }, [isSatellite]);

  // 선택 위치 마커
  const markerData: MarkerData[] = useMemo(
    () => (selectedLocation ? [{ lat: selectedLocation.lat, lng: selectedLocation.lng }] : []),
    [selectedLocation]
  );

  // ── 오버레이 레이어 구성 ─────────────────────────────────────────────────────
  // 지도 보기: 구름 오버레이만
  // 레이더 보기: 구름 + 레이더 오버레이
  // 위성 보기: 오버레이 없음 (위성 타일 자체에 구름 포함)
  const customLayerData: OverlayItem[] = useMemo(() => {
    const layers: OverlayItem[] = [];
    // 지도/레이더 모드 + 구름 데이터 있을 때 구름 추가
    if ((isMap || isRadar) && cloudTexture) {
      layers.push({ id: 'cloud' });
    }
    // 레이더 모드에서 레이더 추가
    if (isRadar && currentFrame && host) {
      layers.push({ id: 'radar' });
    }
    return layers;
  }, [isMap, isRadar, cloudTexture, currentFrame, host]);

  // 오버레이별 Three.js 오브젝트 생성
  const createOverlayObject = useCallback((d: OverlayItem) => {
    // ── 구름 오버레이 ──────────────────────────────────────────────────────
    if (d.id === 'cloud' && cloudTexture) {
      // 지구(반지름 100) 보다 약간 큰 구체에 구름 텍스처
      const geometry = new THREE.SphereGeometry(101.2, 64, 64);
      const material = new THREE.MeshBasicMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.75,         // 반투명 → 지도/위성이 비침
        side: THREE.FrontSide,
        depthWrite: false,
        blending: THREE.NormalBlending,
      });
      // UV 플립: Three.js 구체의 텍스처 방향 맞춤
      cloudTexture.wrapS = THREE.RepeatWrapping;
      cloudTexture.repeat.x = -1; // 좌우 반전 (경도 방향 정렬)
      return new THREE.Mesh(geometry, material);
    }

    // ── 레이더 오버레이 ────────────────────────────────────────────────────
    if (d.id === 'radar' && currentFrame && host) {
      const geometry = new THREE.SphereGeometry(101.5, 64, 64);
      const loader = new THREE.TextureLoader();
      // 레이더는 단일 샘플 타일로 근사 표현 (zoom 2, x=2, y=1 - 아시아/태평양 기준)
      const radarUrl = getRadarTileUrl(host, currentFrame.path, 2, 2, 1);
      const texture = loader.load(radarUrl);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.6,
        side: THREE.FrontSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending, // 강수는 더하기 블렌딩으로 더 선명하게
      });
      return new THREE.Mesh(geometry, material);
    }

    return new THREE.Object3D();
  }, [cloudTexture, currentFrame, host]);

  // 로딩 안내 문구
  const loadingLabel = isSatellite
    ? '🛰️ NASA 위성 이미지 로딩 중...'
    : isRadar
    ? '🌧️ 레이더 + 구름 로딩 중...'
    : '☁️ 지도 + 구름 레이어 로딩 중...';

  return (
    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, #0d1b3e 0%, #050d1a 100%)' }}>
      <Globe
        ref={globeRef as React.MutableRefObject<GlobeInstance>}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)"
        // 타일 엔진 (CartoDB 라이트 또는 NASA GIBS)
        globeImageUrl={null}
        bumpImageUrl={null}
        globeTileEngineUrl={tileEngineUrl}
        // 대기권 효과
        showAtmosphere={true}
        atmosphereColor="#4fa8e8"
        atmosphereAltitude={0.18}
        onGlobeClick={handleGlobeClick}
        animateIn={true}
        // 선택 위치 마커 (주황 점)
        pointsData={markerData}
        pointLat="lat"
        pointLng="lng"
        pointColor={() => '#f59e0b'}
        pointAltitude={0.01}
        pointRadius={0.5}
        pointResolution={12}
        // 구름 + 레이더 오버레이
        customLayerData={customLayerData}
        customThreeObject={createOverlayObject as (d: object) => THREE.Object3D}
        customThreeObjectUpdate={() => {}}
      />

      {/* 타일/구름 로딩 안내 */}
      {!tilesReady && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-slate-900/70 backdrop-blur-sm text-slate-300 text-xs px-3 py-1.5 rounded-full pointer-events-none">
          {loadingLabel}
        </div>
      )}
    </div>
  );
});

GlobeView.displayName = 'GlobeView';
export default GlobeView;
