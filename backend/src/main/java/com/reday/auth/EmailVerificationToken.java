package com.reday.auth;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Stands in for a real "click the link in your email" flow — see docs/dev/frontend-backend-contract.md §6. */
@Entity
@Table(name = "email_verification_tokens")
@Getter
@Setter
@NoArgsConstructor
public class EmailVerificationToken {

  @Id
  private String token;

  private Long userId;
  private Instant createdAt = Instant.now();

  public EmailVerificationToken(String token, Long userId) {
    this.token = token;
    this.userId = userId;
  }
}
