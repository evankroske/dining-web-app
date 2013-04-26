package controllers

import play.api._
import play.api.mvc._
import play.api.libs.json._

import models._

object Api extends Controller {
	def restaurants() = Action {
		Ok(Json.toJson(Restaurant.all))
	}

	def restaurant(id: Int) = Action {
		Restaurant.byId(id).map(r => Ok(Json.toJson(r))).
			getOrElse(NotFound("Not found"))
	}

	def deleteRestaurant(id: Int) = Action { request =>
		request.session.get("admin").collect {
			case "true" => {
				Restaurant.delete(id)
				Logger.debug("Restaurant %d deleted".format(id))
				Ok("Restaurant %d deleted".format(id))
			}
			case _ => Forbidden("Not authorized")
		} getOrElse Unauthorized("Not authenticated. Sign in please")
	}

	def updateRestaurant(id: Int) = Action(parse.json) { request =>
		request.session.get("admin").collect {
			case "true" => {
				request.body.validate[Restaurant].fold(
					errors => BadRequest("fail"),
					restaurant => if (restaurant.id == id) {
							if (Restaurant.update(restaurant) > 0) {
								Logger.debug("Restaurant %d updated".format(id))
								Ok("Restaurant %d updated".format(id))
							}
							else {
								NotFound("No restaurant with id %d".format(id))
							}
						}
						else {
							BadRequest("id must match")
						}
				)
			}
			case _ => Forbidden("Not authorized")
		} getOrElse Unauthorized("Not authenticated. Sign in please")
	}
	def authenticate() = Action(parse.json) { request =>
		request.body.validate[User].fold(
			errors => BadRequest("Fail"),
			user => {
				User.authenticate(user) match {
					case Some(user) => Ok(Json.toJson(user)).
						withSession("email" -> user.email,
							"admin" -> user.admin.map(_.toString).getOrElse("false"))
					case _ => UnprocessableEntity("Fail")
				}
			}
		)
	}
}
