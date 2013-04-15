define(["jquery", "knockout", "restaurant-list-view-model", "restaurants-model", "path", "jquerymobile", "domReady!"],
function ($, ko, RestaurantListViewModel, RestaurantsModel) {
	var restaurantListViewModel;
	var restaurantDetailsViewModel;
	var restaurantsModel = new RestaurantsModel();
	function startRouter() {
		Path.map("#!restaurants").to(function() {
			console.log("#!restaurants");
			if (!restaurantListViewModel) {
				restaurantListViewModel = new RestaurantListViewModel(restaurantsModel);
				ko.applyBindings(restaurantListViewModel, $("#restaurants")[0]);
			}
			$.mobile.changePage($("#restaurants"), {"changeHash": false});
		});
		Path.map("#!restaurants/:id").to(function () {
			console.log("#!restaurants/:id");
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
