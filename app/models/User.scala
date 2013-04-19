package models

import play.api._
import play.api.libs.json._
import play.api.libs.functional.syntax._
import play.api.data.validation.ValidationError

import anorm._
import anorm.SqlParser._
import play.api.db._
import play.api.Play.current

import org.bouncycastle.crypto.PBEParametersGenerator
import org.bouncycastle.crypto.generators._
import org.bouncycastle.crypto.params.KeyParameter

import java.util.Arrays

case class User(val email: String, val password: String, val admin: Option[Boolean] = None)

object User {
	val userReads: Reads[User] = (
		(__ \ "email").read[String] ~
		(__ \ "password").read[String]
	)((e, p) => User(e, p))

	val userWrites: Writes[User] = (
		(__ \ "email").write[String] ~
		(__ \ "admin").writeNullable[Boolean]
	)(u => (u.email, u.admin))

	implicit val userFormat = Format(userReads, userWrites)

	implicit def rowToByteArray: Column[Array[Byte]] = Column.nonNull {
		(value, meta) =>
			val MetaDataItem(qualified, nullable, clazz) = meta
			value match {
				case data: Array[Byte] => Right(data)
				case _ => Left(TypeDoesNotMatch("Cannot convert " + value + ":" + value.asInstanceOf[AnyRef].getClass + " to Byte Array for column " + qualified))
			}
	}

	val hashParamsParser = (
		get[Array[Byte]]("salt") ~
		int("iteration_count") ~
		get[Array[Byte]]("password_hash")
	)

	val userParser = (
		str("email") ~
		bool("admin")
	)

	val generator = new PKCS5S2ParametersGenerator()

	def bytesToString(a: Array[Byte]) = a.map("%02x".format(_)).mkString

	def passwordMatches(pass: String, salt: Array[Byte], ic: Int, hash: Array[Byte]) = {
		generator.init(
			PBEParametersGenerator.PKCS5PasswordToUTF8Bytes(
				pass.toCharArray),
			salt,
			ic)
		val params = generator.generateDerivedParameters(160).asInstanceOf[KeyParameter]
		Arrays.equals(hash, params.getKey)
	}
	def authenticate(user: User): Option[User] = DB.withConnection { implicit conn =>
		SQL("""
			select salt, iteration_count, password_hash, admin
			from users
			where email = {email}
		""").on("email" -> user.email).as(hashParamsParser ~ bool("admin") singleOpt).collect {
			case salt ~ iterationCount~ hash ~ admin if
				passwordMatches(user.password, salt, iterationCount, hash) =>
					user.copy(admin = Some(admin))
		}
	}
}
