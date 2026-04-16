// 3D 지구본 메인 컴포넌트 - 레이더 오버레이 포함
import { useRef, useCallback, useEffect, useState, useMemo, forwardRef, useImperativeHandle } from 'react';
import Globe from 'react-globe.gl';
import type { GlobeInstance } from 'globe.gl';
import * as THREE from 'three';
import { useMapStore } from '../../store/mapStore';
import { useRadarFrames } from '../../hooks/useRadarFrames';
import { getRadarTileUrl } from '../../services/radarApi';

// 지구본 타일 URL 생성 함수 (CartoDB 다크 테마)
const baseTileUrl = (x: number, y: number, level: number): string =>
  `https://a.basemaps.cartocdn.com/dark_all/${level}/${x}/${y}@2x.png`;

// NASA GIBS 위성 타일 URL (VIIRS 트루컬러)
const getSatelliteTileUrl = (x: number, y: number, level: number): string => {
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/${yesterday}/GoogleMapsCompatible_Level9/${level}/${y}/${x}.jpg`;
};

// 레이더 타일 URL 생성 (RainViewer)
const makeRadarTileUrl = (host: string, path: string) =>
  (x: number, y: number, level: number): string =>
    getRadarTileUrl(host, path, level, x, y);

interface MarkerData {
  lat: number;
  lng: number;
}

// GlobeView가 외부에서 ref를 통해 globeRef를 사용할 수 있도록 forwardRef
const GlobeView = forwardRef<GlobeInstance | undefined>((_, ref) => {
  const globeRef = useRef<GlobeInstance | undefined>(undefined);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const { selectedLocation, setSelectedLocation, pointOfView, setPointOfView, activeLayer } =
    useMapStore();
  const { currentFrame, host } = useRadarFrames();

  // 외부 ref로 내부 globeRef 노출
  useImperativeHandle(ref, () => globeRef.current);

  // 창 크기 변경 감지
  useEffect(() => {
    const handleResize = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 초기 카메라 위치 설정
  useEffect(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView(
        { lat: pointOfView.lat, lng: pointOfView.lng, altitude: pointOfView.altitude },
        0
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 지구본 클릭 시 위치 선택
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

  // 레이어에 따른 타일 URL 선택
  const tileEngineUrl = useMemo(() => {
    if (activeLayer === 'satellite') return getSatelliteTileUrl;
    if (activeLayer === 'radar' && currentFrame && host) {
      return makeRadarTileUrl(host, currentFrame.path);
    }
    return baseTileUrl;
  }, [activeLayer, currentFrame, host]);

  // 선택 위치 마커
  const markerData: MarkerData[] = useMemo(
    () => (selectedLocation ? [{ lat: selectedLocation.lat, lng: selectedLocation.lng }] : []),
    [selectedLocation]
  );

  // 레이더 레이어: 반투명 구체를 지구본 위에 오버레이
  // react-globe.gl의 customLayerData를 이용해 Three.js 객체를 추가
  const radarCustomLayer = useMemo(() => {
    if (activeLayer !== 'radar' || !currentFrame || !host) return [];
    return [{ id: 'radar-overlay' }];
  }, [activeLayer, currentFrame, host]);

  // 레이더 오버레이 Three.js 구체 생성
  const createRadarObject = useCallback(() => {
    if (!currentFrame || !host) return new THREE.Object3D();

    // 지구 반경보다 약간 큰 반투명 구체 (레이더 타일 텍스처 적용)
    const geometry = new THREE.SphereGeometry(101, 64, 64);
    const loader = new THREE.TextureLoader();
    // 레이더 2x2 타일 샘플로 텍스처 테스트 (전구 타일 합성은 향후 고도화)
    const sampleUrl = getRadarTileUrl(host, currentFrame.path, 2, 2, 1);
    const texture = loader.load(sampleUrl);
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      opacity: 0.55,
      side: THREE.FrontSide,
      depthWrite: false,
    });
    return new THREE.Mesh(geometry, material);
  }, [currentFrame, host]);

  return (
    <div className="absolute inset-0">
      <Globe
        ref={globeRef as React.MutableRefObject<GlobeInstance>}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)"
        globeTileEngineUrl={tileEngineUrl}
        showAtmosphere={true}
        atmosphereColor="#3a82f7"
        atmosphereAltitude={0.15}
        onGlobeClick={handleGlobeClick}
        animateIn={true}
        // 선택 위치 마커
        pointsData={markerData}
        pointLat="lat"
        pointLng="lng"
        pointColor={() => '#f59e0b'}
        pointAltitude={0.01}
        pointRadius={0.6}
        pointResolution={12}
        // 레이더 커스텀 레이어
        customLayerData={radarCustomLayer}
        customThreeObject={createRadarObject}
        customThreeObjectUpdate={() => {}} // 위치 업데이트 불필요 (구체라 중심 고정)
      />
    </div>
  );
});

GlobeView.displayName = 'GlobeView';
export default GlobeView;
