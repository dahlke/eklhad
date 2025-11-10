// Import necessary dependencies
import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { format, fromUnixTime } from "date-fns";
import { RootState } from "../../reducers/index";

// Define interfaces for our data structures
interface Link {
	timestamp: number;
	[key: string]: any;
}

interface Blog {
	timestamp: number;
	date?: string;
	id?: string;
	url?: string;
	name?: string;
	[key: string]: any;
}

// Helper function to sort data by timestamp in descending order
function sortByTimestamp(rawData: Link[]): Link[] {
	const data = rawData || [];
	data.sort((a, b) => b.timestamp - a.timestamp);
	return data;
}

// Helper function to process and sort blog data
function processBlogs(blogs: Blog[]): Blog[] {
	// Add a formatted date to each blog entry
	blogs.map((blog) => {
		const processedBlog = blog;
		const d = format(fromUnixTime(processedBlog.timestamp), "yyyy-MM-dd");
		processedBlog.date = d;
		return processedBlog;
	});

	// Sort the processed blogs by timestamp
	return sortByTimestamp(blogs);
}

// Define the LinksList component
function LinksList() {
	// Get data from Redux store
	const rawLinks = useSelector((state: RootState) => state.links.items);
	const rawBlogs = useSelector((state: RootState) => state.blogs.items || []);

	// Process and sort the data
	const sortedLinks = useMemo(() => sortByTimestamp(rawLinks), [rawLinks]);
	const sortedBlogs = useMemo(() => processBlogs(rawBlogs), [rawBlogs]);

	// Initialize state
	const [showHistoricalLinks, setShowHistoricalLinks] = useState(false);

	// Toggle the visibility of historical links
	const toggleHistoricalLinks = () => {
		setShowHistoricalLinks((prevState) => !prevState);
	};

	// Determine the text for the toggle button
	const historicalLinkButtonText = showHistoricalLinks
		? "Hide Blogs"
		: "Show Blogs";

	// Create an array of blog link elements
	const blogLinks = sortedBlogs.map((blog) => (
		<div key={blog.id}>
			<span className="block text-xs mt-6">
				[
				{blog.date}
				] [
				Blog
				]
			</span>
			<a
				href={blog.url}
				target="_blank"
				rel="noopener noreferrer"
				className="underline"
			>
				{blog.name}
			</a>
		</div>
	));

	// Render the component
	return (
		<div id="links-list">
			{/* Toggle button for showing/hiding blogs */}
			<button
				type="button"
				className="text-xs border border-solid border-indigo-500 hover:bg-gray-200 p-2 m-5 rounded"
				onClick={toggleHistoricalLinks}
			>
				{historicalLinkButtonText}
			</button>
			{/* Conditionally render blog links based on state */}
			{showHistoricalLinks ? blogLinks : null}
		</div>
	);
}

// Export the component
export default LinksList;
