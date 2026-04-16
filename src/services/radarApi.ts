// RainViewer 강수 레이더 API 클라이언트

// RainViewer 날씨 맵 응답 타입
export interface RadarFrame {
  time: number;  // Unix 타임스탬프
  path: string;  // 타일 경로
}

export interface WeatherMapsResponse {
  version: string;
  generated: number;
  host: string;
  radar: {
    past: RadarFrame[];
    nowcast: RadarFrame[];
  };
}

// 레이더 프레임 목록 가져오기
export const fetchRadarFrames = async (): Promise<WeatherMapsResponse> => {
  const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
  if (!response.ok) {
    throw new Error(`레이더 데이터 조회 실패: ${response.status}`);
  }
  return response.json();
};

// 레이더 타일 URL 생성
// colorScheme: 0-8 (2=원색, 4=옵션 1)
// smooth: 1=스무딩 적용
// snow: 1=눈 표시
export const getRadarTileUrl = (
  host: string,
  path: string,
  z: number,
  x: number,
  y: number,
  colorScheme = 2,
  smooth = 1,
  snow = 1
): string => {
  return `${host}${path}/256/${z}/${x}/${y}/${colorScheme}/${smooth}_${snow}.png`;
};
