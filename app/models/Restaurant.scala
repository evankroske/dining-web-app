package models

import anorm._
import anorm.SqlParser._
import play.api.db._
import play.api.Play.current

import java.util.{TimeZone, Date, Calendar}
import java.text.{DateFormat, SimpleDateFormat}

import scala.collection.BitSet
import scala.collection.mutable.MutableList

import scala.collection.immutable.BitSet.{fromArray => bitSetFromArray}
import scala.math._
import java.lang.Integer.parseInt

case class Restaurant(val id: Int, val name: String, val hours: BitSet)

object Restaurant {
	implicit def bitSet2JsNumberSeq(b: BitSet): Seq[JsNumber] = {
		val numInts = (ceil((b max) / 32.0)).toInt
		(0 until numInts) map { i =>
			JsNumber(parseInt(
					(30 to 0 by -1) map { j =>
						if (b contains (i * 32 + j)) '1'
						else '0'
					} mkString, 2) | (if (b contains (i * 32 + 31)) 1 << 31 else 0))
		}
	}

	implicit val bitSetFormat: Format[BitSet] = (
		__.read[List[Int]].grouped(2).map {
			case List(lsb, msb) => Long(msb) << 32 | Long(lsb) && 0xffffffffL
			case List(msb) => Long(msb) << 32
	)(BitSet.fromBitMask, BitSet.toBitMask)
	implicit val restaurantFormat: Format[Restaurant] = (
		(__ \ "id").read[Int] ~
		(__ \ "name").read[String] ~ 
		(__ \ "hours").read[List[Long]].map { l =>
			l.zipWithIndex
	)(Restaurant.apply, unlift(Restaurant.unapply))

	val restaurant = {
		int("id") ~ str("name") ~ str("hours") map {
				case id ~ name ~ hours => {
					val weekBitSet = BitSet((hours zipWithIndex) collect {
						case ('1', i) => i
					}: _*)
					Restaurant(id, name, weekBitSet)
				}
			}
	}

	def all(): List[Restaurant] = DB.withConnection { implicit c =>
		SQL("""
			select id, name, hours::char(336)
			from restaurants
			order by name""").as(restaurant *)
	}

	def details(id: Int) = DB.withConnection { implicit c =>
		SQL("""select id, name, hours::char(336)
		from usf_restaurants where id = {id}""").on("id" -> id).
			as(ResultSetParser.singleOpt(restaurant))
	}
}
