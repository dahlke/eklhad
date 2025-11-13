import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../constants/api';
import type { Blog } from '../types';

interface BlogsState {
	items: Blog[];
	isFetching: boolean;
	lastUpdated: number | null;
}

interface BlogsContextType extends BlogsState {
	fetchBlogs: () => Promise<void>;
}

const BlogsContext = createContext<BlogsContextType | undefined>(undefined);

const initialState: BlogsState = {
	items: [],
	isFetching: false,
	lastUpdated: null,
};

interface BlogsProviderProps {
	children: ReactNode;
}

export function BlogsProvider({ children }: BlogsProviderProps) {
	const [state, setState] = useState<BlogsState>(initialState);

	const fetchBlogs = useCallback(async () => {
		setState((prev) => ({ ...prev, isFetching: true }));
		try {
			const response = await fetch(`${API_BASE_URL}/blogs`);
			if (!response.ok) {
				throw new Error('Failed to fetch blogs');
			}
			const blogs = await response.json() as Blog[];
			if (!Array.isArray(blogs)) {
				throw new Error('Expected array of blogs');
			}
			setState({
				items: blogs,
				isFetching: false,
				lastUpdated: Date.now(),
			});
		} catch (error) {
			console.error('Error fetching blogs:', error);
			setState((prev) => ({ ...prev, isFetching: false }));
		}
	}, []);

	// Fetch blogs on mount
	useEffect(() => {
		fetchBlogs();
	}, [fetchBlogs]);

	const value: BlogsContextType = {
		...state,
		fetchBlogs,
	};

	return (
		<BlogsContext.Provider value={value}>
			{children}
		</BlogsContext.Provider>
	);
}

export function useBlogs() {
	const context = useContext(BlogsContext);
	if (context === undefined) {
		throw new Error('useBlogs must be used within a BlogsProvider');
	}
	return context;
}

