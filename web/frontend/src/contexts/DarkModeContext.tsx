import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DarkModeContextType {
	isDarkMode: boolean;
	toggleDarkMode: () => void;
}

const DarkModeContext = createContext<DarkModeContextType | undefined>(undefined);

interface DarkModeProviderProps {
	children: ReactNode;
}

export function DarkModeProvider({ children }: DarkModeProviderProps) {
	// Check localStorage and system preference on mount
	const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
		// Check localStorage first
		const stored = localStorage.getItem('darkMode');
		if (stored !== null) {
			return stored === 'true';
		}
		// Fall back to system preference
		return window.matchMedia('(prefers-color-scheme: dark)').matches;
	});

	// Apply dark mode class to document element
	useEffect(() => {
		if (isDarkMode) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}
		// Save to localStorage
		localStorage.setItem('darkMode', String(isDarkMode));
	}, [isDarkMode]);

	// Listen for system preference changes
	useEffect(() => {
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const handleChange = (e: MediaQueryListEvent) => {
			// Only update if user hasn't manually set a preference
			if (localStorage.getItem('darkMode') === null) {
				setIsDarkMode(e.matches);
			}
		};

		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	}, []);

	const toggleDarkMode = () => {
		setIsDarkMode((prev) => !prev);
	};

	const value: DarkModeContextType = {
		isDarkMode,
		toggleDarkMode,
	};

	return (
		<DarkModeContext.Provider value={value}>
			{children}
		</DarkModeContext.Provider>
	);
}

export function useDarkMode() {
	const context = useContext(DarkModeContext);
	if (context === undefined) {
		throw new Error('useDarkMode must be used within a DarkModeProvider');
	}
	return context;
}

