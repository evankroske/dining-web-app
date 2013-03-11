var viewModel = new RestaurantsViewModel();
function startRouter() {
	$.getJSON("/api/usf/restaurants", null, function(data) {
		viewModel.restaurants.unshift.apply(viewModel.restaurants,
			data.map(function(r) { return new RestaurantViewModel(r); }));

	});
	Path.map("#!restaurants").to(function() {
		viewModel.chosenRestaurant(null);
		console.log("Running");
		$.mobile.changePage($("#restaurants"), {"changeHash": false});
	});
	Path.map("#!restaurants/:id").to(function () {
		viewModel.chosenRestaurant(viewModel.restaurants()[0]);
		console.log(viewModel.restaurants);
		$.mobile.changePage("#details", {"changeHash": false});
		console.log("Running details");
	});
	Path.root("#!restaurants");
}
