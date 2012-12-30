package models

import anorm._
import anorm.SqlParser._
import java.lang.Long.parseLong
import play.api.db._
import play.api.Play.current
import java.util.{TimeZone, Date, Calendar}
import java.text.SimpleDateFormat

object WeekDay extends Enumeration {
	type WeekDay = Value
	val Sun, Mon, Tue, Wed, Thu, Fri, Sat = Value
}

import WeekDay._

case class Restaurant(val id: Int, val name: String, val hours: Map[WeekDay, Long])

object Restaurant {
	val restaurant = {
		int("id") ~ str("name") ~ str("sunday_hours") ~ str("monday_hours") ~
			str("tuesday_hours") ~ str("wednesday_hours") ~ str("thursday_hours") ~
			str("friday_hours") ~ str("saturday_hours") map {
				case id ~ name ~ sun ~ mon ~ tue ~ wed ~ thu ~ fri ~ sat => {
					val hourBitMasks = List(sun, mon, tue, wed, thu, fri, sat).map {
						parseLong(_, 2)
					}
					Restaurant(id, name, WeekDay.values.zip(hourBitMasks).toMap)
				}
			}
	}

	def all(): List[Restaurant] = DB.withConnection { implicit c =>
		SQL("""select id, name, sunday_hours::char(48), monday_hours::char(48),
			tuesday_hours::char(48), wednesday_hours::char(48),
			thursday_hours::char(48), friday_hours::char(48),
			saturday_hours::char(48)
			from usf_restaurants
			order by name""").as(restaurant *)
	}

	private def nowDayAndMask(userTZ: TimeZone) = {
		val df = new SimpleDateFormat("EEEE")
		df.setTimeZone(userTZ)
		val dayOfWeek = df.format(new Date).toLowerCase
		val halfHourIndex = {
			val c = df.getCalendar
			2 * c.get(Calendar.HOUR_OF_DAY) + c.get(Calendar.MINUTE) / 30
		}
		val halfHourMask = Array.fill(48)('0').updated(halfHourIndex, '1').mkString
		(dayOfWeek, halfHourMask)
	}

	def open(userTZ: TimeZone): List[Restaurant] = DB.withConnection {
		implicit c =>
		val (dayOfWeek, halfHourMask) = nowDayAndMask(userTZ)
		val q = SQL("""select id, name, sunday_hours::char(48), monday_hours::char(48), tuesday_hours::char(48), wednesday_hours::char(48), thursday_hours::char(48), friday_hours::char(48), saturday_hours::char(48)
			from usf_restaurants
			where (%s_hours & {mask}::bit(48))::bigint > 0
			order by name""".format(dayOfWeek)).
			on("mask" -> halfHourMask)
		q.as(restaurant *)
	}

	def closed(userTZ: TimeZone): List[Restaurant] = DB.withConnection {
		implicit c =>
		val (dayOfWeek, halfHourMask) = nowDayAndMask(userTZ)
		val q = SQL("""select id, name, sunday_hours::char(48), monday_hours::char(48), tuesday_hours::char(48), wednesday_hours::char(48), thursday_hours::char(48), friday_hours::char(48), saturday_hours::char(48)
			from usf_restaurants
			where (%s_hours & {mask}::bit(48))::bigint = 0
			order by name""".format(dayOfWeek)).
			on("mask" -> halfHourMask)
		q.as(restaurant *)
	}

	def details(id: Int, userTZ: TimeZone) = DB.withConnection { implicit c =>
		SQL("""select id, name, sunday_hours::char(48), monday_hours::char(48), tuesday_hours::char(48), wednesday_hours::char(48), thursday_hours::char(48), friday_hours::char(48), saturday_hours::char(48)
		from usf_restaurants where id = {id}""").on("id" -> id).
			as(ResultSetParser.singleOpt(restaurant))
	}
}
