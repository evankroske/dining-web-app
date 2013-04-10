var viewModel = new RestaurantsViewModel();
function startRouter() {
	$.getJSON("/api/usf/restaurants", null, function(data) {
		viewModel.restaurants.unshift.apply(viewModel.restaurants,
			data.map(function(r) { return new RestaurantViewModel(r); }));
	});
	console.log("refreshed");
	Path.map("#!restaurants").to(function() {
		viewModel.chosenRestaurant(null);
		ko.applyBindings(viewModel, $("#restaurants")[0]);
		$.mobile.changePage($("#restaurants"), {"changeHash": false});
	});
	Path.map("#!restaurants/:id").to(function () {
		viewModel.chosenRestaurant(viewModel.restaurants()[0]);
		ko.applyBindings(viewModel.chosenRestaurant, $("#details")[0]);
		$.mobile.changePage("#details", {"changeHash": false});
	});
	Path.root("#!restaurants");
}
