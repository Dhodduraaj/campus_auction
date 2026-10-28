package com.campusauction;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class CampusAuctionApplication {

    private static final Logger log = LoggerFactory.getLogger(CampusAuctionApplication.class);

    public static void main(String[] args) {
        // Enforce authoritative UTC timestamps across application
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));

        // Automatically load environment variables from .env file if available
        loadDotEnv();

        SpringApplication.run(CampusAuctionApplication.class, args);
    }

    private static void loadDotEnv() {
        Path[] possiblePaths = {
                Paths.get(".env"),
                Paths.get("../.env"),
                Paths.get("../../.env")
        };

        for (Path path : possiblePaths) {
            if (Files.exists(path)) {
                try {
                    log.info("Loading environment configurations from: {}", path.toAbsolutePath().normalize());
                    List<String> lines = Files.readAllLines(path);
                    for (String line : lines) {
                        String trimmed = line.trim();
                        if (trimmed.isEmpty() || trimmed.startsWith("#")) continue;
                        int eqIdx = trimmed.indexOf('=');
                        if (eqIdx > 0) {
                            String key = trimmed.substring(0, eqIdx).trim();
                            String val = trimmed.substring(eqIdx + 1).trim();
                            if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
                                val = val.substring(1, val.length() - 1);
                            }
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, val);
                            }
                        }
                    }
                    break;
                } catch (Exception ex) {
                    log.warn("Failed to load .env file from {}: {}", path, ex.getMessage());
                }
            }
        }
    }
}
