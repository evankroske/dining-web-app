define(["knockout", "restaurant-view-model"], function (ko, RestaurantViewModel) {
	return (function (restaurantsModel) {
		var self = this;
		var that = self;

		self.loaded = ko.observable(false);
		self.restaurants = ko.observableArray();

		self.refresh = function () {
			return restaurantsModel.restaurants().done(function (restaurants) {
				self.restaurants.removeAll();
				self.restaurants.unshift.apply(self.restaurants, restaurants);
				self.loaded(true);
			}).fail(function () {
				console.log(arguments);
			});
		};
		self.refresh();

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

		self.deleteRestaurant = function (r) {
			self.restaurants.remove(r);
			restaurantsModel.remove(r);
			console.log(r.id + " deleted");
		};
	});
});
