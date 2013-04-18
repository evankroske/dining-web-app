define(["knockout"],
function (ko) {
	return (function(userModel) {
		var self = this;
		self.email = ko.observable();
		self.password = ko.observable();

		self.authenticate = function (data, e) {
			e.preventDefault();
			userModel.authenticate(self.email(), self.password()).
				done(function () {
					window.location.hash = "#!restaurants";
				}).fail(function () {
					alert("Sign in failed");
				});
		};
	});
});
