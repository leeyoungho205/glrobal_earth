// 레이더 시간 슬라이더 컴포넌트
import { useRadarFrames } from '../../hooks/useRadarFrames';

// Unix 타임스탬프를 시간 문자열로 변환
const formatTimestamp = (ts: number): string => {
  const date = new Date(ts * 1000);
  return date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const TimeSlider = () => {
  const {
    frames,
    currentIndex,
    isPlaying,
    isLoading,
    setFrameIndex,
    togglePlay,
  } = useRadarFrames();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-slate-400 text-xs">
        <div className="animate-spin h-3 w-3 border border-slate-400 border-t-transparent rounded-full" />
        레이더 로딩 중...
      </div>
    );
  }

  if (frames.length === 0) return null;

  const currentTime = frames[currentIndex]?.time
    ? formatTimestamp(frames[currentIndex].time)
    : '';

  return (
    <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl p-3 w-72">
      {/* 헤더: 현재 시간 + 재생 버튼 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-blue-400 text-xs font-medium">📡 레이더</span>
          <span className="text-slate-300 text-xs">{currentTime}</span>
        </div>
        <button
          onClick={togglePlay}
          className="text-white hover:text-blue-400 transition-colors"
          aria-label={isPlaying ? '정지' : '재생'}
        >
          {isPlaying ? (
            // 정지 아이콘
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          ) : (
            // 재생 아이콘
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      </div>

      {/* 슬라이더 */}
      <input
        type="range"
        min={0}
        max={frames.length - 1}
        value={currentIndex}
        onChange={(e) => setFrameIndex(Number(e.target.value))}
        className="w-full h-1.5 accent-blue-500 cursor-pointer"
      />

      {/* 프레임 시간 표시 */}
      <div className="flex justify-between mt-1">
        <span className="text-xs text-slate-500">
          {frames[0]?.time ? formatTimestamp(frames[0].time) : ''}
        </span>
        <span className="text-xs text-slate-500">
          {frames[frames.length - 1]?.time
            ? formatTimestamp(frames[frames.length - 1].time)
            : ''}
        </span>
      </div>
    </div>
  );
};

export default TimeSlider;
