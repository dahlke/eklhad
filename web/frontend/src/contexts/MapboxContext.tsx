import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../constants/api';

interface MapboxState {
	token: string;
	isFetching: boolean;
	lastUpdated: number | null;
}

interface MapboxContextType extends MapboxState {
	fetchMapboxToken: () => Promise<void>;
}

const MapboxContext = createContext<MapboxContextType | undefined>(undefined);

const initialState: MapboxState = {
	token: '',
	isFetching: false,
	lastUpdated: null,
};

interface MapboxProviderProps {
	children: ReactNode;
}

export function MapboxProvider({ children }: MapboxProviderProps) {
	const [state, setState] = useState<MapboxState>(initialState);

	const fetchMapboxToken = useCallback(async () => {
		setState((prev) => ({ ...prev, isFetching: true }));
		try {
			const response = await fetch(`${API_BASE_URL}/mapbox-token`);
			if (!response.ok) {
				throw new Error('Failed to fetch mapbox token');
			}
			const token = await response.json();
			setState({
				token,
				isFetching: false,
				lastUpdated: Date.now(),
			});
		} catch (error) {
			console.error('Error fetching mapbox token:', error);
			setState((prev) => ({ ...prev, isFetching: false }));
		}
	}, []);

	// Fetch mapbox token on mount
	useEffect(() => {
		fetchMapboxToken();
	}, [fetchMapboxToken]);

	const value: MapboxContextType = {
		...state,
		fetchMapboxToken,
	};

	return (
		<MapboxContext.Provider value={value}>
			{children}
		</MapboxContext.Provider>
	);
}

export function useMapbox() {
	const context = useContext(MapboxContext);
	if (context === undefined) {
		throw new Error('useMapbox must be used within a MapboxProvider');
	}
	return context;
}

