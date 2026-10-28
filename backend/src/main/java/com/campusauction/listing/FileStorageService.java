package com.campusauction.listing;

import com.campusauction.common.exception.BadRequestException;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);
    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(".jpg", ".jpeg", ".png", ".webp");
    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList("image/jpeg", "image/png", "image/webp");

    private final CloudinaryService cloudinaryService;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    private Path uploadPath;

    @PostConstruct
    public void init() {
        try {
            this.uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(this.uploadPath);
            log.info("Initialized local upload directory at: {}", this.uploadPath);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory!", e);
        }
    }

    public String storeFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BadRequestException("Uploaded file cannot be empty.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            throw new BadRequestException("File must have a valid filename.");
        }

        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            extension = originalFilename.substring(dotIndex).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Invalid image file format. Allowed formats: JPG, PNG, WEBP.");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_MIME_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Invalid image MIME type: " + contentType);
        }

        // 1. Primary Strategy: Cloudinary cloud storage
        if (cloudinaryService.isConfigured()) {
            try {
                String cloudUrl = cloudinaryService.uploadFile(file);
                log.info("Uploaded {} directly to Cloudinary: {}", originalFilename, cloudUrl);
                return cloudUrl;
            } catch (Exception ex) {
                log.warn("Cloudinary upload failed for {}: {}. Falling back to local storage.", originalFilename, ex.getMessage());
            }
        }

        // 2. Fallback Strategy: Local disk storage
        String generatedFilename = UUID.randomUUID().toString() + extension;
        try {
            Path targetLocation = this.uploadPath.resolve(generatedFilename);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            log.info("Stored {} in local storage: /uploads/{}", originalFilename, generatedFilename);
            return "/uploads/" + generatedFilename;
        } catch (IOException ex) {
            log.error("Failed to store file {}", originalFilename, ex);
            throw new RuntimeException("Failed to save uploaded image. Please try again.", ex);
        }
    }
}
