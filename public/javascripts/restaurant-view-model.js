function RestaurantViewModel(data) {
	var self = this;
	self.id = data.id;
	self.name = ko.observable(data.name);
	self.hours = ko.observableArray(data.hours);
}

function RestaurantsViewModel() {
	var self = this;

	self.restaurants = ko.observableArray();
	self.chosenRestaurant = ko.observable();

	Sammy(function() {
		this.get("#!restaurants", function() {
			self.chosenRestaurant(null);
			$.getJSON("/api/usf/restaurants", null, function(data) {
				self.restaurants.unshift.apply(self.restaurants, data);
			});
		});
		this.get("", function() { this.app.runRoute("get", "#!restaurants"); });
	}).run();
}
