var HALF_HRS_PER_DAY = 48;
var HALF_HRS_PER_WEEK = 7 * halfHrsPerDay;
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
	return ko.computed(function () {
		var intervalsForDay = (function () {
			var start = 0;
			while (hours.contains(
					halfHrIndexToUtc(start + dayIndex * halfHrsPerDay)) &&
				start <= LATEST_CLOSE_HALF_HR_INDEX) {
				++start;
			}
			start = start <= LATEST_CLOSE_HALF_HR_INDEX ? start : 0;
			var intervals = [];
			while (true) {
				while (!self.hoursBitSet.contains(
						halfHrIndexToUtc(start + dayIndex * HALF_HRS_PER_DAY)) &&
					start < HALF_HRS_PER_DAY) {
					++start;
				}
				if (start >= HALF_HRS_PER_DAY) break;
				var end = start;
				while (self.hoursBitSet.contains(
						halfHrIndexToUtc(end + dayIndex * HALF_HRS_PER_DAY)) &&
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

		var intervalsByDay = (function (intervals) {
			var intervalsByDay = [];
			for (var i = 0; i < 7; ++i) intervalsByDay.push([]);
			for (var i = 0; i < intervals.length; ++i) {
				var interval = intervals[i];
				var start = interval[0], end = interval[1];
				while (start < end) {
					var startDay = Math.floor(start / halfHrsPerDay),
						endDay = Math.floor(end / halfHrsPerDay);
					if (startDay === endDay ||
						(endDay - startDay === 1 &&
							end % halfHrsPerDay <= 2 * 6)) {
						intervalsByDay[startDay].push([start, [end]]);
						break;
					}
					else
					{
						intervalsByDay[startDay].push(start, []);
						start = (startDay + 1) * halfHrsPerDay;
					}
				}
			}
			return intervalsByDay;
		})(intervalsInThisTimeZone);

		var timeIntervalsByDay = intervalsByDay.map(function (intervals) {
			return intervals.map(function (interval) {
				return [halfHrIndexToTime(interval[0]),
					interval[1].map(function(end) {
						return halfHrIndexToTime(end);
					})
				];
			});
		});

		var stringIntervalsByDay =
			timeIntervalsByDay.map(function(intervals) {
			return intervals.map(function (interval) {
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
		});
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
		return (function () {
			var hoursByDay = [];
			for (var i = 0; i < 7; ++i) {
				hoursByDay.push(makeComputedHours(i));
			}
			return hoursByDay;
		}

	})();
}

function RestaurantsViewModel() {
	var self = this;

	self.restaurants = ko.observableArray();
	self.chosenRestaurant = ko.observable();
	self.open = ko.computed(function() {
		return ko.utils.unwrapObservable(self.restaurants).filter(function(r) {
			return r.open();
		});
	});
	self.closed = ko.computed(function() {
		return ko.utils.unwrapObservable(self.restaurants).filter(function(r) {
			return !r.open();
		});
	});

	Sammy(function() {
		this.get("#!restaurants", function() {
			self.chosenRestaurant(null);
			$.getJSON("/api/usf/restaurants", null, function(data) {
				self.restaurants.unshift.apply(self.restaurants,
					data.map(function(r) { return new RestaurantViewModel(r); }));
			});
		});
		this.get("", function() { this.app.runRoute("get", "#!restaurants"); });
	}).run();
}
