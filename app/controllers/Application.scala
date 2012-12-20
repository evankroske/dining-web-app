package controllers

import play.api._
import play.api.mvc._
import org.bouncycastle.crypto.PBEParametersGenerator.PKCS5PasswordToUTF8Bytes
import org.bouncycastle.crypto.generators.PKCS5S2ParametersGenerator
import org.bouncycastle.crypto.params._

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
		Ok("Hello, world!")
	}
}
