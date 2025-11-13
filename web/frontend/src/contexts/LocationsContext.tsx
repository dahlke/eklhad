import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../constants/api';
import type { Location } from '../types';

// Re-export Location type for convenience
export type { Location } from '../types';

interface LocationsState {
	items: Location[];
	isFetching: boolean;
	lastUpdated: number | null;
}

interface LocationsContextType extends LocationsState {
	fetchLocations: () => Promise<void>;
}

const LocationsContext = createContext<LocationsContextType | undefined>(undefined);

const initialState: LocationsState = {
	items: [],
	isFetching: false,
	lastUpdated: null,
};

interface LocationsProviderProps {
	children: ReactNode;
}

export function LocationsProvider({ children }: LocationsProviderProps) {
	const [state, setState] = useState<LocationsState>(initialState);

	const fetchLocations = useCallback(async () => {
		setState((prev) => ({ ...prev, isFetching: true }));
		try {
			const response = await fetch(`${API_BASE_URL}/locations`);
			if (!response.ok) {
				throw new Error('Failed to fetch locations');
			}
			const locations = await response.json() as Location[];
			if (!Array.isArray(locations)) {
				throw new Error('Expected array of locations');
			}
			setState({
				items: locations,
				isFetching: false,
				lastUpdated: Date.now(),
			});
		} catch (error) {
			console.error('Error fetching locations:', error);
			setState((prev) => ({ ...prev, isFetching: false }));
		}
	}, []);

	// Fetch locations on mount
	useEffect(() => {
		fetchLocations();
	}, [fetchLocations]);

	const value: LocationsContextType = {
		...state,
		fetchLocations,
	};

	return (
		<LocationsContext.Provider value={value}>
			{children}
		</LocationsContext.Provider>
	);
}

export function useLocations() {
	const context = useContext(LocationsContext);
	if (context === undefined) {
		throw new Error('useLocations must be used within a LocationsProvider');
	}
	return context;
}

