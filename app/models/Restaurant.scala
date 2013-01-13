package models

import anorm._
import anorm.SqlParser._
import play.api.db._
import play.api.Play.current

import java.util.{TimeZone, Date, Calendar}
import java.text.{DateFormat, SimpleDateFormat}

import scala.collection.BitSet
import scala.collection.mutable.MutableList

case class Restaurant(val id: Int, val name: String, val hours: BitSet, val timeZone: TimeZone) {
	private val NUM_HALF_HRS_IN_DAY = 48;
	private val NUM_HALF_HRS_IN_WEEK = 7 * 48
	private val cal = Calendar.getInstance(timeZone)

	def prettyHoursByDay() = {
		val dayFormatter = new SimpleDateFormat("EEEE")
		dayFormatter.setTimeZone(timeZone)
		val timeFormatter = new SimpleDateFormat("h:mm a")
		timeFormatter.setTimeZone(timeZone)
		hoursByDay.zipWithIndex.map { case (day, i) =>
			day match {
				case List() =>
					"%s: Closed".format(dayFormatter.format(halfHrIndexToDate(i *
						NUM_HALF_HRS_IN_DAY)))
				case intervals @ List((start, end), _*) =>
					"%s: %s".format(
						dayFormatter.format(
							halfHrIndexToDate(i * NUM_HALF_HRS_IN_DAY)),
						intervals.map {
							case (start, None) =>
								if (cal.get(Calendar.HOUR_OF_DAY) == 0) "24 hours"
								else {
									"%s–No closing".format(timeFormatter.format(start))
								}
							case (start, Some(end)) =>
								"%s–%s".format(timeFormatter.format(start),
									timeFormatter.format(end))
						}.mkString(" and ")
					)
			}
		}
	}

	def hoursByDay() = {
		intervalsByDay.map { intervals =>
			intervals.view.map { case (start, end) =>
				(halfHrIndexToDate(start), end.map(halfHrIndexToDate(_)))
			}.toList
		}
	}

	def dump() = {
		(0).until(7).map { i =>
			(i * 48).until((i + 1) * 48).map { j =>
				if (hours.contains(j)) '1'
				else '0'
			}.mkString
		}
	}

	def intervalsByDay() = {
		val intervals = Array.fill(7)(MutableList[Tuple2[Int, Option[Int]]]())
		var start = 0
		while (hours.contains(start) && start < NUM_HALF_HRS_IN_WEEK) {
			start += 1
		}
		
		// put all intervals in intervals list
		if (start == NUM_HALF_HRS_IN_WEEK) {
			(0).until(7).foreach { i =>
				intervals(i) += ((i * NUM_HALF_HRS_IN_DAY, None))
			}
		}
		else if (hours.nonEmpty) {
			var end = 0
			while (!hours.contains(start)) start += 1
			// start is start index of interval
			while (start < NUM_HALF_HRS_IN_WEEK) {
				end = start
				while (hours.contains(end % NUM_HALF_HRS_IN_WEEK)) end += 1
				// end is the index of the first half hour not in the interval
				val numHalfHrs = NUM_HALF_HRS_IN_DAY
				/* if the interval is contained in a single day or it ends before six
					on the next day */
				val (startDay, endDay) = (start / numHalfHrs, end / numHalfHrs)
				if (endDay == startDay ||
					(endDay - startDay == 1 && end % numHalfHrs < 6 * 2)) {
					intervals(startDay % 7) +=
						((start, Some(end % NUM_HALF_HRS_IN_WEEK)))
					start = end
				}
				else {
					val nextDayStart = (start / numHalfHrs + 1) * numHalfHrs
					intervals(startDay % 7) += ((start, None))
					start = nextDayStart
				}
				while (!hours.contains(start) && start < NUM_HALF_HRS_IN_WEEK) {
					start += 1
				}
				// start is start index of next interval or NUM_HALF_HRS_IN_WEEK
			}
		}
		intervals
	}

	private def halfHrIndexToDate(i: Int) = {
		cal.clear()
		cal.set(Calendar.DAY_OF_WEEK, Calendar.SUNDAY)
		cal.set(Calendar.MINUTE, i * 30)
		cal.getTime()
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
					Restaurant(id, name, weekBitSet, TimeZone.getTimeZone("EST"))
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

	def details(id: Int) = DB.withConnection { implicit c =>
		SQL("""select id, name, sunday_hours::char(48), monday_hours::char(48), tuesday_hours::char(48), wednesday_hours::char(48), thursday_hours::char(48), friday_hours::char(48), saturday_hours::char(48)
		from usf_restaurants where id = {id}""").on("id" -> id).
			as(ResultSetParser.singleOpt(restaurant))
	}
}
