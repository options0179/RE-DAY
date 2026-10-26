package com.reday.home;

import com.reday.common.CurrentUserId;
import com.reday.sessions.SessionQueryService;
import com.reday.sessions.dto.SessionDtos.HomeSummaryView;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/home")
public class HomeController {

  private final SessionQueryService sessionQueryService;

  public HomeController(SessionQueryService sessionQueryService) {
    this.sessionQueryService = sessionQueryService;
  }

  @GetMapping("/summary")
  public HomeSummaryView summary(@CurrentUserId Long userId) {
    return new HomeSummaryView(
        sessionQueryService.activeSessionOf(userId),
        sessionQueryService.recentRecordsOf(userId, 3));
  }
}
