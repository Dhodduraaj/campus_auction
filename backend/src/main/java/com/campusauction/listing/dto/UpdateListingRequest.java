package com.campusauction.listing.dto;

import com.campusauction.common.enums.ItemCondition;
import com.campusauction.common.enums.ListingCategory;
import jakarta.validation.constraints.Size;
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
public class UpdateListingRequest {

    @Size(min = 3, max = 200, message = "Title must be between 3 and 200 characters")
    private String title;

    private ListingCategory category;

    @Size(min = 10, max = 5000, message = "Description must be between 10 and 5000 characters")
    private String description;

    private ItemCondition condition;

    // Material terms - validated by service to only be modified if bidCount == 0
    private BigDecimal startingPrice;
    private BigDecimal minimumBidIncrement;
    private OffsetDateTime closingAt;

    private List<String> imageUrls;
}
