package com.reday.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/** Resolves "Authorization: Bearer <token>" into a request attribute; does not itself reject missing auth — {@code CurrentUserArgumentResolver} does that for handlers that ask for {@code @CurrentUserId}. */
@Component
public class AuthInterceptor implements HandlerInterceptor {

  public static final String USER_ID_ATTRIBUTE = "userId";
  private static final String BEARER_PREFIX = "Bearer ";

  private final AuthService authService;

  public AuthInterceptor(AuthService authService) {
    this.authService = authService;
  }

  @Override
  public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
    String header = request.getHeader("Authorization");
    if (header != null && header.startsWith(BEARER_PREFIX)) {
      Long userId = authService.resolveUserId(header.substring(BEARER_PREFIX.length()).trim());
      if (userId != null) {
        request.setAttribute(USER_ID_ATTRIBUTE, userId);
      }
    }
    return true;
  }
}
