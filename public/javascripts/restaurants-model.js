define(["jquery", "restaurant-view-model"],
function($, RestaurantViewModel) {
	return (function () {
		var cache = [];
		var valid = false;
		var self = this;
		self.restaurants = function () {
			if (valid) {
				return $.Deferred().resolve(cache.filter(function (e) {
					return typeof e !== "undefined";
				})).promise();
			}
			else {
				return $.getJSON("/api/usf/restaurants").then(function (json) {
						return json.map(function (data) {
							return new RestaurantViewModel(data);
						});
					}).done(function (restaurants) {
						restaurants.forEach(function (r) {
							cache[r.id] = r;
						});
						valid = true;
					}).promise();
			}
		}

		self.restaurantById = function (id) {
			if (typeof cache[id] === "undefined") {
				return $.getJSON("/api/usf/restaurants/" + id).then(function (json) {
					return new RestaurantViewModel(json);
				}).done(function (r) {
					cache[r.id] = r;
				}).promise();
			}
			else {
				return $.Deferred().resolve(cache[id]).promise();
			}
		}
	});
});