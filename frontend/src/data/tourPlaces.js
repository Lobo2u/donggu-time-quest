// Public visitor anchors: never feed the story cursor, check-in, or fog progress.
export const TOUR_PLACES = Object.freeze([
  { id: 'daejeon-station', name: '대전역', anchor: '서광장 쪽 · 대전역 1번 출구측', lat: 36.3314374, lng: 127.4327435, source: 'https://www.data.go.kr/data/15043922/fileData.do' },
  { id: 'woosong', name: '우송대학교 서캠퍼스', anchor: '동대전로 171 · 서캠퍼스 일대', lat: 36.3375527, lng: 127.4453669, source: 'https://ent.wsu.ac.kr/site/main/wsu_map/campusmap.html', coordinateSource: 'https://findby.co.kr/details/34606-301103164009-st-652b0c238c641f9e388b3163' },
  { id: 'daedongcheon', name: '대동천', anchor: '소제동 철갑교 · 하천 구간 참고점', lat: 36 + 20 / 60 + 6 / 3600, lng: 127 + 26 / 60 + 17 / 3600, source: 'https://www.water.or.kr/upload/board/2024/03/20240320180535_1.pdf' },
  { id: 'daedong-maeul', name: '대동벽화마을', anchor: '백룡로48번길 일대 · 골목 입구 아님', lat: 36.33089582, lng: 127.4515038, source: 'https://korean.visitkorea.or.kr/detail/rem_detail.do?cotid=d10fed62-b0a0-4a5e-b204-5471240b7658', coordinateSource: 'https://info.childcare.go.kr/info_html5/pnis/search/MapSlL.jsp?STCODE=30110000001&popGb=popMap', preview: 'https://ar.lobodoc.com/daedong-wing-alley-preview.html' },
  { id: 'daedong-sky', name: '대동하늘공원', anchor: '동대전로110번길 182 · 공원 일대', lat: 36.33221, lng: 127.45156, source: 'https://donggu.go.kr/dg/tour/82/5/sights', coordinateSource: 'https://www.openstreetmap.org/node/4441433089' },
].map(Object.freeze))

export function tourPinGroups(places, project, minGap = 44) {
  const groups = []
  for (const place of places) {
    const point = project(place)
    const near = groups.find(group => Math.hypot(group.x - point.x, group.y - point.y) < minGap)
    if (near) near.places.push(place)
    else groups.push({ x: point.x, y: point.y, places: [place] })
  }
  return groups.map(group => group.places)
}

// Avoid obscuring an existing story marker without changing the real GPS anchor.
export function tourPinOffset(point, occupied, size) {
  const candidates = [[0, 0], [0, 50], [50, 5], [-50, 5], [0, -55], [37, 38], [-37, 38], [0, 76], [67, 45], [-67, 45], [64, -40], [-64, -40], [0, -76]]
  return candidates.find(([dx, dy]) => {
    const x = point.x + dx
    const y = point.y + dy
    if (x < 22 || x > size.x - 22 || y < 174 || y > size.y - 270) return false
    return occupied.every(p => Math.abs(x - p.x) >= p.rx + 22 || Math.abs(y - p.y) >= p.ry + 22)
  }) || [0, 0]
}
