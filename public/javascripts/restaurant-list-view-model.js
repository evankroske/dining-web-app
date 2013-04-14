define(["knockout", "restaurant-view-model", "jquery"], function (ko, RestaurantViewModel, $) {
	function RestaurantListViewModel() {
		var self = this;
		var that = self;

		self.loaded = ko.observable(false);
		self.restaurants = ko.observableArray();
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

		$.getJSON("/api/usf/restaurants").then(function (restaurantsJson) {
			return restaurantsJson.map(
				function (data) { return new RestaurantViewModel(data); });
		}).done(function (restaurants) {
			self.loaded(true);
			self.restaurants.unshift.apply(self.restaurants, restaurants);
		}).fail(function () {
			console.log(arguments);
		});;
	}
/*
		restaurantsCache.all().done(function (restaurants) {
			self.loaded(true);
			self.restaurants.unshift.apply(self.restaurants, restaurants);
		}).fail(function () {
			console.log("Failed to load restaurant list");
		});
	*/
	return RestaurantListViewModel;
});
