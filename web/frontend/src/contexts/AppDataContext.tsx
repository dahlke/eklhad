import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../constants/api';
import type { Location, Blog, Link } from '../types';

interface AppDataState {
	locations: Location[];
	blogs: Blog[];
	links: Link[];
	gravatarUrl: string;
	isFetching: boolean;
}

const initialState: AppDataState = {
	locations: [],
	blogs: [],
	links: [],
	gravatarUrl: '',
	isFetching: false,
};

const AppDataContext = createContext<AppDataState>(initialState);

export function AppDataProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<AppDataState>(initialState);

	useEffect(() => {
		setState(prev => ({ ...prev, isFetching: true }));
		fetch(`${API_BASE_URL}/app-data`)
			.then(r => {
				if (!r.ok) throw new Error('Failed to fetch app data');
				return r.json();
			})
			.then(data => setState({
				locations: Array.isArray(data.locations) ? data.locations : [],
				blogs: Array.isArray(data.blogs) ? data.blogs : [],
				links: Array.isArray(data.links) ? data.links : [],
				gravatarUrl: data.gravatar_url ?? '',
				isFetching: false,
			}))
			.catch(err => {
				console.error('Error fetching app data:', err);
				setState(prev => ({ ...prev, isFetching: false }));
			});
	}, []);

	return (
		<AppDataContext.Provider value={state}>
			{children}
		</AppDataContext.Provider>
	);
}

export function useAppData() {
	return useContext(AppDataContext);
}
