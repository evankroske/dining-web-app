package models

import anorm._
import anorm.SqlParser._
import play.api.db._
import play.api.Play.current

import java.util.{TimeZone, Date, Calendar}
import java.text.{DateFormat, SimpleDateFormat}

import scala.collection.BitSet
import scala.collection.mutable.MutableList

case class Restaurant(val id: Int, val name: String, val hours: BitSet)

object Restaurant {
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
