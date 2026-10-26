package com.reday.auth;

import com.reday.auth.dto.AuthDtos.ConsentRequest;
import com.reday.auth.dto.AuthDtos.LoginRequest;
import com.reday.auth.dto.AuthDtos.LoginResponse;
import com.reday.auth.dto.AuthDtos.SignupRequest;
import com.reday.auth.dto.AuthDtos.SignupResponse;
import com.reday.auth.dto.AuthDtos.UserView;
import com.reday.common.ApiException;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

  private final UserRepository userRepository;
  private final AuthTokenRepository authTokenRepository;
  private final EmailVerificationTokenRepository verificationTokenRepository;
  private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

  public AuthService(UserRepository userRepository, AuthTokenRepository authTokenRepository,
      EmailVerificationTokenRepository verificationTokenRepository) {
    this.userRepository = userRepository;
    this.authTokenRepository = authTokenRepository;
    this.verificationTokenRepository = verificationTokenRepository;
  }

  public SignupResponse signup(SignupRequest request) {
    if (userRepository.existsByEmail(request.email())) {
      throw new ApiException(HttpStatus.CONFLICT, "이미 가입된 이메일입니다");
    }
    User user = new User();
    user.setEmail(request.email());
    user.setPasswordHash(passwordEncoder.encode(request.password()));
    user.setDisplayName(request.displayName());
    user = userRepository.save(user);

    String token = UUID.randomUUID().toString();
    verificationTokenRepository.save(new EmailVerificationToken(token, user.getId()));
    return new SignupResponse(user.getId(), token);
  }

  public void verifyEmail(String token) {
    EmailVerificationToken verification = verificationTokenRepository.findByToken(token)
        .orElseThrow(() -> ApiException.badRequest("유효하지 않은 인증 토큰입니다"));
    User user = userRepository.findById(verification.getUserId())
        .orElseThrow(() -> ApiException.notFound("사용자를 찾을 수 없습니다"));
    user.setEmailVerified(true);
    userRepository.save(user);
    verificationTokenRepository.delete(verification);
  }

  public LoginResponse login(LoginRequest request) {
    User user = userRepository.findByEmail(request.email())
        .orElseThrow(() -> ApiException.unauthorized("이메일 또는 비밀번호가 올바르지 않습니다"));
    if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
      throw ApiException.unauthorized("이메일 또는 비밀번호가 올바르지 않습니다");
    }
    if (!user.isEmailVerified()) {
      throw new ApiException(HttpStatus.FORBIDDEN, "이메일 인증이 필요합니다");
    }
    user.setLastActiveAt(Instant.now());
    userRepository.save(user);

    String token = UUID.randomUUID().toString();
    authTokenRepository.save(new AuthToken(token, user.getId()));
    return new LoginResponse(token, UserView.from(user));
  }

  public void consent(Long userId, ConsentRequest request) {
    User user = userRepository.findById(userId).orElseThrow(() -> ApiException.notFound("사용자를 찾을 수 없습니다"));
    user.setConsentVersion(request.version());
    user.setConsentedAt(Instant.now());
    userRepository.save(user);
  }

  public Long resolveUserId(String bearerToken) {
    return authTokenRepository.findByToken(bearerToken).map(AuthToken::getUserId).orElse(null);
  }
}
