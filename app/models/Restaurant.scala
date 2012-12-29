package models

import anorm._
import anorm.SqlParser._
import java.lang.Long.parseLong
import play.api.db._
import play.api.Play.current

object WeekDay extends Enumeration {
	type WeekDay = Value
	val Sun, Mon, Tue, Wed, Thu, Fri, Sat = Value
}

import WeekDay._

case class Restaurant(val name: String, val hours: Map[WeekDay, Long])

object Restaurant {
	val restaurant = {
		str("name") ~ str("sunday_hours") ~ str("monday_hours") ~
			str("tuesday_hours") ~ str("wednesday_hours") ~ str("thursday_hours") ~
			str("friday_hours") ~ str("saturday_hours") map {
				case name ~ sun ~ mon ~ tue ~ wed ~ thu ~ fri ~ sat => {
					val hourBitMasks = List(sun, mon, tue, wed, thu, fri, sat).map {
						parseLong(_, 2)
					}
					Restaurant(name, WeekDay.values.zip(hourBitMasks).toMap)
				}
			}
	}
	def all(): List[Restaurant] = DB.withConnection { implicit c =>
		SQL("select name, sunday_hours::char(48), monday_hours::char(48), tuesday_hours::char(48), wednesday_hours::char(48), thursday_hours::char(48), friday_hours::char(48), saturday_hours::char(48) from usf_restaurants").as(restaurant *)
	}
}
