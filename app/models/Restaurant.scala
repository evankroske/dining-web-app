package models

import anorm._
import anorm.SqlParser._
import play.api.db._
import play.api.Play.current
import play.api.libs.json._
import play.api.libs.functional.syntax._
import play.api.Logger

import scala.collection.immutable.BitSet

case class Restaurant(val id: Int, val name: String, val hours: BitSet)

object Restaurant {
	val bitSetReads: Reads[BitSet] = __.read[Seq[Int]].map[Array[Long]] { l =>
		l.grouped(2).map {
			case List(lsb, msb) => msb.toLong << 32 | lsb.toLong & 0xffffffffL
			case List(lsb) => lsb.toLong
		}.toArray
	}.map(BitSet.fromBitMask _)
	
	object BitSetWrites extends Writes[BitSet] {
		def writes(b: BitSet): JsValue = Json.toJson(b.toBitMask.flatMap { mask =>
			List(mask.toInt, mask >> 32 toInt)
		})
	}

	implicit val bitSetFormat = Format(bitSetReads, BitSetWrites)

	implicit val restaurantFormat: Format[Restaurant] = (
		(__ \ "id").format[Int] ~
		(__ \ "name").format[String] ~ 
		(__ \ "hours").format[BitSet]
	)(Restaurant.apply, unlift(Restaurant.unapply))

	val restaurant = {
		int("id") ~ str("name") ~ str("hours") map {
				case id ~ name ~ hours =>
					val weekBitSet = BitSet((hours zipWithIndex) collect {
						case ('1', i) => i
					}: _*)
					Restaurant(id, name, weekBitSet)
			}
	}

	def all(): List[Restaurant] = DB.withConnection { implicit c =>
		SQL("""
			select id, name, hours::char(336)
			from restaurants
			order by name""").as(restaurant *)
	}

	def byId(id: Int): Option[Restaurant] = DB.withConnection { implicit c =>
		SQL("""select id, name, hours::char(336)
		from restaurants where id = {id}""").on("id" -> id).
			as(ResultSetParser.singleOpt(restaurant))
	}

	def delete(id: Int) = DB.withConnection { implicit connection =>
		Logger.debug("Deleting restaurant %d".format(id))
		SQL("""delete from restaurants
			where id = {id}""").on("id" -> id).execute()
		Logger.debug("Deleted restaurant %d".format(id))
	}
}
