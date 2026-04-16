// Global Earth 메인 앱 컴포넌트
import { useEffect, useRef, lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { GlobeInstance } from 'globe.gl';
// Three.js가 포함된 GlobeView를 lazy 로딩으로 초기 번들 크기 감소
const GlobeView = lazy(() => import('./components/Globe/GlobeView'));
import GlobeControls from './components/Globe/GlobeControls';
import Header from './components/Layout/Header';
import WeatherPanel from './components/Weather/WeatherPanel';
import LayerToggle from './components/UI/LayerToggle';
import TimeSlider from './components/UI/TimeSlider';
import { useGeolocation } from './hooks/useGeolocation';
import { useMapStore } from './store/mapStore';

// React Query 클라이언트 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

const AppContent = () => {
  const globeRef = useRef<GlobeInstance | undefined>(undefined);
  const { setSelectedLocation, setPointOfView, activeLayer } = useMapStore();
  const { location, isLoading: geoLoading } = useGeolocation();

  // 앱 마운트 즉시 스플래시 숨기기 (지구본 로딩은 백그라운드에서 계속)
  useEffect(() => {
    const timer = setTimeout(() => {
      (window as Window & { __hideSplash?: () => void }).__hideSplash?.();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // 현재 위치 감지 후 지구본 이동
  useEffect(() => {
    if (!geoLoading && location) {
      setSelectedLocation(location);
      setPointOfView({ lat: location.lat, lng: location.lng, altitude: 1.5 });
      if (globeRef.current) {
        globeRef.current.pointOfView(
          { lat: location.lat, lng: location.lng, altitude: 1.5 },
          1500
        );
      }
    }
  }, [geoLoading, location, setSelectedLocation, setPointOfView]);

  return (
    <div className="relative w-full h-full">
      {/* 3D 지구본 (전체 배경) - lazy 로딩 */}
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent" />
        </div>
      }>
        <GlobeView ref={globeRef} />
      </Suspense>

      {/* 상단 헤더 + 검색바 */}
      <Header globeRef={globeRef} />

      {/* 우측 하단: 레이어 토글 + 레이더 슬라이더 + 컨트롤 버튼 */}
      <div className="fixed bottom-6 right-4 z-30 flex flex-col gap-3 items-end">
        <LayerToggle />
        {/* 레이더 레이어 활성 시 타임슬라이더 표시 */}
        {activeLayer === 'radar' && <TimeSlider />}
        <GlobeControls globeRef={globeRef} />
      </div>

      {/* 날씨 정보 패널 */}
      <WeatherPanel />

      {/* 로딩 오버레이 (초기 위치 감지 중) */}
      {geoLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-500 border-t-transparent mx-auto mb-4" />
            <p className="text-slate-300">위치를 감지하고 있습니다...</p>
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppContent />
  </QueryClientProvider>
);

export default App;
