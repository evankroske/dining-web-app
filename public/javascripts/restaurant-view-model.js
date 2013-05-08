define(["knockout", "moment"], function(ko, moment) {
	var HALF_HRS_PER_WEEK = 7 * 48;
	var LATEST_CLOSE_HALF_HR_INDEX = 4 * 2 + 1;

	function ObservableBitSet(hours) {
		var self = this;
		self.contains = function(i) {
			return (i < hours.length * 32 &&
				(hours[Math.floor(i / 32)]() & (1 << (i % 32))));
		};

		self.set = function (i) {
			var j = Math.floor(i / 32);
			hours[j](hours[j]() | (1 << (i % 32)));
		};

		self.clear = function (i) {
			var j = Math.floor(i / 32);
			hours[j](hours[j]() & ~(1 << (i % 32)));
		};
	}

	function halfHrIndexToTime(halfHrIndex) {
		return moment().day(halfHrIndex / 48).
			hours(halfHrIndex % 48 / 2).
			minutes(halfHrIndex % 48 % 2 * 30);
	}

	function timeToHalfHrIndex(time) {
		return time.day() * 48 +
			time.hour() * 2 +
			time.minute() / 30;
	}

	function halfHrIndexToUtc(halfHrIndex, timeZoneOffset) {
		return (halfHrIndex - timeZoneOffset * 2 + HALF_HRS_PER_WEEK)
			% HALF_HRS_PER_WEEK;
	}

	function firstIntervalStartIndex(dayIndex, hours, timeZoneOffset) {
		var start = 0;
		while (hours.contains(
				halfHrIndexToUtc(start + dayIndex * 48, timeZoneOffset)) &&
			start <= LATEST_CLOSE_HALF_HR_INDEX) {
			++start;
		}
		start = start <= LATEST_CLOSE_HALF_HR_INDEX ? start : 0;
		return start;
	}

	function makeComputedHours(dayIndex, hours, timeZoneOffset) {
		return ko.computed({
			deferEvaluation: true,
			read: function () {
				var intervals = (function () {
					var start = firstIntervalStartIndex(dayIndex, hours, timeZoneOffset);
					var intervals = [];
					while (true) {
						while (!hours.contains(
								halfHrIndexToUtc(start + dayIndex * 48,
									timeZoneOffset)) &&
							start < 48) {
							++start;
						}
						if (start >= 48) break;
						var end = start;
						while (hours.contains(
								halfHrIndexToUtc(end + dayIndex * 48,
									timeZoneOffset)) &&
							end <= 48 + LATEST_CLOSE_HALF_HR_INDEX) {
							++end;
						}
						if (end <= 48 + LATEST_CLOSE_HALF_HR_INDEX) {
							intervals.push([start, [end]]);
						}
						else {
							intervals.push([start, []]);
						}
						start = end;
					}
					return intervals;
				})();

				if (intervals.length === 0) {
					return "Closed";
				}

				var timeIntervals = intervals.map(function (interval) {
					return [halfHrIndexToTime(interval[0]),
						interval[1].map(function(end) {
							return halfHrIndexToTime(end);
						})
					];
				});

				var stringIntervals = timeIntervals.map(function(interval) {
					var startTime = interval[0], endTimeOpt = interval[1];
					var timeFormat = "h:mm a";
					if (endTimeOpt.length === 0) {
						if (startTime.hours() === 0 && startTime.minutes() === 0) {
							return "24 hours";
						}
						else {
							return startTime.format(timeFormat) + " – No close";
						}
					}
					else {
						return startTime.format(timeFormat) + " – " +
							endTimeOpt[0].format(timeFormat);
					}
				});

				return stringIntervals.join(" and ");
			},
			write: function (hoursStr) {
				var timeFormat = "h:mm a";
				var intervalStrings = hoursStr.split(/\s*and\s*/);
				var midnightTmrw = moment("0:00", "H:mm").day((dayIndex + 1) % 7);

				var intervals = intervalStrings.map(function (intervalStr) {
					if (intervalStr === "24 hours") {
						return [moment("0:00", "H:mm").day(dayIndex), midnightTmrw];
					} else {
						var boundaryTimeStrs = intervalStr.split(/\s*(?:–|-|to)\s*/);
						var startTimeStr = boundaryTimeStrs[0];
						var endTimeStr = boundaryTimeStrs[1];
						if (endTimeStr === "No close") {
							return [moment(startTimeStr, timeFormat).day(dayIndex),
								midnightTmrw];
						}
						else {
							var startTime = moment(startTimeStr, timeFormat).day(dayIndex);
							var endTime = moment(endTimeStr, timeFormat).day(dayIndex);
							if (endTime.isBefore(startTime)) {
								endTime.day((dayIndex + 1) % 7);
							}
							return [startTime, endTime];
						}
					}
				});

				var intervalIndices = intervals.map(function (interval) {
					var startIndex = timeToHalfHrIndex(interval[0]);
					var endIndex = timeToHalfHrIndex(interval[1]);
					return [startIndex, endIndex];
				});

				var intervalIndicesUtc = intervalIndices.map(function (indexPair) {
					return [halfHrIndexToUtc(indexPair[0], timeZoneOffset),
						halfHrIndexToUtc(indexPair[1], timeZoneOffset)];
				});

				for (var i = firstIntervalStartIndex(dayIndex, hours, timeZoneOffset);
						i < 48; ++i) {
					hours.clear(halfHrIndexToUtc(i + dayIndex * 48, timeZoneOffset));
				}
				intervalIndices.forEach(function (interval) {
					var limit = (interval[1] > interval[0]) ?
						interval[1] :
						interval[1] + NUM_HALF_HRS_IN_WEEK;
					for (var i = interval[0]; i < limit; ++i) {
						hours.set(halfHrIndexToUtc(i, timeZoneOffset));
					}
				});
			}
		});
	}

	function RestaurantViewModel(data) {
		var self = this;
		self.id = data.id;
		self.name = ko.observable(data.name);
		self.hours = data.hours.map(function (bitmask) {
			return ko.observable(bitmask);
		});
		self.hoursBitSet = new ObservableBitSet(self.hours);
		self.open = ko.computed(function() {
			var now = moment();
			var nowUtcNoDst = now.clone().utc();
			var halfHrIndex = nowUtcNoDst.day() * 48 +
				nowUtcNoDst.hours() * 2 +
				Math.floor(nowUtcNoDst.minutes() / 30);
			return self.hoursBitSet.contains(halfHrIndex);
		});
		self.prettyHours = (function () {
			var hoursByDay = [];
			for (var i = 0; i < 7; ++i) {
				// Assume eastern time zone
				var timeZoneOffset = -5;
				hoursByDay.push(makeComputedHours(i, self.hoursBitSet, timeZoneOffset));
			}
			return hoursByDay;
		})();
		self.toJSON = function () {
			return ({
				id: self.id,
				name: self.name(),
				hours: self.hours.map(ko.utils.unwrapObservable) // TESTME
			});
		};
	}
	return RestaurantViewModel;
});
