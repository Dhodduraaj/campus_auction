package com.campusauction;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class CampusAuctionApplication {

    public static void main(String[] args) {
        // Enforce authoritative UTC timestamps across application
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(CampusAuctionApplication.class, args);
    }
}
