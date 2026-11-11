# MCP·도구 연결 추출

## 1. 일반 HTTP 도구

| 항목 | 확인값 |
| --- | --- |
| 이름 | Invoke an HTTP request |
| 종류 | WebContentsV2 커넥터 동작 |
| 문서 | <https://docs.microsoft.com/connectors/webcontentsv2/#invoke-an-http-request> |
| 연결 | `Not connected` |
| 인증 | 최종 사용자 계정 |
| AI 설명 | `Invokes an HTTP endpoint.` |
| 필수 입력 | `request.method`, `request.url` |
| 선택 입력 | `request.headers`, `request.body` |
| 출력 | `body` (unknown, 응답 콘텐츠) |

화면에서 method와 URL은 `AI로 채우기` 상태였고 실제 연결이 없었다. 따라서 이 도구가 RE-DAY backend를 호출하는 완성된 연결이라고 볼 수 없다.

## 2. HRDKorea-MCP

| 항목 | 확인값 |
| --- | --- |
| 이름 | HRDKorea-MCP |
| 종류 | MCP 서버 |
| 연결 상태 | 연결됨 — `HRDKorea-MCP` |
| 인증 | 최종 사용자 계정 |
| 권한 | `모두 허용` |
| 활성 도구 수 | 45개 |
| 연결 관리 경로 | `.../cliagent/cr9fa_reday_4T-Zrr/channels/pva-studio/user-connections` |
| Microsoft 문서 | <https://learn.microsoft.com/microsoft-copilot-studio/agent-extend-action-mcp> |

화면의 모든 MCP 도구 토글은 checked이고 disabled 상태였다. 즉 이 Agent에는 HRDKorea-MCP의 전체 capability가 활성화되어 있었다. 연결 자격 증명 자체는 문서에 저장하지 않았다.

## 3. HRDKorea-MCP 전체 도구

### 국가자격·법정 선임·시험

| 도구 | 화면 설명 요약 |
| --- | --- |
| Recommend qualifications | 경력·직무 키워드를 NCS 능력단위와 Q-Net 자격 종목에 연결해 탐색용 자격 후보 추천 |
| Build career roadmap | 경력·직무에서 자격 후보, 법정 선임 자리, 추가 실무경력까지 연결 |
| Check legal requirements | 국가자격으로 가능한 법정 선임 자리·필요 경력·미선임 제재를 법령 조문과 대조 |
| Search qualification | 키워드로 국가자격 종목명·종목코드·계열·직무분야 검색 |
| Get exam schedule | 국가자격시험의 접수·필기·실기·합격자 발표 일정 조회 |
| Get qualification info | 국가자격 종목의 개요·수행직무·진로·전망 조회 |
| Get exam fee | 국가기술자격 필기·실기 응시수수료 조회 |
| Get pass rate | 연도·회차별 응시자·합격자·합격률 조회 |
| Find test sites | 지역별 한국산업인력공단 지사·시험장 조회 |
| Get disqualification info | 응시 결격사유와 유사종목 조회 |
| Get exam questions | 국가기술자격 공개문제 공고 목록 조회 |

### 해외취업

| 도구 | 화면 설명 요약 |
| --- | --- |
| Search overseas jobs | 월드잡플러스의 현재 모집 해외취업 공고 검색 |
| Get overseas employment stats | 해외취업 통계를 연도·국가·월별·직종·연령·훈련 등 차원으로 조회 |
| Search overseas companies | 해외취업 연계 구인기업을 국가·키워드로 검색 |
| Search overseas top jobs | 급여·비자 조건이 검증된 해외 우수일자리 검색 |
| Get overseas job fairs | 해외취업 설명회·아카데미 프로그램 일정 조회 |
| Get overseas country info | 국가별 해외취업·진출 정보 페이지 링크 조회 |
| Get overseas hiring stats | 해외 구인기업별 구인 인원수 통계 조회 |
| Get overseas settlement support | 해외취업 정착지원금 실적을 국가·직종·차수별 조회 |
| Search overseas resources | 뉴스·공지·가이드북·성공수기·멘토·교육 등 해외취업 리소스 검색 |
| Search kmove programs | K-Move 스쿨과 해외인턴 프로그램 검색 |

### NCS·훈련·자격 연계

| 도구 | 화면 설명 요약 |
| --- | --- |
| Search ncs | NCS 능력단위를 키워드로 검색 |
| Get ncs related qualifications | NCS 능력단위를 포함하는 자격과 교육훈련 기준시간 조회 |
| Search ncs learning materials | NCS 학습모듈·훈련과정·교육과정·이러닝·SQF 등 검색 |
| Search blind hiring | NCS 기반 블라인드 채용 기업 공고 검색 |
| Get ncs core competencies | NCS 분야별 직업기초능력 빈도 집계 |
| Get ncs classification | NCS 대·중·소·세분류 체계 조회 |
| Search course qualifications | 과정평가형 취득 가능 국가기술자격 검색 |
| Search work learning qualifications | 일학습병행 자격 종목 검색 |
| Search dual training orgs | 과정평가형·일학습병행 훈련 기관·기업을 지역별 검색 |
| Find dual exam sites | 과정평가형·일학습병행 외부평가 시험장 조회 |
| Get dual exam fee | 과정평가형·일학습병행 외부평가 수수료 조회 |
| Get dual exam stats | 과정평가형·일학습병행 시험 통계 조회 |
| Get industry training stats | 업종별 직업능력개발 훈련·지역별 진로교육 통계 조회 |

### 숙련기술·기능경기

| 도구 | 화면 설명 요약 |
| --- | --- |
| Search master craftsmen | 대한민국명장 등 숙련기술인을 이름·분야·직종·지역으로 검색 |
| Get master stats | 숙련기술인 유형·분야별 인원 통계 조회 |
| Search master artworks | 숙련기술인 작품 검색 |
| Get skill stats | 지방기능경기대회 참가자·산업현장교수 선정 통계 조회 |

### EPS·외국인고용

| 도구 | 화면 설명 요약 |
| --- | --- |
| Get eps topik schedule | EPS-TOPIK 회차별 접수·시험·발표 일정 조회 |
| Find eps topik sites | 국가별 EPS-TOPIK 시험장·접수처 조회 |
| Search eps jobseekers | EPS 외국인 구직자 프로필을 국적·직종·한국어능력으로 검색 |
| Get eps return support stats | 귀국지원 프로그램 회원 통계 조회 |
| Get eps topik materials | EPS-TOPIK 공개문제·표준교재 목록 조회 |
| Search eps return jobs | 귀국 외국인근로자 대상 본국 현지 채용공고 검색 |
| Get eps education info | 외국인근로자 취업교육 과정·교육장·일정·경력통계 조회 |

## 4. 저장소의 MCP 관련 상태

- `backend/src/mcp/gateway.ts`는 `McpGateway`라는 내부 호출 추상화이며, MCP SDK transport/server 구현은 아니다.
- `@modelcontextprotocol/sdk`는 source import가 없어서 backend manifest와 lock에서 제거했다. 실제 MCP transport를 추가할 때 별도 action으로 다시 도입한다.
- `copilot-studio-api-connect-phase1.md`는 Copilot Studio에서 RE-DAY backend HTTP action을 연결하려던 흔적이다.
- OpenAPI action 이름은 `RE_DAY_StartDay`, `RE_DAY_CompleteDay`, `RE_DAY_GetContext`, `RE_DAY_SaveSummary`, `RE_DAY_SaveMemoryCandidate`이다.
- Gemini 전환에서는 MCP 전체 권한을 그대로 노출하지 말고 필요한 도구 allowlist와 사용자 데이터 범위를 먼저 정의해야 한다.
