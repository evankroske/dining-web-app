package controllers

import play.api._
import play.api.mvc._
import play.api.libs.json._
import org.bouncycastle.crypto.PBEParametersGenerator.PKCS5PasswordToUTF8Bytes
import org.bouncycastle.crypto.generators.PKCS5S2ParametersGenerator
import org.bouncycastle.crypto.params._
import java.util.TimeZone

import models.Restaurant

object Application extends Controller {
  
  def signup = Action {
		val generator = new PKCS5S2ParametersGenerator();
		val salt = Array[Byte](0xf, 0xc, 0x5f)
		var pass: Array[Char] = "password".toArray
		generator.init(PKCS5PasswordToUTF8Bytes(pass),
			salt, 10000)
		val params = generator.generateDerivedParameters(256)
    Ok("What")
  }

	def index = Action {
		Redirect(routes.Application.restaurants)
	}

	def listRestaurants() = Action {
		Ok(Json.toJson(Restaurant.all))
	}

	def restaurants() = Action {
		Ok(views.html.restaurants(Restaurant.open, Restaurant.closed))
	}

	def restaurant(id: Int) = Action {
		Restaurant.details(id) match {
			case Some(r) => 
				Ok(views.html.restaurant(r))
			case None =>
				BadRequest("Too bad")
		}
	}
}
