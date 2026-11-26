export const SOJE_RECORDS = Object.freeze([
  { label: '대전문화재단: 소제동 자료집 원문', url: 'https://djiha.dcaf.or.kr/archive/materials/publicationsV.do?ichDataUid=13962778896619451840&page=1' },
  { label: '대전시: 관사 16호와 수향길 19', url: 'https://www.daejeon.go.kr/its/ItsdjNormalboardView.do?boardGubun=itsdj01&boardSeq=3197&menuSeq=5945&pageIndex=1' },
  { label: '대전시: 철도관사촌과 16호 복원 이야기', url: 'https://www.daejeon.go.kr/its/ItsdjNormalboardView.do?boardGubun=itsdj01&boardSeq=1074&menuSeq=5928&pageIndex=1' },
  { label: '대전역사자료관: 소제동 기록집', url: 'https://www.daejeon.go.kr/history/historyBookBoardDetail.do?bookSeq=107&menuSeq=8125' },
])
export const CURATED_PHOTOS = Object.freeze({
  'daejeon-station': {
    title: '대전역 서광장의 두 시점',
    summary: '2007년과 2019년에 촬영된 대전역 서광장 사진이에요. 2019년 사진은 비교용 기록이며 지금의 실시간 모습은 아니에요.',
    photos: [
      { date: '2007년 4월 29일', file: 'history/daejeon-station-2007.jpg', alt: '2007년 서광장에서 본 대전역 건물', credit: 'Yoo Chung', source: 'https://commons.wikimedia.org/wiki/File:Daejeon_train_station.jpg', license: 'https://creativecommons.org/licenses/by-sa/2.5/', licenseName: 'CC BY-SA 2.5' },
      { date: '2019년 6월 8일', file: 'history/daejeon-station-2019.jpg', alt: '2019년 서광장에서 본 대전역 건물', credit: '*Youngjin', source: 'https://commons.wikimedia.org/wiki/File:Q20919_Daejeon_Station_A01.jpg', license: 'https://creativecommons.org/licenses/by-sa/3.0/', licenseName: 'CC BY-SA 3.0' },
    ],
  },
  sojedom: {
    title: '소제동 철도 관사 16호',
    summary: '대전 동구 수향길 19. 옛 철도 관사를 복원한 곳이에요.',
    photos: null,
    refs: SOJE_RECORDS,
  },
})
