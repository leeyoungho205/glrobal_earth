// 7일+ 예보 리스트 컴포넌트 (가로 스크롤)
import type { DailyForecast } from '../../types/weather';
import ForecastCard from './ForecastCard';

interface Props {
  forecasts: DailyForecast[];
}

const ForecastList = ({ forecasts }: Props) => {
  if (forecasts.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-medium text-slate-300 mb-2">16일 예보</h3>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {forecasts.map((forecast, index) => (
          <ForecastCard
            key={forecast.date}
            forecast={forecast}
            isToday={index === 0}
          />
        ))}
      </div>
    </div>
  );
};

export default ForecastList;
