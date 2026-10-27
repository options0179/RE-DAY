package com.reday.jobs;

import java.util.List;
import java.util.UUID;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Fixture job/variant data, standing in for the external job-grounding source the old
 * Copilot-era MCP integration used to provide (dropped — see docs/frontend-backend-contract.md
 * §6, nothing in the new contract calls out to HRDKorea). Variants intentionally carry different
 * numbers of situationTemplates so totalSteps is visibly not a constant.
 */
@Component
public class JobSeedData implements CommandLineRunner {

  private final JobCatalogRepository jobRepository;
  private final JobVariantRepository variantRepository;

  public JobSeedData(JobCatalogRepository jobRepository, JobVariantRepository variantRepository) {
    this.jobRepository = jobRepository;
    this.variantRepository = variantRepository;
  }

  @Override
  public void run(String... args) {
    if (jobRepository.count() > 0) {
      return;
    }

    JobCatalogEntry designer = job("디자이너", "디자인", "사용자 리서치부터 화면 설계까지, 제품을 쓰는 사람의 입장에서 고민하는 일", true, "UX 디자이너", "UI 디자이너");
    JobCatalogEntry developer = job("개발자", "엔지니어링", "요구사항을 동작하는 소프트웨어로 만드는 일", true, "백엔드 개발자", "프론트엔드 개발자");
    JobCatalogEntry nurse = job("간호사", "의료", "환자의 상태를 살피고 치료 과정을 돕는 일", true, "병동 간호사");
    JobCatalogEntry teacher = job("교사", "교육", "학생의 배움과 생활을 함께 이끄는 일", true, "중학교 교사");

    jobRepository.saveAll(List.of(designer, developer, nurse, teacher));

    variantRepository.save(uxDesignerVariant(designer.getId()));
    variantRepository.save(nurseVariant(nurse.getId()));
    variantRepository.save(developerVariant(developer.getId()));
    variantRepository.save(teacherVariant(teacher.getId()));
  }

  private JobCatalogEntry job(String name, String category, String summary, boolean popular, String... aliases) {
    JobCatalogEntry entry = new JobCatalogEntry();
    entry.setId(UUID.randomUUID().toString());
    entry.setName(name);
    entry.setCategory(category);
    entry.setSummary(summary);
    entry.setPopular(popular);
    entry.setAliases(List.of(aliases));
    return entry;
  }

  private JobVariant uxDesignerVariant(String jobId) {
    JobVariant variant = new JobVariant();
    variant.setId(UUID.randomUUID().toString());
    variant.setJobId(jobId);
    variant.setWorldTitle("UX 디자이너의 하루");
    variant.setRoleDescription("서비스 개선 프로젝트에 합류한 주니어 디자이너");
    variant.setTaskTimeline(List.of(
        new TaskTimelineEntry("09:00", "사용자 의견 검토"),
        new TaskTimelineEntry("10:30", "팀 회의"),
        new TaskTimelineEntry("오후", "개선 방향 제안")));
    variant.setSituationTemplates(List.of(
        new SituationTemplate("사용자 의견 검토", "지난주 설문에서 '버튼을 어디서 눌러야 할지 모르겠다'는 의견이 다수 접수됐습니다. 동료: \"오늘 회의 전까지 원인을 정리해 줄 수 있을까요?\"", "회의까지 1시간"),
        new SituationTemplate("팀 회의", "개발 일정이 촉박한데 사용성 문제가 발견됐습니다. 팀장: \"이번 배포에서는 어떻게 진행하면 좋을까요?\"", "배포 전 검토 시간 부족"),
        new SituationTemplate("개선 방향 제안", "두 가지 해결안이 있습니다. 하나는 빠르지만 임시방편이고, 하나는 오래 걸리지만 근본적입니다. 팀장: \"어느 쪽으로 제안할까요?\"", "다음 스프린트 계획 확정 전"),
        new SituationTemplate("리뷰 공유", "수정안을 팀에 공유할 시간입니다. 디자인 시스템과 다른 패턴이 섞여 있다는 지적이 나올 수 있습니다. 동료: \"이 부분은 왜 이렇게 바꾸셨어요?\"", "퇴근 30분 전")));
    return variant;
  }

  private JobVariant nurseVariant(String jobId) {
    JobVariant variant = new JobVariant();
    variant.setId(UUID.randomUUID().toString());
    variant.setJobId(jobId);
    variant.setWorldTitle("병동 간호사의 하루");
    variant.setRoleDescription("내과 병동에서 야간 근무를 막 시작한 2년차 간호사");
    variant.setTaskTimeline(List.of(
        new TaskTimelineEntry("22:00", "인수인계"),
        new TaskTimelineEntry("23:30", "환자 상태 확인"),
        new TaskTimelineEntry("새벽", "응급 호출 대응")));
    variant.setSituationTemplates(List.of(
        new SituationTemplate("인수인계", "낮 근무 간호사로부터 환자 상태를 전달받는 중, 한 환자의 통증 기록이 누락되어 있습니다. 선배: \"이 부분은 직접 확인해봐야 할 것 같아요.\"", "인수인계 마감까지 10분"),
        new SituationTemplate("환자 상태 확인", "한 환자가 평소보다 호흡이 가빠 보입니다. 아직 응급 상황은 아니지만 애매합니다. 보호자: \"괜찮은 거 맞죠?\"", "다음 라운딩까지 20분"),
        new SituationTemplate("응급 호출 대응", "다른 병실에서 호출이 왔습니다. 지금 보고 있는 환자도 완전히 안심할 수 없는 상태입니다.", "즉시 판단 필요")));
    return variant;
  }

  private JobVariant developerVariant(String jobId) {
    JobVariant variant = new JobVariant();
    variant.setId(UUID.randomUUID().toString());
    variant.setJobId(jobId);
    variant.setWorldTitle("백엔드 개발자의 하루");
    variant.setRoleDescription("결제 시스템을 담당하는 2년차 백엔드 개발자");
    variant.setTaskTimeline(List.of(
        new TaskTimelineEntry("10:00", "코드 리뷰"),
        new TaskTimelineEntry("14:00", "배포")));
    variant.setSituationTemplates(List.of(
        new SituationTemplate("코드 리뷰", "동료가 올린 PR에서 결제 금액 계산에 잠재적 버그가 보입니다. 하지만 오늘 중 머지해야 하는 일정입니다. 동료: \"급한 건 아는데, 괜찮아 보이나요?\"", "머지 마감까지 1시간"),
        new SituationTemplate("배포", "배포 직후 에러율이 평소보다 살짝 높아졌습니다. 심각한 수준은 아니지만 계속 지켜봐야 할지 롤백해야 할지 애매합니다.", "다음 배포 윈도우까지 30분")));
    return variant;
  }

  private JobVariant teacherVariant(String jobId) {
    JobVariant variant = new JobVariant();
    variant.setId(UUID.randomUUID().toString());
    variant.setJobId(jobId);
    variant.setWorldTitle("중학교 교사의 하루");
    variant.setRoleDescription("2학년 담임을 맡은 3년차 교사");
    variant.setTaskTimeline(List.of(
        new TaskTimelineEntry("09:00", "조회"),
        new TaskTimelineEntry("13:00", "수업"),
        new TaskTimelineEntry("16:00", "학부모 상담")));
    variant.setSituationTemplates(List.of(
        new SituationTemplate("조회", "한 학생이 계속 엎드려 있습니다. 평소와 다른 모습입니다. 다른 학생들: \"쟤 오늘 좀 이상해요.\"", "1교시 시작까지 5분"),
        new SituationTemplate("수업", "수업 중 한 학생이 다른 학생을 비웃는 발언을 했습니다. 반 전체가 조용해졌습니다.", "수업 중 즉시 대응 필요"),
        new SituationTemplate("학부모 상담", "학부모가 성적에 대해 예민하게 반응하며 다른 학생과 비교합니다. 학부모: \"우리 애만 왜 이래요?\"", "상담 시간 20분")));
    return variant;
  }
}
