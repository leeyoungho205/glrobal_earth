// RainViewer 강수 레이더 + 위성 구름 API 클라이언트

// 레이더 프레임 타입
export interface RadarFrame {
  time: number;  // Unix 타임스탬프
  path: string;  // 타일 경로
}

// 위성(구름) 프레임 타입
export interface SatelliteFrame {
  time: number;
  path: string;
}

// RainViewer 날씨 맵 전체 응답 타입 (레이더 + 위성 구름 포함)
export interface WeatherMapsResponse {
  version: string;
  generated: number;
  host: string;
  radar: {
    past: RadarFrame[];
    nowcast: RadarFrame[];
  };
  satellite: {
    infrared: SatelliteFrame[]; // 적외선 구름 이미지 프레임
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

// 구름(적외선 위성) 타일 URL 생성
// colorScheme 0 = 기본 적외선 (흰 구름, 투명 맑은 하늘)
export const getCloudTileUrl = (
  host: string,
  path: string,
  z: number,
  x: number,
  y: number,
): string => {
  return `${host}${path}/256/${z}/${x}/${y}/0/0_0.png`;
};

// 구름 타일을 캔버스에 합쳐서 전구(全球) 텍스처 이미지 URL 생성
// zoom=2 → 4×4=16장 타일 → 1024×1024px 캔버스
export const buildCloudCanvasTexture = (
  host: string,
  path: string
): Promise<HTMLCanvasElement> => {
  return new Promise((resolve) => {
    const zoom = 2;
    const tileSize = 256;
    const tilesPerSide = Math.pow(2, zoom); // 4
    const canvas = document.createElement('canvas');
    canvas.width = tileSize * tilesPerSide;   // 1024
    canvas.height = tileSize * tilesPerSide;  // 1024
    const ctx = canvas.getContext('2d')!;

    let loaded = 0;
    const total = tilesPerSide * tilesPerSide; // 16장

    for (let x = 0; x < tilesPerSide; x++) {
      for (let y = 0; y < tilesPerSide; y++) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          // XYZ 타일 좌표 → 캔버스 픽셀 위치에 그리기
          ctx.drawImage(img, x * tileSize, y * tileSize, tileSize, tileSize);
          loaded++;
          if (loaded === total) resolve(canvas); // 전부 로드 완료 시 반환
        };
        img.onerror = () => {
          loaded++;
          if (loaded === total) resolve(canvas);
        };
        img.src = getCloudTileUrl(host, path, zoom, x, y);
      }
    }
  });
};
