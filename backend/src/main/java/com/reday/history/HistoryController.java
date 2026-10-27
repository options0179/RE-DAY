package com.reday.history;

import com.reday.common.CurrentUserId;
import com.reday.sessions.SessionQueryService;
import com.reday.sessions.dto.SessionDtos.HistoryItemView;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/history")
public class HistoryController {

  private final SessionQueryService sessionQueryService;

  public HistoryController(SessionQueryService sessionQueryService) {
    this.sessionQueryService = sessionQueryService;
  }

  @GetMapping
  public List<HistoryItemView> history(@CurrentUserId Long userId,
      @RequestParam(defaultValue = "all") String filter) {
    return sessionQueryService.history(userId, filter);
  }
}
