/**
 * Type definitions matching Go structs in web/structs/
 * These ensure type safety between backend and frontend
 */

/**
 * Blog type matching EklhadBlog struct
 * @see web/structs/blog.go
 */
export interface Blog {
	id: string;
	name: string;
	timestamp: number; // int64 in Go, number in TypeScript
	url: string;
	medium_url?: string;
	original_url?: string;
	gist_url?: string;
	path?: string;
	// Computed field added by frontend
	date?: string;
}

/**
 * Link type matching EklhadLink struct
 * @see web/structs/links.go
 */
export interface Link {
	id: string;
	name: string;
	timestamp: number; // int64 in Go, number in TypeScript
	type: string;
	url: string;
}

/**
 * Location type matching EklhadLocation struct
 * @see web/structs/locations.go
 */
export interface Location {
	id: string;
	city?: string;
	stateprovinceregion?: string;
	country?: string;
	current?: boolean;
	layover?: boolean;
	home?: boolean;
	lat: number;
	lng: number;
}

