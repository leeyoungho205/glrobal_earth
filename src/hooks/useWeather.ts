// 날씨 데이터 패칭 커스텀 훅 (React Query 기반)
import { useQuery } from '@tanstack/react-query';
import { fetchWeatherData, parseCurrentWeather, parseDailyForecast } from '../services/weatherApi';

// 특정 좌표의 날씨 데이터를 가져오는 훅
export const useWeather = (lat: number | null, lng: number | null) => {
  const query = useQuery({
    // 위치 기반 캐시 키
    queryKey: ['weather', lat, lng],
    queryFn: async () => {
      if (lat === null || lng === null) throw new Error('좌표 없음');
      const raw = await fetchWeatherData(lat, lng);
      return {
        current: parseCurrentWeather(raw),
        daily: parseDailyForecast(raw),
        timezone: raw.timezone,
      };
    },
    // 좌표가 있을 때만 실행
    enabled: lat !== null && lng !== null,
    // 현재 날씨는 10분마다 갱신
    staleTime: 10 * 60 * 1000,
    // 캐시는 30분 유지
    gcTime: 30 * 60 * 1000,
    // 에러 시 2번 재시도
    retry: 2,
  });

  return {
    currentWeather: query.data?.current ?? null,
    dailyForecast: query.data?.daily ?? [],
    timezone: query.data?.timezone ?? '',
    isLoading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch,
  };
};
