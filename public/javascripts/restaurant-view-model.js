define(["knockout", "moment"], function(ko, moment) {
	var HALF_HRS_PER_DAY = 48;
	var HALF_HRS_PER_WEEK = 7 * HALF_HRS_PER_DAY;
	var LATEST_CLOSE_HALF_HR_INDEX = 4 * 2 + 1;

	function ObservableBitSet(hours) {
		var self = this;
		self.contains = function(i) {
			return (i < hours().length * 32 &&
				(hours()[Math.floor(i / 32)] & (1 << (i % 32))));
		}
	}

	function halfHrIndexToTime(halfHrIndex) {
		return moment().day(halfHrIndex / HALF_HRS_PER_DAY).
			hours(halfHrIndex % HALF_HRS_PER_DAY / 2).
			minutes(halfHrIndex % 48 % 2 * 30);
	}

	function halfHrIndexToUtc(halfHrIndex, timeZoneOffset) {
		return (halfHrIndex - timeZoneOffset * 2 + HALF_HRS_PER_WEEK)
			% HALF_HRS_PER_WEEK;
	}

	function makeComputedHours(dayIndex, hours, timeZoneOffset) {
		return ko.computed({
			deferEvaluation: true,
			read: function () {
				var intervals = (function () {
					var start = 0;
					while (hours.contains(
							halfHrIndexToUtc(start + dayIndex * HALF_HRS_PER_DAY, timeZoneOffset)) &&
						start <= LATEST_CLOSE_HALF_HR_INDEX) {
						++start;
					}
					start = start <= LATEST_CLOSE_HALF_HR_INDEX ? start : 0;
					var intervals = [];
					while (true) {
						while (!hours.contains(
								halfHrIndexToUtc(start + dayIndex * HALF_HRS_PER_DAY,
									timeZoneOffset)) &&
							start < HALF_HRS_PER_DAY) {
							++start;
						}
						if (start >= HALF_HRS_PER_DAY) break;
						var end = start;
						while (hours.contains(
								halfHrIndexToUtc(end + dayIndex * HALF_HRS_PER_DAY,
									timeZoneOffset)) &&
							end <= HALF_HRS_PER_DAY + LATEST_CLOSE_HALF_HR_INDEX) {
							++end;
						}
						if (end <= HALF_HRS_PER_DAY + LATEST_CLOSE_HALF_HR_INDEX) {
							intervals.push([start, [end]]);
						}
						else {
							intervals.push([start, []]);
						}
						start = end;
					}
					return intervals;
				})();

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
			}
		});
	}

	function RestaurantViewModel(data) {
		var self = this;
		self.id = data.id;
		self.name = ko.observable(data.name);
		self.hours = ko.observable(data.hours);
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
	}
	return RestaurantViewModel;
});
