import { useRef, useEffect } from 'react';

export const useIsMount = () => {
  const isMountRef = useRef(true);
  useEffect(() => {
    isMountRef.current = false;
  }, []);
  return isMountRef.current;
};

export const useAsyncEffect = (setup, dependencies = undefined) => {
    useEffect(() => {
        setup().catch(console.error);
    }, dependencies);
}