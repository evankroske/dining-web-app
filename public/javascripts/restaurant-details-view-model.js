define(["knockout"],
function (ko) {
	return (function (restaurantsModel) {
		var self = this;
		self.loaded = ko.observable(false);
		self.restaurant = null;
		self.restaurantId = ko.observable();
		self.restaurantId.subscribe(function (id) {
			self.loaded(false);
			restaurantsModel.restaurantById(id).done(function (r) {
				self.restaurant = r;
				self.loaded(true);
			});
		});
	});
});
