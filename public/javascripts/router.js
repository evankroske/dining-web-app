define(["jquery", "knockout", "restaurant-list-view-model", "restaurants-model", "restaurant-details-view-model", "sign-in-page-view-model", "user-model", "path", "jquerymobile", "domReady!"],
function ($, ko, RestaurantListViewModel, RestaurantsModel,
		RestaurantDetailsViewModel, SignInPageViewModel, UserModel) {
	function startRouter() {
		var restaurantsModel = new RestaurantsModel();
		var userModel = new UserModel();
		var restaurantListViewModel =
			new RestaurantListViewModel(restaurantsModel);
		var restaurantDetailsViewModel =
			new RestaurantDetailsViewModel(restaurantsModel);
		var signInPageViewModel = new SignInPageViewModel(userModel);
		ko.applyBindings({
			user: userModel,
			restaurantList: restaurantListViewModel,
			restaurantDetails: restaurantDetailsViewModel,
			signInPage: signInPageViewModel
		});
		Path.map("#!restaurants").to(function() {
			console.log("#!restaurants");
			restaurantListViewModel.refresh();
			$.mobile.changePage($("#restaurants"));
		});
		Path.map("#!restaurants/:id").to(function () {
			console.log("#!restaurants/:id");
			restaurantDetailsViewModel.restaurantId(this.params["id"]);
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
