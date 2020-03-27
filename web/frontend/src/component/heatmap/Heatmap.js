import React, { Component } from "react";
import Select from "react-select"
import { ActivityVisibilityFilters } from '../../actions'
import PropTypes from 'prop-types';
import CalendarHeatmap from "react-calendar-heatmap";
import DateDetailList from "../../component/dateDetailList/DateDetailList";
import moment from "moment";

import "./Heatmap.scss";


class Heatmap extends Component {

    state = {
        selectedYear: parseInt(moment().subtract(0, "years").format("YYYY")),
        selectedActivityType: ActivityVisibilityFilters.SHOW_ALL,
        selectedDate: null
    }

    _selectDate(cell) {
        this.setState({
            selectedDate: cell ? cell.date : null
        });
    }

    _selectYear(event) {
        this.setState({
            selectedYear: event.value,
            selectedDate: null
        });
    }

    render() {
        // TODO: rename this class / className
        // TODO: cleanup unused
        const years = Array.from(new Set(Object.keys(this.props.heatmapDateMap).map((date) => {
            return parseInt(moment(date).format("YYYY"));
        }))).sort().reverse();

        const startDate = new Date(`${this.state.selectedYear}-01-01`);
        const endDate = new Date(`${this.state.selectedYear}-12-31`);

        const dataForDate = this.state.selectedDate ? this.props.heatmapDateMap[this.state.selectedDate] : [];
        const dateDetailList = this.state.selectedDate ? (
            <DateDetailList
                ref="date-detail-list"
                data={dataForDate}
            />
        ) : null;
        const isSelectedDateMap = parseInt(moment(this.state.selectedDate).format("YYYY")) === this.state.selectedYear;

        var mapVals = [];
        if (this.props.activityVisibilityFilter === ActivityVisibilityFilters.SHOW_ALL) {
            mapVals = this.props.links.concat(this.props.instagrams);
        } else if (this.props.activityVisibilityFilter === ActivityVisibilityFilters.SHOW_INSTAGRAMS) {
            mapVals = this.props.instagrams;
        } else if (this.props.activityVisibilityFilter === ActivityVisibilityFilters.SHOW_LINKS) {
            mapVals = this.props.links;
        }

        const yearOptions = years.map((year) => {
            return {
                value: year,
                label: year
            };
        });

        const activityOptions = [
            {
                value: ActivityVisibilityFilters.SHOW_ALL,
                label: "Show All"
            },
            {
                value: ActivityVisibilityFilters.SHOW_INSTAGRAMS,
                label: "Show Instagrams"
            },
            {
                value: ActivityVisibilityFilters.SHOW_LINKS,
                label: "Show Links"
            }
        ];

        const filteredOptions = activityOptions.filter((activity) => {
            return activity.value == this.props.activityVisibilityFilter;
        });

        const selectedActivityValue = filteredOptions.length > 0 ? filteredOptions[0] : null;

        return (
            <div className="heatmap">
                <div className="select">
                <Select
                    options={yearOptions}
                    value={{value: this.state.selectedYear, label: this.state.selectedYear}}
                    onChange={this._selectYear.bind(this)}
                    isSearchable={false}
                />
                </div>

                <div className="select wide">
                <Select
                    options={activityOptions}
                    value={selectedActivityValue}
                    onChange={this.props.setActivityVisibilityFilter}
                    isSearchable={false}
                />
                </div>

                <h4>{this.props.year}</h4>
                <CalendarHeatmap
                    startDate={startDate}
                    endDate={endDate}
                    values={mapVals}
                    onClick={this._selectDate.bind(this)}
                    showMonthLabels={true}
                    showWeekdayLabels={true}
                    horizontal={this.props.horizontal}
                />
                {isSelectedDateMap ? dateDetailList : undefined}
            </div>
        );
    }
}

// TODO
Heatmap.propTypes = {
  instagrams: PropTypes.array,
  links: PropTypes.array
}

Heatmap.defaultProps = {
  instagrams: [],
  links: []
};

export default Heatmap;
