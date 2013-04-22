define(["jquery", "knockout", "jquerycookie"],
function($, ko) {
	return (function () {
		var self = this;

		var anonymousUser = {};
		self.user = ko.observable(
			$.cookie("user") ? JSON.parse($.cookie("user")) : anonymousUser);

		var cookieOptions = {
			expires: 365,
			path: "/"
		};

		self.authenticate = function (email, password) {
			return $.ajax({
				type: "post",
				url: "/api/authenticate",
				contentType: "application/json",
				dataType: "json",
				data: JSON.stringify({email: email, password: password})
			}).done(function (authenticatedUser) {
				self.user(authenticatedUser);
				$.cookie("user", JSON.stringify(authenticatedUser), cookieOptions);
			});
		};

		self.signOut = function () {
			self.user(anonymousUser);
			$.removeCookie("user", cookieOptions);
		};
	});
});
