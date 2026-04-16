// 앱 헤더 컴포넌트
import SearchBar from '../Search/SearchBar';
import type { GlobeInstance } from 'globe.gl';

interface Props {
  globeRef?: React.RefObject<GlobeInstance | undefined>;
}

const Header = ({ globeRef }: Props) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 p-3 md:p-4">
      <div className="flex items-center gap-3">
        {/* 앱 로고 + 이름 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-lg">🌍</span>
          </div>
          <h1 className="text-white font-bold text-lg hidden sm:block">Global Earth</h1>
        </div>

        {/* 검색바 */}
        <SearchBar globeRef={globeRef} />
      </div>
    </header>
  );
};

export default Header;
