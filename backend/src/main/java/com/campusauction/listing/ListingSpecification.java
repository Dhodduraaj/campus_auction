package com.campusauction.listing;

import com.campusauction.common.enums.ItemCondition;
import com.campusauction.common.enums.ListingCategory;
import com.campusauction.common.enums.ListingStatus;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

public class ListingSpecification {

    public static Specification<Listing> filter(
            String search,
            ListingCategory category,
            ItemCondition condition,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            ListingStatus status,
            Boolean closingSoon
    ) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }

            if (category != null) {
                predicates.add(cb.equal(root.get("category"), category));
            }

            if (condition != null) {
                predicates.add(cb.equal(root.get("condition"), condition));
            }

            if (StringUtils.hasText(search)) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate titleMatch = cb.like(cb.lower(root.get("title")), pattern);
                Predicate descMatch = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(titleMatch, descMatch));
            }

            if (minPrice != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("currentHighestBid"), minPrice));
            }

            if (maxPrice != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("currentHighestBid"), maxPrice));
            }

            if (Boolean.TRUE.equals(closingSoon)) {
                OffsetDateTime now = OffsetDateTime.now();
                OffsetDateTime next24h = now.plusHours(24);
                predicates.add(cb.greaterThan(root.get("closingAt"), now));
                predicates.add(cb.lessThanOrEqualTo(root.get("closingAt"), next24h));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
