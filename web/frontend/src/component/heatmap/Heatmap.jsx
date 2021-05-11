/* eslint-disable react/no-did-update-set-state */

import React, { Component } from "react";
import PropTypes from 'prop-types';
import Select from "react-select";
import CalendarHeatmap from "react-calendar-heatmap";
import moment from "moment";
import Modal from "react-modal";

import { ActivityFilters } from "../../actions";
import DateDetailList from "../dateDetailList/DateDetailList";

import "./Heatmap.css";

Modal.setAppElement(document.getElementById("root"));

class Heatmap extends Component {
	constructor() {
		super();
		this.state = {
			showModal: false,
		};

		this.handleCloseModal = this.handleCloseModal.bind(this);
	}

	// https://reactjs.org/docs/react-component.html#componentdidupdate
	componentDidUpdate(prevProps) {
		if (this.props.dateFilter !== prevProps.dateFilter) {
			const dataForDate = this.props.dateFilter
				? this.props.heatmapDateMap[this.props.dateFilter]
				: {};

			let totalEvents = 0;
			totalEvents += dataForDate.instagrams
				? dataForDate.instagrams.length
				: 0;
			totalEvents += dataForDate.tweets ? dataForDate.tweets.length : 0;
			totalEvents += dataForDate.links ? dataForDate.links.length : 0;
			totalEvents += dataForDate.githubActivity
				? dataForDate.githubActivity.length
				: 0;

			this.setState({
				showModal: totalEvents > 0,
			});
		}
	}

	handleCloseModal() {
		this.setState({
			showModal: false,
		});

		this.props.setDateFilter("");
	}

	render() {
		const dataForDate = this.props.dateFilter
			? this.props.heatmapDateMap[this.props.dateFilter]
			: [];

		const dateDetailList = this.props.dateFilter ? (
			<DateDetailList data={dataForDate} />
		) : null;

		let mapVals = [];
		if (this.props.activityFilter === ActivityFilters.SHOW_ALL) {
			mapVals = this.props.links.concat(this.props.instagrams);
			mapVals = mapVals.concat(this.props.githubActivity);
		} else if (
			this.props.activityFilter === ActivityFilters.SHOW_INSTAGRAMS
		) {
			mapVals = this.props.instagrams;
		} else if (this.props.activityFilter === ActivityFilters.SHOW_TWEETS) {
			mapVals = this.props.tweets;
		} else if (
			this.props.activityFilter === ActivityFilters.SHOW_GITHUB_ACTIVITY
		) {
			mapVals = this.props.githubActivity;
		} else if (this.props.activityFilter === ActivityFilters.SHOW_LINKS) {
			mapVals = this.props.links;
		}

		const activityOptions = Object.keys(ActivityFilters).map((key) => ({
			value: key,
			label: key,
		}));

		return (
			<div id="heatmap">
				<h3 className="pt-10 pb-5">Last 365 Days of Activity</h3>
				<Select
					className="text-xs w-full md:w-1/2 mx-auto mb-5"
					options={activityOptions}
					value={{
						value: this.props.activityFilter,
						label: this.props.activityFilter,
					}}
					onChange={this.props.setActivityFilter}
					isSearchable={false}
				/>
				<CalendarHeatmap
					startDate={moment().subtract(1, "year").toDate()}
					endDate={moment().toDate()}
					values={mapVals}
					onClick={this.props.setDateFilter}
					showMonthLabels={true}
					showWeekdayLabels={true}
					horizontal={this.props.horizontal}
				/>
				<Modal
					isOpen={this.state.showModal}
					id="heatmap-modal"
					className="eklhad-modal absolute font-mono text-center bg-gray-50 inset-1/10 md:inset-1/4 overflow-scroll p-5 border-solid border-indigo-500"
					contentLabel="Date Detail"
					shouldCloseOnOverlayClick={true}
					onRequestClose={this.handleCloseModal}
				>
					<div className="eklhad-modal-content">
						<button
							type="button"
							className="eklhad-modal-top-x-button"
							onClick={this.handleCloseModal}
						>
							X
						</button>
						<h1>{this.props.dateFilter}</h1>
						{dateDetailList}
						<button
							type="button"
							className="eklhad-modal-bottom-button text-xs border border-solid border-indigo-500 hover:bg-gray-200 p-2 m-5 rounded"
							onClick={this.handleCloseModal}
						>
							Close Modal
						</button>
					</div>
				</Modal>
			</div>
		);
	}
}

Heatmap.defaultProps = {
	dateFilter: "",
};

Heatmap.propTypes = {
	dateFilter: PropTypes.string,
	activityFilter: PropTypes.string.isRequired,
	githubActivity: PropTypes.array.isRequired,
	instagrams: PropTypes.array.isRequired,
	tweets: PropTypes.array.isRequired,
	links: PropTypes.array.isRequired,
	heatmapDateMap: PropTypes.object.isRequired,
	setActivityFilter: PropTypes.func.isRequired,
	setDateFilter: PropTypes.func.isRequired,
	horizontal: PropTypes.bool.isRequired,
};

export default Heatmap;
