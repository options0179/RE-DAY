package com.reday;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ReDayApplication {
  public static void main(String[] args) {
    loadDotEnvIfPresent();
    SpringApplication.run(ReDayApplication.class, args);
  }

  /**
   * Mirrors the old Node runtime's dotenv fallback (backend/.env, then repo-root .env) so a
   * local gemini_api_key keeps working without exporting shell env vars. Never overrides a value
   * already set in the real process environment.
   */
  private static void loadDotEnvIfPresent() {
    for (Path candidate : List.of(Path.of(".env"), Path.of("../.env"))) {
      if (Files.isRegularFile(candidate)) {
        applyDotEnv(candidate);
      }
    }
  }

  private static void applyDotEnv(Path file) {
    try {
      for (String line : Files.readAllLines(file)) {
        String trimmed = line.trim();
        if (trimmed.isEmpty() || trimmed.startsWith("#")) {
          continue;
        }
        int separator = trimmed.indexOf('=');
        if (separator <= 0) {
          continue;
        }
        String key = trimmed.substring(0, separator).trim();
        String value = trimmed.substring(separator + 1).trim();
        if (System.getenv(key) == null && System.getProperty(key) == null && !value.isEmpty()) {
          System.setProperty(key, value);
        }
      }
    } catch (IOException ignored) {
      // optional file — nothing to load
    }
  }
}
