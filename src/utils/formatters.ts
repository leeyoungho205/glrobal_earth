// 날짜, 온도 등 포맷 유틸리티 함수

// 온도 포맷 (소수점 1자리)
export const formatTemp = (temp: number): string => {
  return `${Math.round(temp)}°`;
};

// 풍속 포맷
export const formatWindSpeed = (speed: number): string => {
  return `${Math.round(speed)} km/h`;
};

// 강수량 포맷
export const formatPrecipitation = (mm: number): string => {
  return `${mm.toFixed(1)} mm`;
};

// 습도 포맷
export const formatHumidity = (humidity: number): string => {
  return `${Math.round(humidity)}%`;
};

// 기압 포맷
export const formatPressure = (pressure: number): string => {
  return `${Math.round(pressure)} hPa`;
};

// 날짜를 요일로 변환 (한국어)
export const getDayName = (dateStr: string): string => {
  const date = new Date(dateStr);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[date.getDay()];
};

// 날짜 포맷 (M/D)
export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

// 시간 포맷 (HH:MM)
export const formatTime = (timeStr: string): string => {
  const date = new Date(timeStr);
  return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
};

// 좌표를 보기 좋게 포맷
export const formatCoords = (lat: number, lng: number): string => {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lng).toFixed(2)}°${lngDir}`;
};
