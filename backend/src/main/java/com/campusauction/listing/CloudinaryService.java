package com.campusauction.listing;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryService.class);

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-key:}")
    private String apiKey;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    private Cloudinary cloudinary;

    @PostConstruct
    public void init() {
        if (isConfigured()) {
            this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName.trim(),
                    "api_key", apiKey.trim(),
                    "api_secret", apiSecret.trim(),
                    "secure", true
            ));
            log.info("Cloudinary service initialized successfully for cloud: {}", cloudName);
        } else {
            log.info("Cloudinary credentials not provided. Falling back to local disk storage for uploads.");
        }
    }

    public boolean isConfigured() {
        return StringUtils.hasText(cloudName) && StringUtils.hasText(apiKey) && StringUtils.hasText(apiSecret);
    }

    /**
     * Upload an uploaded multipart file to Cloudinary.
     * Returns the permanent secure HTTPS URL.
     */
    public String uploadFile(MultipartFile file) throws IOException {
        if (!isConfigured() || cloudinary == null) {
            throw new IllegalStateException("Cloudinary is not configured.");
        }

        Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                "folder", "campus_auction",
                "resource_type", "image"
        ));

        String secureUrl = (String) uploadResult.get("secure_url");
        log.info("Image uploaded successfully to Cloudinary: {}", secureUrl);
        return secureUrl;
    }

    /**
     * Upload an image from a remote URL to Cloudinary.
     */
    public String uploadUrl(String remoteUrl, String publicId) throws IOException {
        if (!isConfigured() || cloudinary == null) {
            throw new IllegalStateException("Cloudinary is not configured.");
        }

        Map<?, ?> uploadResult = cloudinary.uploader().upload(remoteUrl, ObjectUtils.asMap(
                "folder", "campus_auction/samples",
                "public_id", publicId,
                "resource_type", "image",
                "overwrite", true
        ));

        String secureUrl = (String) uploadResult.get("secure_url");
        log.info("Remote image uploaded to Cloudinary: {} -> {}", remoteUrl, secureUrl);
        return secureUrl;
    }
}
