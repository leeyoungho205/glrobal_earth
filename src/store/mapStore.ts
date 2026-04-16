// 맵/지구본 상태 관리 스토어
import { create } from 'zustand';
import type { Location, GlobePointOfView, LayerType } from '../types/map';

interface MapState {
  // 선택된 위치
  selectedLocation: Location | null;
  setSelectedLocation: (location: Location | null) => void;

  // 지구본 카메라 뷰
  pointOfView: GlobePointOfView;
  setPointOfView: (pov: GlobePointOfView) => void;

  // 활성 레이어
  activeLayer: LayerType;
  setActiveLayer: (layer: LayerType) => void;

  // 레이더 타임스탬프 (Unix)
  radarTimestamp: number | null;
  setRadarTimestamp: (ts: number | null) => void;

  // 날씨 패널 열림 상태
  isPanelOpen: boolean;
  setIsPanelOpen: (open: boolean) => void;
}

export const useMapStore = create<MapState>((set) => ({
  // 초기값: 위치 미선택
  selectedLocation: null,
  setSelectedLocation: (location) => set({ selectedLocation: location, isPanelOpen: !!location }),

  // 초기값: 서울 위에서 지구본 전체 보기
  pointOfView: { lat: 37.5665, lng: 126.978, altitude: 2.5 },
  setPointOfView: (pov) => set({ pointOfView: pov }),

  // 초기값: 기본 지도
  activeLayer: 'base',
  setActiveLayer: (layer) => set({ activeLayer: layer }),

  // 레이더 시간
  radarTimestamp: null,
  setRadarTimestamp: (ts) => set({ radarTimestamp: ts }),

  // 패널 상태
  isPanelOpen: false,
  setIsPanelOpen: (open) => set({ isPanelOpen: open }),
}));
