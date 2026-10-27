package com.reday.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {
  private AuthDtos() {
  }

  public record SignupRequest(
      @NotBlank @Email String email,
      @NotBlank @Size(min = 8, message = "최소 8자 이상이어야 합니다") String password,
      String displayName) {
  }

  /** devVerificationToken is a local-dev stand-in for the email link — see contract doc §6. */
  public record SignupResponse(Long userId, String devVerificationToken) {
  }

  public record VerifyEmailRequest(@NotBlank String token) {
  }

  public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {
  }

  public record LoginResponse(String accessToken, UserView user) {
  }

  public record ConsentRequest(@NotBlank String version) {
  }

  public record UserView(Long id, String email, String displayName, boolean emailVerified, String consentVersion) {
    public static UserView from(com.reday.auth.User user) {
      return new UserView(user.getId(), user.getEmail(), user.getDisplayName(), user.isEmailVerified(), user.getConsentVersion());
    }
  }
}
