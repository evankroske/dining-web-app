define(["jquery", "knockout", "restaurant-view-model"],
function($, ko, RestaurantViewModel) {
	return (function () {
		var cache = [];
		var valid = false;
		var self = this;
		self.restaurants = function () {
			if (!valid) {
				return $.getJSON("/api/usf/restaurants").then(function (restaurantsJson) {
					return restaurantsJson.map(
						function (data) { return new RestaurantViewModel(data); });
				}).then(function (restaurants) {
					restaurants.forEach(function (r) {
						cache[r.id] = r;
					});
					valid = true;
					return cache.filter(function (e) { return typeof e !== "undefined" });
				}).promise();
			}
			else {
				return $.Deferred().resolve(cache).promise();
			}
		}
	});
});
