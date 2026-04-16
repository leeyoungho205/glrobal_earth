// 브라우저 위치 감지 커스텀 훅
import { useState, useEffect } from 'react';
import type { Location } from '../types/map';

interface GeolocationState {
  location: Location | null;  // 감지된 위치
  isLoading: boolean;          // 로딩 중
  error: string | null;        // 에러 메시지
}

// 기본 위치 (서울)
const DEFAULT_LOCATION: Location = {
  lat: 37.5665,
  lng: 126.978,
  name: '서울',
  country: 'South Korea',
};

export const useGeolocation = () => {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    // 브라우저가 Geolocation을 지원하지 않는 경우
    if (!navigator.geolocation) {
      setState({
        location: DEFAULT_LOCATION,
        isLoading: false,
        error: '위치 서비스를 지원하지 않는 브라우저입니다.',
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      // 성공 콜백
      (position) => {
        setState({
          location: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          isLoading: false,
          error: null,
        });
      },
      // 실패 콜백 - 기본 위치(서울)로 폴백
      (error) => {
        let errorMsg = '위치를 가져올 수 없습니다.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = '위치 권한이 거부되었습니다.';
        }
        setState({
          location: DEFAULT_LOCATION,
          isLoading: false,
          error: errorMsg,
        });
      },
      // 옵션
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000, // 5분간 캐시
      }
    );
  }, []);

  return state;
};
