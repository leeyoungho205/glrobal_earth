// RainViewer 레이더 + 위성 구름 프레임 관리 훅
import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRadarFrames, type RadarFrame, type SatelliteFrame } from '../services/radarApi';

interface RadarState {
  frames: RadarFrame[];           // 레이더 전체 프레임 목록
  currentIndex: number;           // 현재 레이더 프레임 인덱스
  host: string;                   // 타일 호스트 URL
  isPlaying: boolean;             // 애니메이션 재생 중
  latestCloudFrame: SatelliteFrame | null; // 최신 구름(적외선) 프레임
}

export const useRadarFrames = () => {
  const [state, setState] = useState<RadarState>({
    frames: [],
    currentIndex: 0,
    host: '',
    isPlaying: false,
    latestCloudFrame: null,
  });

  // 5분마다 레이더/구름 프레임 갱신
  const { data, isLoading, error } = useQuery({
    queryKey: ['radar-frames'],
    queryFn: fetchRadarFrames,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 5 * 60 * 1000,
  });

  // 데이터 로드 시 프레임 업데이트
  useEffect(() => {
    if (data) {
      const allFrames = [
        ...data.radar.past,
        ...data.radar.nowcast.slice(0, 2), // 예측 2개 프레임만
      ];

      // 가장 최신 적외선 구름 프레임 추출
      const infraredFrames = data.satellite?.infrared ?? [];
      const latestCloudFrame =
        infraredFrames.length > 0
          ? infraredFrames[infraredFrames.length - 1]
          : null;

      setState(prev => ({
        ...prev,
        frames: allFrames,
        host: data.host,
        latestCloudFrame,
        // 가장 최신 과거 프레임으로 초기화
        currentIndex: data.radar.past.length - 1,
      }));
    }
  }, [data]);

  // 다음 프레임으로 이동
  const nextFrame = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex + 1) % prev.frames.length,
    }));
  }, []);

  // 이전 프레임으로 이동
  const prevFrame = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentIndex: (prev.currentIndex - 1 + prev.frames.length) % prev.frames.length,
    }));
  }, []);

  // 특정 프레임 인덱스로 이동
  const setFrameIndex = useCallback((index: number) => {
    setState(prev => ({ ...prev, currentIndex: index }));
  }, []);

  // 애니메이션 재생/정지 토글
  const togglePlay = useCallback(() => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, []);

  // 자동 재생 처리 (600ms 간격)
  useEffect(() => {
    if (!state.isPlaying || state.frames.length === 0) return;
    const timer = setInterval(nextFrame, 600);
    return () => clearInterval(timer);
  }, [state.isPlaying, state.frames.length, nextFrame]);

  const currentFrame = state.frames[state.currentIndex] ?? null;

  return {
    frames: state.frames,
    currentIndex: state.currentIndex,
    currentFrame,
    host: state.host,
    latestCloudFrame: state.latestCloudFrame, // 구름 오버레이용
    isPlaying: state.isPlaying,
    isLoading,
    error: error?.message ?? null,
    nextFrame,
    prevFrame,
    setFrameIndex,
    togglePlay,
  };
};
