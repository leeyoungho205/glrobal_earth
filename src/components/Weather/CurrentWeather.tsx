// 현재 날씨 카드 컴포넌트
import type { CurrentWeather as CurrentWeatherType } from '../../types/weather';
import { getWeatherInfo, getWindDirection } from '../../utils/weatherCodes';
import { formatTemp, formatWindSpeed, formatHumidity, formatPressure, formatPrecipitation } from '../../utils/formatters';

interface Props {
  weather: CurrentWeatherType;
  locationName: string;
}

const CurrentWeather = ({ weather, locationName }: Props) => {
  const weatherInfo = getWeatherInfo(weather.weatherCode);

  return (
    <div className="space-y-4">
      {/* 위치명 + 날씨 상태 */}
      <div>
        <h2 className="text-lg font-semibold text-white truncate">{locationName}</h2>
        <p className="text-sm text-slate-400">{weatherInfo.description}</p>
      </div>

      {/* 메인 온도 + 아이콘 */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-5xl font-bold text-white">{formatTemp(weather.temperature)}</span>
          <p className="text-sm text-slate-400 mt-1">
            체감 {formatTemp(weather.feelsLike)}
          </p>
        </div>
        <span className="text-5xl">{weatherInfo.icon}</span>
      </div>

      {/* 상세 정보 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        <DetailItem label="습도" value={formatHumidity(weather.humidity)} />
        <DetailItem label="바람" value={`${formatWindSpeed(weather.windSpeed)} ${getWindDirection(weather.windDirection)}`} />
        <DetailItem label="기압" value={formatPressure(weather.pressure)} />
        <DetailItem label="강수량" value={formatPrecipitation(weather.precipitation)} />
        <DetailItem label="구름" value={`${weather.cloudCover}%`} />
        <DetailItem label="돌풍" value={formatWindSpeed(weather.windGusts)} />
      </div>
    </div>
  );
};

// 상세 정보 항목 컴포넌트
const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-slate-800/50 rounded-lg p-2.5">
    <p className="text-xs text-slate-400">{label}</p>
    <p className="text-sm font-medium text-white">{value}</p>
  </div>
);

export default CurrentWeather;
