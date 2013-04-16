define(["knockout", "jquery"],
function (ko, $) {
	return (function (restaurantsModel) {
		var self = this;
		self.loaded = ko.observable(false);
		self.restaurant = null;
		self.restaurantId = ko.observable();
		self.restaurantId.subscribe(function (id) {
			self.loaded(false);
			restaurantsModel.restaurantById(id).done(function (r) {
				self.restaurant = r;
				document.title = r.name();
				self.loaded(true);
			});
		});
	});
});
