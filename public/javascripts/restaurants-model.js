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
		};

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
		};

		self.remove = function (r) {
			return $.ajax({
				type: "delete",
				url: "/api/usf/restaurants/" + r.id,
			}).done(function () {
				delete cache[r.id];
			}).fail(function () {
				console.log(arguments);
			});
		};

		self.update = function (r) {
			return $.ajax({
				type: "put",
				url: "/api/usf/restaurants/" + r.id,
				contentType: "application/json",
				data: JSON.stringify(r)
			}).done(function () {
				cache[r.id] = r;
			}).fail(function () {
				console.log(arguments);
			});
		};
	});
});
