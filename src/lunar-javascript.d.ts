declare module 'lunar-javascript' {
  export class Lunar {
    static fromDate(date: Date): Lunar

    getYearInChinese(): string
    getMonthInChinese(): string
    getDayInChinese(): string
    getYearInGanZhi(): string
    getYearShengXiao(): string
    getFestivals(): string[]
    getOtherFestivals(): string[]
    getJieQi(): string
    getDayYi(): string[]
    getDayJi(): string[]
  }
}

