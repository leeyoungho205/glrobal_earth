// 날씨 상세 정보 그리드 컴포넌트 (UV, 일출/일몰, 시정 등)
import type { DailyForecast } from '../../types/weather';
import { formatTime } from '../../utils/formatters';

interface Props {
  forecast: DailyForecast; // 오늘 예보 데이터
}

// UV 지수를 위험도 텍스트로 변환
const getUvLabel = (uv: number): string => {
  if (uv <= 2) return '낮음';
  if (uv <= 5) return '보통';
  if (uv <= 7) return '높음';
  if (uv <= 10) return '매우 높음';
  return '위험';
};

// UV 지수에 따른 색상 클래스
const getUvColor = (uv: number): string => {
  if (uv <= 2) return 'text-green-400';
  if (uv <= 5) return 'text-yellow-400';
  if (uv <= 7) return 'text-orange-400';
  if (uv <= 10) return 'text-red-400';
  return 'text-purple-400';
};

const WeatherDetails = ({ forecast }: Props) => {
  return (
    <div>
      <h3 className="text-sm font-medium text-slate-300 mb-2">오늘 상세</h3>
      <div className="grid grid-cols-2 gap-2">
        {/* 일출 */}
        <DetailCard
          label="일출"
          value={formatTime(forecast.sunrise)}
          icon="🌅"
        />
        {/* 일몰 */}
        <DetailCard
          label="일몰"
          value={formatTime(forecast.sunset)}
          icon="🌇"
        />
        {/* UV 지수 */}
        <DetailCard
          label="자외선"
          value={`${forecast.uvIndexMax.toFixed(1)} (${getUvLabel(forecast.uvIndexMax)})`}
          icon="☀️"
          valueClassName={getUvColor(forecast.uvIndexMax)}
        />
        {/* 최대 풍속 */}
        <DetailCard
          label="최대 풍속"
          value={`${Math.round(forecast.windSpeedMax)} km/h`}
          icon="💨"
        />
        {/* 강수량 합계 */}
        <DetailCard
          label="강수량"
          value={`${forecast.precipitationSum.toFixed(1)} mm`}
          icon="🌧️"
        />
        {/* 최대 강수 확률 */}
        <DetailCard
          label="강수 확률"
          value={`${forecast.precipitationProbMax}%`}
          icon="☔"
        />
      </div>
    </div>
  );
};

// 상세 정보 카드
const DetailCard = ({
  label,
  value,
  icon,
  valueClassName = 'text-white',
}: {
  label: string;
  value: string;
  icon: string;
  valueClassName?: string;
}) => (
  <div className="bg-slate-800/50 rounded-lg p-2.5 flex items-start gap-2">
    <span className="text-lg flex-shrink-0">{icon}</span>
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-sm font-medium ${valueClassName}`}>{value}</p>
    </div>
  </div>
);

export default WeatherDetails;
