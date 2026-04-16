// 일별 예보 카드 컴포넌트
import type { DailyForecast } from '../../types/weather';
import { getWeatherInfo } from '../../utils/weatherCodes';
import { formatTemp, getDayName, formatDate } from '../../utils/formatters';

interface Props {
  forecast: DailyForecast;
  isToday?: boolean;
}

const ForecastCard = ({ forecast, isToday = false }: Props) => {
  const weatherInfo = getWeatherInfo(forecast.weatherCode);

  return (
    <div className={`flex-shrink-0 w-20 p-2 rounded-xl text-center transition-colors ${
      isToday ? 'bg-blue-600/30 border border-blue-500/50' : 'bg-slate-800/50'
    }`}>
      {/* 요일 */}
      <p className="text-xs text-slate-400">
        {isToday ? '오늘' : `${getDayName(forecast.date)} ${formatDate(forecast.date)}`}
      </p>

      {/* 날씨 아이콘 */}
      <p className="text-2xl my-1">{weatherInfo.icon}</p>

      {/* 최고/최저 기온 */}
      <p className="text-sm font-medium text-white">{formatTemp(forecast.tempMax)}</p>
      <p className="text-xs text-slate-400">{formatTemp(forecast.tempMin)}</p>

      {/* 강수 확률 */}
      {forecast.precipitationProbMax > 0 && (
        <p className="text-xs text-blue-400 mt-1">
          {forecast.precipitationProbMax}%
        </p>
      )}
    </div>
  );
};

export default ForecastCard;
