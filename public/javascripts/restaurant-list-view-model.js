define(["knockout", "restaurant-view-model"], function (ko, RestaurantViewModel) {
	function RestaurantListViewModel(restaurantsModel) {
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

		restaurantsModel.restaurants().done(function (restaurants) {
			self.restaurants.unshift.apply(self.restaurants, restaurants);
			self.loaded(true);
		}).fail(function () {
			console.log(arguments);
		});
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
