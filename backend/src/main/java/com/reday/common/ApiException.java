package com.reday.common;

import org.springframework.http.HttpStatus;

public class ApiException extends RuntimeException {
  private final HttpStatus status;
  private final Object details;

  public ApiException(HttpStatus status, String message) {
    this(status, message, null);
  }

  public ApiException(HttpStatus status, String message, Object details) {
    super(message);
    this.status = status;
    this.details = details;
  }

  public static ApiException notFound(String message) {
    return new ApiException(HttpStatus.NOT_FOUND, message);
  }

  public static ApiException badRequest(String message) {
    return new ApiException(HttpStatus.BAD_REQUEST, message);
  }

  public static ApiException unauthorized(String message) {
    return new ApiException(HttpStatus.UNAUTHORIZED, message);
  }

  public static ApiException forbidden(String message) {
    return new ApiException(HttpStatus.FORBIDDEN, message);
  }

  public HttpStatus getStatus() {
    return status;
  }

  public Object getDetails() {
    return details;
  }
}
