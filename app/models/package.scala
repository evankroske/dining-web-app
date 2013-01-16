import play.api.libs.json._

import java.lang.Long.parseLong
import java.util.TimeZone

import scala.collection.immutable.BitSet

package object models {
	implicit object RestaurantFormat extends Format[Restaurant] {
		def reads(r: JsValue): Restaurant = Restaurant(
			(r \ "id").as[Int],
			(r \ "name").as[String],
			BitSet(((r \ "hours").as[List[Long]] zipWithIndex) flatMap {
				case (l, i) =>
					(BitSet fromArray Array(l)) map (j => j + i * 48)
			}: _*))

		def writes(r: Restaurant): JsValue = JsObject(List(
			"id" -> JsNumber(r.id),
			"name" -> JsString(r.name),
			"hours" -> JsArray((0 until 7) map { dayIndex =>
				JsNumber(parseLong(
					(47 + dayIndex * 48 to 0 + dayIndex * 48 by -1) map { halfHrIndex =>
						if (r.hours.contains(halfHrIndex)) '1' else '0'
					} mkString
				, 2))
			})
		))
	}
}
