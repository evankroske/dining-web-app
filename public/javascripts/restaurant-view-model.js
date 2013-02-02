function ObservableBitSet(data) {
	var self = this;
	self.contains = function(i) {
		return (i < data.length * 32 &&
			(data[Math.floor(i / 32)]() & (1 << (i % 32))));
	}
}

function RestaurantViewModel(data) {
	var self = this;
	self.id = data.id;
	self.name = ko.observable(data.name);
	self.hours = data.hours.map(function (e) {
		return ko.observable(e);
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
	self.toString = function() {
		return "[RestaurnantViewModel]";
	}
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
