// 위치 검색 바 컴포넌트
import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchLocation } from '../../services/geocodingApi';
import { useDebounce } from '../../hooks/useDebounce';
import { useMapStore } from '../../store/mapStore';
import type { GlobeInstance } from 'globe.gl';

interface Props {
  globeRef?: React.RefObject<GlobeInstance | undefined>;
}

const SearchBar = ({ globeRef }: Props) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedQuery = useDebounce(query, 300);
  const { setSelectedLocation, setPointOfView } = useMapStore();

  // 디바운스된 검색어로 API 호출
  const { data: results = [] } = useQuery({
    queryKey: ['geocoding', debouncedQuery],
    queryFn: () => searchLocation(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    staleTime: 24 * 60 * 60 * 1000, // 24시간 캐시
  });

  // 검색 결과 선택 시
  const handleSelect = (result: typeof results[0]) => {
    setSelectedLocation({
      lat: result.latitude,
      lng: result.longitude,
      name: result.name,
      country: result.country,
    });
    setPointOfView({ lat: result.latitude, lng: result.longitude, altitude: 1.0 });

    // 지구본 카메라 이동
    if (globeRef?.current) {
      globeRef.current.pointOfView(
        { lat: result.latitude, lng: result.longitude, altitude: 1.0 },
        1000
      );
    }

    setQuery('');
    setIsOpen(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative w-full max-w-sm">
      {/* 검색 입력 */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
        >
          <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder="도시 검색..."
          className="w-full pl-9 pr-4 py-2.5 bg-slate-800/80 backdrop-blur-sm border border-slate-700/50 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/25"
        />
      </div>

      {/* 검색 결과 드롭다운 */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-slate-800/95 backdrop-blur-md border border-slate-700/50 rounded-xl overflow-hidden shadow-xl z-50">
          {results.map((result) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              className="w-full text-left px-4 py-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700/30 last:border-b-0"
            >
              <p className="text-sm text-white font-medium">{result.name}</p>
              <p className="text-xs text-slate-400">
                {result.admin1 ? `${result.admin1}, ` : ''}{result.country}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
