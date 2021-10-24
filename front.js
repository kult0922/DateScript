import { data } from './data.js'
import moment from 'moment'
import JapaneseHolidays from 'japanese-holidays';

/* -------- 定数 -------- */
const term = 60;
const startDate = "2021-10-01"

/*
e.g.
return:
2021-10-02: 49
2021-10-03: 100
2021-10-04: 100
2021-10-05: 100
2021-10-06: 100
2021-10-07: 100
....
*/
function getMinDailyPriceList(startDate, weekdayPrice, fridayPrice, saturdayPrice, beforeHolidayPrice) {
  // 通常の値段の最小値を各日付に格納する
  const minDailyPriceList = {}
  // 集計する最初の日
  let targetDay = startDate
  for (let i = 0; i < term; i++) {
    const day = new Date(targetDay).getDay()
    // 金曜
    if (day === 5) {
      minDailyPriceList[targetDay] = fridayPrice;
    } else if (day === 6) {
    // 土曜
      minDailyPriceList[targetDay] = saturdayPrice;
    } else {
    // それ以外
      minDailyPriceList[targetDay] = weekdayPrice;
    }

    // 翌日が祝日の場合
    const nextDay = moment(targetDay).add(1, 'days').format("YYYY-MM-DD")
    if (typeof JapaneseHolidays.isHoliday(new Date(nextDay)) != 'undefined') {
      minDailyPriceList[targetDay] = beforeHolidayPrice;
    }

    // 日付を進める
    targetDay = moment(targetDay).add(1, 'days').format("YYYY-MM-DD")
  }

  return minDailyPriceList
}


/* 
日付ごとの最安のroomDerailの料金を求める
e.g.
args:
0: {id: 1, room_id: 1, stock: 10, price: 1000, date: '2021-10-10T00:00:00+09:00', …}
1: {id: 2, room_id: 1, stock: 11, price: 1000, date: '2021-10-11T00:00:00+09:00', …}
....
5: {id: 5, room_id: 3, stock: 0, price: 100, date: '2021-10-13T00:00:00+09:00', …}
6: {id: 6, room_id: 3, stock: 0, price: 1030, date: '2021-10-15T00:00:00+09:00', …}

return:
2021-10-10: 1000
2021-10-11: 1000
2021-10-13: -1
2021-10-15: 40
*/
function getMinDetailPriceList(roomDetailList) {
  const minDetailPriceList = {}
  for (const roomDetail of roomDetailList) {
    // ストックがなければスキップ
    if (roomDetail.stock === 0) continue
    const detailDate = moment(roomDetail.date).format("YYYY-MM-DD")
    const detailPrice = roomDetail.price

    // 最小値に更新
    if (detailDate in minDetailPriceList) {
      minDetailPriceList[detailDate] = Math.min(minDetailPriceList[detailDate], detailPrice)
    } else {
      // 新規追加
      minDetailPriceList[detailDate] = detailPrice
    }
  }

  // stock 0 の日に -1 を代入
  for (const roomDetail of roomDetailList) {
    const detailDate = moment(roomDetail.date).format("YYYY-MM-DD")
    if (!(detailDate in minDetailPriceList)) {
      minDetailPriceList[detailDate] = -1
    }
  }

  return minDetailPriceList
}


/* -------- メイン処理 -------- */

// jsonから料金情報を抽出
const weekdayPriceList = data.map(elm => elm.weekday_price)
const fridayPriceList = data.map(elm => elm.friday_price)
const saturdayPriceList = data.map(elm => elm.staurday_price)
const beforeHolidayPriceList = data.map(elm => elm.before_holiday_price)

// 通常の曜日ごとの最小の値段を求める
const minWeekdayPrice = weekdayPriceList.reduce((elm1, elm2) => Math.min(elm1, elm2))
const minFridayPrice = fridayPriceList.reduce((elm1, elm2) => Math.min(elm1, elm2))
const minSaturdayPrice = saturdayPriceList.reduce((elm1, elm2) => Math.min(elm1, elm2))
const minBeforeHolidayPrice = beforeHolidayPriceList.reduce((elm1, elm2) => Math.min(elm1, elm2))

// 通常の日付ごとの最安の値段を得る
const minPriceList = getMinDailyPriceList(startDate, minWeekdayPrice, minFridayPrice, minSaturdayPrice, minBeforeHolidayPrice)

// jsonからroomDetailを抽出
const roomDetailList = data.map(a => a.RoomDetails).flat();

// roomDetailの日付ごとの最安の値段を得る
const minDetailPriceList = getMinDetailPriceList(roomDetailList)

// roomDetailが存在する日付はroomDetailの値段で上書き
for(let date of Object.keys(minDetailPriceList)) {
  minPriceList[date] = minDetailPriceList[date]
}

// 求めたかった配列
console.log(minPriceList)



