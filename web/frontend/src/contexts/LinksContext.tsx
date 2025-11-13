import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../constants/api';
import type { Link } from '../types';

interface LinksState {
	items: Link[];
	isFetching: boolean;
	lastUpdated: number | null;
}

interface LinksContextType extends LinksState {
	fetchLinks: () => Promise<void>;
}

const LinksContext = createContext<LinksContextType | undefined>(undefined);

const initialState: LinksState = {
	items: [],
	isFetching: false,
	lastUpdated: null,
};

interface LinksProviderProps {
	children: ReactNode;
}

export function LinksProvider({ children }: LinksProviderProps) {
	const [state, setState] = useState<LinksState>(initialState);

	const fetchLinks = useCallback(async () => {
		setState((prev) => ({ ...prev, isFetching: true }));
		try {
			const response = await fetch(`${API_BASE_URL}/links`);
			if (!response.ok) {
				throw new Error('Failed to fetch links');
			}
			const links = await response.json() as Link[];
			if (!Array.isArray(links)) {
				throw new Error('Expected array of links');
			}
			setState({
				items: links,
				isFetching: false,
				lastUpdated: Date.now(),
			});
		} catch (error) {
			console.error('Error fetching links:', error);
			setState((prev) => ({ ...prev, isFetching: false }));
		}
	}, []);

	// Fetch links on mount
	useEffect(() => {
		fetchLinks();
	}, [fetchLinks]);

	const value: LinksContextType = {
		...state,
		fetchLinks,
	};

	return (
		<LinksContext.Provider value={value}>
			{children}
		</LinksContext.Provider>
	);
}

export function useLinks() {
	const context = useContext(LinksContext);
	if (context === undefined) {
		throw new Error('useLinks must be used within a LinksProvider');
	}
	return context;
}

