package com.campusauction.listing;

import com.campusauction.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/listings")
@RequiredArgsConstructor
@Tag(name = "Listing Images", description = "Upload item images for auctions")
public class FileController {

    private final FileStorageService fileStorageService;

    @PostMapping("/upload-image")
    @PreAuthorize("hasRole('SENIOR') or hasRole('ADMIN')")
    @Operation(summary = "Upload item image")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadImage(@RequestParam("file") MultipartFile file) {
        String url = fileStorageService.storeFile(file);
        return ResponseEntity.ok(ApiResponse.success("Image uploaded successfully", Map.of("url", url)));
    }
}
