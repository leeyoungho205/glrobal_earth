// Open-Meteo 지오코딩 API 클라이언트
import type { GeocodingResult, GeocodingResponse } from '../types/map';

const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1';

// 지역명으로 위치 검색
export const searchLocation = async (query: string): Promise<GeocodingResult[]> => {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    name: query,
    count: '5',
    language: 'ko',
    format: 'json',
  });

  const response = await fetch(`${GEOCODING_URL}/search?${params}`);

  if (!response.ok) {
    throw new Error(`위치 검색 실패: ${response.status}`);
  }

  const data: GeocodingResponse = await response.json();
  return data.results ?? [];
};

// 좌표를 이용한 역지오코딩 (가장 가까운 도시명 찾기)
export const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  // Open-Meteo는 역지오코딩을 지원하지 않으므로, 좌표 문자열 반환
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lng).toFixed(2)}°${lngDir}`;
};
