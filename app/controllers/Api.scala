package controllers

import play.api._
import play.api.mvc._
import play.api.libs.json._

import models._

object Api extends Controller {
	def restaurants = Action {
		Ok(Json.toJson(Restaurant.all))
	}

	def restaurantById(id: Int) = Action {
		Restaurant.byId(id).map(r => Ok(Json.toJson(r))).
			getOrElse(NotFound("Not found"))
	}

	def authenticate = Action(parse.json) { request =>
		request.body.validate[User].fold(
			errors => BadRequest("Fail"),
			user => {
				User.authenticate(user) match {
					case Some(user) => Ok(Json.toJson(user)).
						withSession("email" -> user.email, "admin" -> user.admin.toString)
					case _ => UnprocessableEntity("Fail")
				}
			}
		)
	}
}
