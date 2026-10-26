package com.reday.auth;

import com.reday.auth.dto.AuthDtos.ConsentRequest;
import com.reday.auth.dto.AuthDtos.LoginRequest;
import com.reday.auth.dto.AuthDtos.LoginResponse;
import com.reday.auth.dto.AuthDtos.SignupRequest;
import com.reday.auth.dto.AuthDtos.SignupResponse;
import com.reday.auth.dto.AuthDtos.VerifyEmailRequest;
import com.reday.common.CurrentUserId;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/auth")
public class AuthController {

  private final AuthService authService;

  public AuthController(AuthService authService) {
    this.authService = authService;
  }

  @PostMapping("/signup")
  public ResponseEntity<SignupResponse> signup(@Valid @RequestBody SignupRequest request) {
    return ResponseEntity.status(HttpStatus.ACCEPTED).body(authService.signup(request));
  }

  @PostMapping("/verify-email")
  public ResponseEntity<Void> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
    authService.verifyEmail(request.token());
    return ResponseEntity.ok().build();
  }

  @PostMapping("/login")
  public LoginResponse login(@Valid @RequestBody LoginRequest request) {
    return authService.login(request);
  }

  @PostMapping("/consent")
  public ResponseEntity<Void> consent(@CurrentUserId Long userId, @Valid @RequestBody ConsentRequest request) {
    authService.consent(userId, request);
    return ResponseEntity.ok().build();
  }
}
