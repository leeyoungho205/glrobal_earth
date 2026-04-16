// WMO 날씨 코드 → 아이콘/설명 매핑
// 참고: https://open-meteo.com/en/docs#weathervariables

interface WeatherCodeInfo {
  description: string;       // 한국어 설명
  descriptionEn: string;     // 영어 설명
  icon: string;              // 이모지 아이콘
}

// WMO 날씨 코드 매핑 테이블
const weatherCodeMap: Record<number, WeatherCodeInfo> = {
  0:  { description: '맑음', descriptionEn: 'Clear sky', icon: '☀️' },
  1:  { description: '대체로 맑음', descriptionEn: 'Mainly clear', icon: '🌤️' },
  2:  { description: '구름 조금', descriptionEn: 'Partly cloudy', icon: '⛅' },
  3:  { description: '흐림', descriptionEn: 'Overcast', icon: '☁️' },
  45: { description: '안개', descriptionEn: 'Fog', icon: '🌫️' },
  48: { description: '상고대 안개', descriptionEn: 'Rime fog', icon: '🌫️' },
  51: { description: '가벼운 이슬비', descriptionEn: 'Light drizzle', icon: '🌦️' },
  53: { description: '이슬비', descriptionEn: 'Moderate drizzle', icon: '🌦️' },
  55: { description: '강한 이슬비', descriptionEn: 'Dense drizzle', icon: '🌧️' },
  56: { description: '가벼운 진눈깨비', descriptionEn: 'Light freezing drizzle', icon: '🌧️' },
  57: { description: '강한 진눈깨비', descriptionEn: 'Dense freezing drizzle', icon: '🌧️' },
  61: { description: '가벼운 비', descriptionEn: 'Slight rain', icon: '🌦️' },
  63: { description: '비', descriptionEn: 'Moderate rain', icon: '🌧️' },
  65: { description: '강한 비', descriptionEn: 'Heavy rain', icon: '🌧️' },
  66: { description: '가벼운 빙우', descriptionEn: 'Light freezing rain', icon: '🌧️' },
  67: { description: '강한 빙우', descriptionEn: 'Heavy freezing rain', icon: '🌧️' },
  71: { description: '가벼운 눈', descriptionEn: 'Slight snow', icon: '🌨️' },
  73: { description: '눈', descriptionEn: 'Moderate snow', icon: '🌨️' },
  75: { description: '강한 눈', descriptionEn: 'Heavy snow', icon: '❄️' },
  77: { description: '싸락눈', descriptionEn: 'Snow grains', icon: '❄️' },
  80: { description: '가벼운 소나기', descriptionEn: 'Slight rain showers', icon: '🌦️' },
  81: { description: '소나기', descriptionEn: 'Moderate rain showers', icon: '🌧️' },
  82: { description: '강한 소나기', descriptionEn: 'Violent rain showers', icon: '🌧️' },
  85: { description: '가벼운 눈소나기', descriptionEn: 'Slight snow showers', icon: '🌨️' },
  86: { description: '강한 눈소나기', descriptionEn: 'Heavy snow showers', icon: '❄️' },
  95: { description: '뇌우', descriptionEn: 'Thunderstorm', icon: '⛈️' },
  96: { description: '우박 동반 뇌우', descriptionEn: 'Thunderstorm with slight hail', icon: '⛈️' },
  99: { description: '강한 우박 뇌우', descriptionEn: 'Thunderstorm with heavy hail', icon: '⛈️' },
};

// 날씨 코드로 정보 가져오기
export const getWeatherInfo = (code: number): WeatherCodeInfo => {
  return weatherCodeMap[code] ?? { description: '알 수 없음', descriptionEn: 'Unknown', icon: '❓' };
};

// 풍향 각도를 방위로 변환
export const getWindDirection = (degrees: number): string => {
  const directions = ['북', '북동', '동', '남동', '남', '남서', '서', '북서'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
};
