package com.reday.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.reday.auth.dto.AuthDtos.ConsentRequest;
import com.reday.auth.dto.AuthDtos.LoginRequest;
import com.reday.auth.dto.AuthDtos.LoginResponse;
import com.reday.auth.dto.AuthDtos.SignupRequest;
import com.reday.auth.dto.AuthDtos.SignupResponse;
import com.reday.common.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpStatus;

import org.springframework.beans.factory.annotation.Autowired;

@SpringBootTest
class AuthServiceTest {

  @Autowired
  private AuthService authService;

  @Test
  void signupThenLoginRequiresEmailVerificationFirst() {
    SignupRequest signup = new SignupRequest("tester@example.com", "password123", "테스터");
    SignupResponse signupResponse = authService.signup(signup);

    assertThatThrownBy(() -> authService.login(new LoginRequest("tester@example.com", "password123")))
        .isInstanceOf(ApiException.class)
        .extracting(e -> ((ApiException) e).getStatus())
        .isEqualTo(HttpStatus.FORBIDDEN);

    authService.verifyEmail(signupResponse.devVerificationToken());

    LoginResponse loginResponse = authService.login(new LoginRequest("tester@example.com", "password123"));
    assertThat(loginResponse.accessToken()).isNotBlank();
    assertThat(loginResponse.user().emailVerified()).isTrue();

    authService.consent(loginResponse.user().id(), new ConsentRequest("v1"));
  }

  @Test
  void wrongPasswordIsRejected() {
    authService.signup(new SignupRequest("wrongpass@example.com", "correct-password", "테스터2"));
    assertThatThrownBy(() -> authService.login(new LoginRequest("wrongpass@example.com", "incorrect")))
        .isInstanceOf(ApiException.class)
        .extracting(e -> ((ApiException) e).getStatus())
        .isEqualTo(HttpStatus.UNAUTHORIZED);
  }
}
