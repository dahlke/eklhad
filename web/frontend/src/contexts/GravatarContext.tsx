import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../constants/api';

interface GravatarState {
	email: string;
	isFetching: boolean;
	lastUpdated: number | null;
}

interface GravatarContextType extends GravatarState {
	fetchGravatar: () => Promise<void>;
}

const GravatarContext = createContext<GravatarContextType | undefined>(undefined);

const initialState: GravatarState = {
	email: '',
	isFetching: false,
	lastUpdated: null,
};

interface GravatarProviderProps {
	children: ReactNode;
}

export function GravatarProvider({ children }: GravatarProviderProps) {
	const [state, setState] = useState<GravatarState>(initialState);

	const fetchGravatar = useCallback(async () => {
		setState((prev) => ({ ...prev, isFetching: true }));
		try {
			const response = await fetch(`${API_BASE_URL}/gravatar`);
			if (!response.ok) {
				throw new Error('Failed to fetch gravatar');
			}
			const email = await response.json();
			setState({
				email,
				isFetching: false,
				lastUpdated: Date.now(),
			});
		} catch (error) {
			console.error('Error fetching gravatar:', error);
			setState((prev) => ({ ...prev, isFetching: false }));
		}
	}, []);

	// Fetch gravatar on mount
	useEffect(() => {
		fetchGravatar();
	}, [fetchGravatar]);

	const value: GravatarContextType = {
		...state,
		fetchGravatar,
	};

	return (
		<GravatarContext.Provider value={value}>
			{children}
		</GravatarContext.Provider>
	);
}

export function useGravatar() {
	const context = useContext(GravatarContext);
	if (context === undefined) {
		throw new Error('useGravatar must be used within a GravatarProvider');
	}
	return context;
}

