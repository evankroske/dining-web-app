package controllers

import play.api._
import play.api.mvc._
import play.api.libs.json._
import org.bouncycastle.crypto.PBEParametersGenerator.PKCS5PasswordToUTF8Bytes
import org.bouncycastle.crypto.generators.PKCS5S2ParametersGenerator
import org.bouncycastle.crypto.params._

import models.Restaurant

object Api extends Controller {
	def restaurants = Action {
		Ok(Json.toJson(Restaurant.all))
	}

	def restaurantById(id: Int) = Action {
		Restaurant.byId(id).map(r => Ok(Json.toJson(r))).
			getOrElse(NotFound("Not found"))
	}
}
