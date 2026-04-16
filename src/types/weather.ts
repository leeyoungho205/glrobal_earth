// 날씨 데이터 관련 타입 정의

// 현재 날씨 데이터
export interface CurrentWeather {
  temperature: number;        // 현재 기온 (°C)
  feelsLike: number;          // 체감 온도 (°C)
  humidity: number;           // 습도 (%)
  precipitation: number;      // 강수량 (mm)
  weatherCode: number;        // WMO 날씨 코드
  cloudCover: number;         // 구름량 (%)
  windSpeed: number;          // 풍속 (km/h)
  windDirection: number;      // 풍향 (°)
  windGusts: number;          // 돌풍 (km/h)
  pressure: number;           // 기압 (hPa)
  time: string;               // 측정 시간
}

// 일별 예보 데이터
export interface DailyForecast {
  date: string;                    // 날짜 (YYYY-MM-DD)
  weatherCode: number;             // WMO 날씨 코드
  tempMax: number;                 // 최고 기온 (°C)
  tempMin: number;                 // 최저 기온 (°C)
  feelsLikeMax: number;            // 최고 체감 온도
  feelsLikeMin: number;            // 최저 체감 온도
  sunrise: string;                 // 일출 시간
  sunset: string;                  // 일몰 시간
  uvIndexMax: number;              // 최대 자외선 지수
  precipitationSum: number;        // 일 강수량 합계 (mm)
  precipitationProbMax: number;    // 최대 강수 확률 (%)
  windSpeedMax: number;            // 최대 풍속 (km/h)
}

// 시간별 예보 데이터
export interface HourlyForecast {
  time: string;
  temperature: number;
  humidity: number;
  feelsLike: number;
  precipitationProb: number;
  precipitation: number;
  weatherCode: number;
  windSpeed: number;
  windDirection: number;
  uvIndex: number;
}

// Open-Meteo API 응답 타입
export interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    cloud_cover: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
    surface_pressure: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    apparent_temperature_max: number[];
    apparent_temperature_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    precipitation: number[];
    weather_code: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    uv_index: number[];
  };
}
