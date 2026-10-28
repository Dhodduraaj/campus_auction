package com.campusauction.common.exception;

import org.springframework.http.HttpStatus;

public class InvalidBidException extends ApiException {
    public InvalidBidException(String message) {
        super(message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
