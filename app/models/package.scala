import play.api.libs.json._

import java.lang.Integer.parseInt
import java.util.TimeZone

import scala.collection.BitSet
import scala.collection.immutable.BitSet.{fromArray => bitSetFromArray}
import scala.math._

package object models {
	implicit object RestaurantFormat extends Format[Restaurant] {
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

		def reads(r: JsValue): Restaurant = Restaurant(
			(r \ "id").as[Int],
			(r \ "name").as[String],
			BitSet(((r \ "hours").as[List[Long]] zipWithIndex) flatMap {
				case (l, i) =>
					bitSetFromArray(Array(l)) map (j => j + i * 32)
			}: _*))

		def writes(r: Restaurant): JsValue = JsObject(List(
			"id" -> JsNumber(r.id),
			"name" -> JsString(r.name),
			"hours" -> JsArray(r.hours)
		))
	}
}
