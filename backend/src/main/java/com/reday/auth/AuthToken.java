package com.reday.auth;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "auth_tokens")
@Getter
@Setter
@NoArgsConstructor
public class AuthToken {

  @Id
  private String token;

  private Long userId;
  private Instant createdAt = Instant.now();

  public AuthToken(String token, Long userId) {
    this.token = token;
    this.userId = userId;
  }
}
