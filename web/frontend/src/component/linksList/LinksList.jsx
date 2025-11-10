// Import necessary dependencies
import React, { useState } from "react";

// Define the LinksList component
function LinksList({ blogs }) {
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
	const blogLinks = blogs.map((blog) => (
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
