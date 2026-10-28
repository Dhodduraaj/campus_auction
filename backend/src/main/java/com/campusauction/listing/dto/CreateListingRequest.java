package com.campusauction.listing.dto;

import com.campusauction.common.enums.ItemCondition;
import com.campusauction.common.enums.ListingCategory;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateListingRequest {

    @NotBlank(message = "Title is required")
    @Size(min = 3, max = 200, message = "Title must be between 3 and 200 characters")
    private String title;

    @NotNull(message = "Category is required")
    private ListingCategory category;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 5000, message = "Description must be between 10 and 5000 characters")
    private String description;

    @NotNull(message = "Condition is required")
    private ItemCondition condition;

    @NotNull(message = "Starting price is required")
    @DecimalMin(value = "0.01", message = "Starting price must be positive")
    private BigDecimal startingPrice;

    @NotNull(message = "Minimum bid increment is required")
    @DecimalMin(value = "0.01", message = "Minimum bid increment must be positive")
    private BigDecimal minimumBidIncrement;

    @NotNull(message = "Closing time is required")
    @Future(message = "Closing time must be in the future")
    private OffsetDateTime closingAt;

    @NotEmpty(message = "At least one item image is required")
    private List<String> imageUrls;
}
