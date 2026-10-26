package com.reday.auth;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, String> {
  Optional<EmailVerificationToken> findByToken(String token);
}
