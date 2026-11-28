'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import {
    createContext,
    ReactNode,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';

const FONT_SCALE_STORAGE_KEY = 'opennote:font-scale';
const REDUCE_MOTION_STORAGE_KEY = 'opennote:reduce-motion';

export const MIN_FONT_SCALE = 85;
export const MAX_FONT_SCALE = 125;
export const FONT_SCALE_STEP = 5;

type UserPreferencesContextValue = {
    fontScale: number;
    increaseFontScale: () => void;
    decreaseFontScale: () => void;
    resetFontScale: () => void;
    reduceMotion: boolean;
    setReduceMotion: (value: boolean) => void;
};

const UserPreferencesContext = createContext<UserPreferencesContextValue>({
    fontScale: 100,
    increaseFontScale: () => {},
    decreaseFontScale: () => {},
    resetFontScale: () => {},
    reduceMotion: false,
    setReduceMotion: () => {},
});

export function useUserPreferences() {
    return useContext(UserPreferencesContext);
}

function clampFontScale(value: number): number {
    return Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, value));
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
    const [fontScale, setFontScale] = useState<number>(100);
    const [reduceMotion, setReduceMotionState] = useState<boolean>(false);
    const [hasLoadedStorage, setHasLoadedStorage] = useState<boolean>(false);

    useEffect(() => {
        try {
            const savedScale = window.localStorage.getItem(FONT_SCALE_STORAGE_KEY);
            if (savedScale) {
                const parsedScale = Number(savedScale);
                if (!Number.isNaN(parsedScale)) {
                    setFontScale(clampFontScale(parsedScale));
                }
            }

            const savedReduceMotion = window.localStorage.getItem(REDUCE_MOTION_STORAGE_KEY);
            if (savedReduceMotion === 'true') {
                setReduceMotionState(true);
            }
        } catch {
            // Ignora erros de acesso ao localStorage
        } finally {
            setHasLoadedStorage(true);
        }
    }, []);

    useEffect(() => {
        if (!hasLoadedStorage) {
            return;
        }

        document.documentElement.style.fontSize = `${fontScale}%`;
        try {
            window.localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(fontScale));
        } catch {
            // Ignora erros de acesso ao localStorage
        }
    }, [fontScale, hasLoadedStorage]);

    useEffect(() => {
        if (!hasLoadedStorage) {
            return;
        }

        document.documentElement.classList.toggle('reduce-motion', reduceMotion);
        try {
            window.localStorage.setItem(REDUCE_MOTION_STORAGE_KEY, String(reduceMotion));
        } catch {
            // Ignora erros de acesso ao localStorage
        }
    }, [reduceMotion, hasLoadedStorage]);

    const increaseFontScale = useCallback(() => {
        setFontScale((prev) => clampFontScale(prev + FONT_SCALE_STEP));
    }, []);

    const decreaseFontScale = useCallback(() => {
        setFontScale((prev) => clampFontScale(prev - FONT_SCALE_STEP));
    }, []);

    const resetFontScale = useCallback(() => {
        setFontScale(100);
    }, []);

    const setReduceMotion = useCallback((value: boolean) => {
        setReduceMotionState(value);
    }, []);

    return (
        <NextThemesProvider attribute="class" defaultTheme="system" enableSystem={true}>
            <UserPreferencesContext.Provider
                value={{
                    fontScale,
                    increaseFontScale,
                    decreaseFontScale,
                    resetFontScale,
                    reduceMotion,
                    setReduceMotion,
                }}
            >
                {children}
            </UserPreferencesContext.Provider>
        </NextThemesProvider>
    );
}