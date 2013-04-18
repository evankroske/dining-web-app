define(["jquery"],
function($) {
	return (function () {
		var self = this;

		self.authenticate = function (email, password) {
			return $.ajax({
				url: "/api/authenticate",
				contentType: "application/json",
				dataType: "json",
				data: JSON.stringify({email: email, password: password})
			});
		};
	});
});
