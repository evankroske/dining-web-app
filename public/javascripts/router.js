define(["jquery", "knockout", "restaurant-list-view-model", "restaurants-model", "restaurant-details-view-model", "path", "jquerymobile", "domReady!"],
function ($, ko, RestaurantListViewModel, RestaurantsModel,
		RestaurantDetailsViewModel) {
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
			$.mobile.changePage($("#restaurants"));
		});
		Path.map("#!restaurants/:id").to(function () {
			console.log("#!restaurants/:id");
			if (!restaurantDetailsViewModel) {
				restaurantDetailsViewModel =
					new RestaurantDetailsViewModel(restaurantsModel);
				// Probably should make sure parameter is integer
				restaurantDetailsViewModel.restaurantId(this.params["id"]);
				ko.applyBindings(restaurantDetailsViewModel, $("#details")[0]);
			}
			else {
				restaurantDetailsViewModel.restaurantId(this.params["id"]);
			}
			$.mobile.changePage("#details");
		});

		Path.map("#!signin").to(function () {
			console.log("#!signin");
			$.mobile.changePage("#signin");
		});

		Path.root("#!restaurants");

		Path.listen();
	}
	return {start: startRouter};
});
