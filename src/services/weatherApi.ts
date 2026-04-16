// Open-Meteo 날씨 API 클라이언트
import type { OpenMeteoResponse, CurrentWeather, DailyForecast } from '../types/weather';

const BASE_URL = 'https://api.open-meteo.com/v1';

// 현재 날씨 + 16일 예보 데이터 가져오기
export const fetchWeatherData = async (lat: number, lng: number): Promise<OpenMeteoResponse> => {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    // 현재 날씨 변수
    current: [
      'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
      'precipitation', 'weather_code', 'cloud_cover',
      'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'surface_pressure'
    ].join(','),
    // 시간별 예보 변수
    hourly: [
      'temperature_2m', 'relative_humidity_2m', 'apparent_temperature',
      'precipitation_probability', 'precipitation', 'weather_code',
      'wind_speed_10m', 'wind_direction_10m', 'uv_index'
    ].join(','),
    // 일별 예보 변수
    daily: [
      'weather_code', 'temperature_2m_max', 'temperature_2m_min',
      'apparent_temperature_max', 'apparent_temperature_min',
      'sunrise', 'sunset', 'uv_index_max',
      'precipitation_sum', 'precipitation_probability_max', 'wind_speed_10m_max'
    ].join(','),
    timezone: 'auto',
    forecast_days: '16',
  });

  const response = await fetch(`${BASE_URL}/forecast?${params}`);

  if (!response.ok) {
    throw new Error(`날씨 데이터 조회 실패: ${response.status}`);
  }

  return response.json();
};

// API 응답을 CurrentWeather 타입으로 변환
export const parseCurrentWeather = (data: OpenMeteoResponse): CurrentWeather => {
  const { current } = data;
  return {
    temperature: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    precipitation: current.precipitation,
    weatherCode: current.weather_code,
    cloudCover: current.cloud_cover,
    windSpeed: current.wind_speed_10m,
    windDirection: current.wind_direction_10m,
    windGusts: current.wind_gusts_10m,
    pressure: current.surface_pressure,
    time: current.time,
  };
};

// API 응답을 DailyForecast 배열로 변환
export const parseDailyForecast = (data: OpenMeteoResponse): DailyForecast[] => {
  const { daily } = data;
  return daily.time.map((date, i) => ({
    date,
    weatherCode: daily.weather_code[i],
    tempMax: daily.temperature_2m_max[i],
    tempMin: daily.temperature_2m_min[i],
    feelsLikeMax: daily.apparent_temperature_max[i],
    feelsLikeMin: daily.apparent_temperature_min[i],
    sunrise: daily.sunrise[i],
    sunset: daily.sunset[i],
    uvIndexMax: daily.uv_index_max[i],
    precipitationSum: daily.precipitation_sum[i],
    precipitationProbMax: daily.precipitation_probability_max[i],
    windSpeedMax: daily.wind_speed_10m_max[i],
  }));
};
