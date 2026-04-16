// 디바운스 커스텀 훅 - 입력값의 빠른 변경을 지연시킴
import { useState, useEffect } from 'react';

export const useDebounce = <T>(value: T, delay: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 값이 변경되면 이전 타이머 취소
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
};
