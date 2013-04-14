define(["jquery", "knockout", "restaurant-list-view-model", "path", "jquerymobile", "domReady!"], function ($, ko, RestaurantListViewModel) {
	var restaurantListViewModel;
	var restaurantDetailsViewModel;
	function startRouter() {
	/*
		$.getJSON("/api/usf/restaurants", null, function(data) {
			viewModel.restaurants.unshift.apply(viewModel.restaurants,
				data.map(function(r) { return new RestaurantViewModel(r); }));
		});
	*/
		Path.map("#!restaurants").to(function() {
			restaurantListViewModel = restaurantListViewModel ||
				new RestaurantListViewModel();
			ko.applyBindings(restaurantListViewModel, $("#restaurants")[0]);
			$.mobile.changePage($("#restaurants"), {"changeHash": false});
		});
		Path.map("#!restaurants/:id").to(function () {
			/*
			ko.applyBindings(null, $("#details")[0]);
			*/
			$.mobile.changePage("#details", {"changeHash": false});
		});
		Path.root("#!restaurants");
		Path.listen();
	}
	return {start: startRouter};
});
