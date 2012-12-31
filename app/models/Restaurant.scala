package models

import anorm._
import anorm.SqlParser._
import java.lang.Long.parseLong
import play.api.db._
import play.api.Play.current
import java.util.{TimeZone, Date, Calendar}
import java.text.SimpleDateFormat
import scala.collection.BitSet
import scala.collection.mutable.MutableList

object WeekDay extends Enumeration {
	type WeekDay = Value
	val Sun, Mon, Tue, Wed, Thu, Fri, Sat = Value
}

import WeekDay._

case class Restaurant(val id: Int, val name: String, val hours: BitSet) {
	def prettyHours(userTZ: TimeZone) = {
		
	}

	def intervalsByDay() = {
		val intervals = MutableList[Tuple2[Int, Int]]()
		val NUM_HALF_HRS_IN_DAY = 48;
		val NUM_HALF_HRS_IN_WEEK = 7 * 48
		var start = 0
		while (hours.contains(start) && start < NUM_HALF_HRS_IN_WEEK) {
			start += 1
		}
		
		// put all intervals in intervals list
		if (start == NUM_HALF_HRS_IN_WEEK) {
			val numHalfHrs = NUM_HALF_HRS_IN_DAY
			(0).until(7).foreach { i =>
				intervals += ((i * numHalfHrs, (i + 1) * numHalfHrs - 1))
			}
		}
		else {
			var end = 0
			while (start < NUM_HALF_HRS_IN_WEEK) {
				while (!hours.contains(start)) start += 1
				// start is start index of interval
				end = start
				while (hours.contains(end)) end += 1
				// end is index of first half hour not in interval
				val numHalfHrs = NUM_HALF_HRS_IN_DAY
				/* if the interval is contained in a single day or end is before six
					on the next day */
				if (end / numHalfHrs == start / numHalfHrs ||
					end % numHalfHrs < 6 * 2) {
					intervals += ((start, (end - 1) % NUM_HALF_HRS_IN_WEEK))
					start = end
				}
				else {
					val nextDayStart = (start / numHalfHrs + 1) * numHalfHrs
					intervals += ((start, (nextDayStart - 1) % NUM_HALF_HRS_IN_WEEK))
					start = nextDayStart
				}
			}
		}

		// group intervals by start day
		intervals.groupBy { case (i, _) => i / NUM_HALF_HRS_IN_DAY }
	}
}

object Restaurant {
	val restaurant = {
		int("id") ~ str("name") ~ str("sunday_hours") ~ str("monday_hours") ~
			str("tuesday_hours") ~ str("wednesday_hours") ~ str("thursday_hours") ~
			str("friday_hours") ~ str("saturday_hours") map {
				case id ~ name ~ sun ~ mon ~ tue ~ wed ~ thu ~ fri ~ sat => {
					val weekBitSet = BitSet(
						List(sun, mon, tue, wed, thu, fri, sat).zipWithIndex.map {
							case (mask, i) =>
								mask.zipWithIndex.filter {
									case ('1', _) => true
									case _ => false
								}.map { case (_, j) => i * 48 + j }
						}.flatten: _*
					)
					Restaurant(id, name, weekBitSet)
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

	private def nowDayAndMask(restaurantTZ: TimeZone) = {
		val df = new SimpleDateFormat("EEEE")
		df.setTimeZone(restaurantTZ)
		val dayOfWeek = df.format(new Date).toLowerCase
		val halfHourIndex = {
			val c = df.getCalendar
			2 * c.get(Calendar.HOUR_OF_DAY) + c.get(Calendar.MINUTE) / 30
		}
		val halfHourMask = Array.fill(48)('0').updated(halfHourIndex, '1').mkString
		(dayOfWeek, halfHourMask)
	}

	def open(): List[Restaurant] = DB.withConnection {
		implicit c =>
		val restaurantTZ = TimeZone.getTimeZone("EST")
		val (dayOfWeek, halfHourMask) = nowDayAndMask(restaurantTZ)
		val q = SQL("""select id, name, sunday_hours::char(48), monday_hours::char(48), tuesday_hours::char(48), wednesday_hours::char(48), thursday_hours::char(48), friday_hours::char(48), saturday_hours::char(48)
			from usf_restaurants
			where (%s_hours & {mask}::bit(48))::bigint > 0
			order by name""".format(dayOfWeek)).
			on("mask" -> halfHourMask)
		q.as(restaurant *)
	}

	def closed(): List[Restaurant] = DB.withConnection {
		implicit c =>
		val restaurantTZ = TimeZone.getTimeZone("EST")
		val (dayOfWeek, halfHourMask) = nowDayAndMask(restaurantTZ)
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
