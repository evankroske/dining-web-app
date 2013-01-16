package controllers

import play.api._
import play.api.mvc._
import play.api.libs.json._
import org.bouncycastle.crypto.PBEParametersGenerator.PKCS5PasswordToUTF8Bytes
import org.bouncycastle.crypto.generators.PKCS5S2ParametersGenerator
import org.bouncycastle.crypto.params._
import java.util.TimeZone

import models.Restaurant

object Api extends Controller {
	def restaurants = Action {
		Ok(Json.toJson(Restaurant.all))
	}
}
