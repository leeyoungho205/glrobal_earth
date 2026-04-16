// 날씨 데이터 상태 관리 스토어
import { create } from 'zustand';
import type { CurrentWeather, DailyForecast } from '../types/weather';

interface WeatherState {
  // 현재 날씨
  currentWeather: CurrentWeather | null;
  setCurrentWeather: (weather: CurrentWeather | null) => void;

  // 일별 예보
  dailyForecast: DailyForecast[];
  setDailyForecast: (forecast: DailyForecast[]) => void;

  // 로딩 상태
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  // 에러 상태
  error: string | null;
  setError: (error: string | null) => void;

  // 마지막 업데이트 시간
  lastUpdated: Date | null;
  setLastUpdated: (date: Date | null) => void;
}

export const useWeatherStore = create<WeatherState>((set) => ({
  currentWeather: null,
  setCurrentWeather: (weather) => set({ currentWeather: weather }),

  dailyForecast: [],
  setDailyForecast: (forecast) => set({ dailyForecast: forecast }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  error: null,
  setError: (error) => set({ error }),

  lastUpdated: null,
  setLastUpdated: (date) => set({ lastUpdated: date }),
}));
