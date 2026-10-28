package com.campusauction.config;

import com.campusauction.common.enums.CampusVerificationStatus;
import com.campusauction.common.enums.ItemCondition;
import com.campusauction.common.enums.ListingCategory;
import com.campusauction.common.enums.ListingStatus;
import com.campusauction.common.enums.Role;
import com.campusauction.listing.Listing;
import com.campusauction.listing.ListingImage;
import com.campusauction.listing.ListingRepository;
import com.campusauction.user.User;
import com.campusauction.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DatabaseSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DatabaseSeeder.class);

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return; // Data already seeded
        }

        log.info("Seeding realistic campus auction data...");

        // 1. Seed demo student accounts
        User senior1 = User.builder()
                .name("Rohan Sharma")
                .email("rohan.sharma@campus.edu")
                .passwordHash(passwordEncoder.encode("password123"))
                .campusVerificationStatus(CampusVerificationStatus.VERIFIED)
                .role(Role.SENIOR)
                .studentId("SEN-2022-CS-041")
                .phoneNumber("+91 98765 43210")
                .build();

        User senior2 = User.builder()
                .name("Ananya Iyer")
                .email("ananya.iyer@campus.edu")
                .passwordHash(passwordEncoder.encode("password123"))
                .campusVerificationStatus(CampusVerificationStatus.VERIFIED)
                .role(Role.SENIOR)
                .studentId("SEN-2022-EE-019")
                .phoneNumber("+91 98765 43211")
                .build();

        User junior1 = User.builder()
                .name("Karthik Verma")
                .email("karthik.verma@campus.edu")
                .passwordHash(passwordEncoder.encode("password123"))
                .campusVerificationStatus(CampusVerificationStatus.VERIFIED)
                .role(Role.JUNIOR)
                .studentId("JUN-2024-ME-085")
                .phoneNumber("+91 98765 43212")
                .build();

        userRepository.saveAll(List.of(senior1, senior2, junior1));

        // 2. Seed realistic campus listings
        Listing item1 = Listing.builder()
                .seller(senior1)
                .title("Hercules Roadeo 21-Speed Mountain Cycle with Wire Lock")
                .category(ListingCategory.CYCLE)
                .condition(ItemCondition.GOOD)
                .description("Leaving campus next month. Serviced 2 weeks ago, new brake pads, front suspension works smoothly. Comes with heavy-duty combination wire lock and bell.")
                .startingPrice(new BigDecimal("1200.00"))
                .minimumBidIncrement(new BigDecimal("50.00"))
                .currentHighestBid(new BigDecimal("1200.00"))
                .closingAt(OffsetDateTime.now().plusHours(18))
                .status(ListingStatus.OPEN)
                .bidCount(0)
                .build();

        ListingImage img1 = ListingImage.builder()
                .listing(item1)
                .imageUrl("https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80")
                .displayOrder(0)
                .build();
        item1.getImages().add(img1);

        Listing item2 = Listing.builder()
                .seller(senior2)
                .title("Casio FX-991CW ClassWiz Scientific Calculator")
                .category(ListingCategory.CALCULATOR)
                .condition(ItemCondition.LIKE_NEW)
                .description("Used for just two semesters of Engineering Math and Signals & Systems. Pristine display, original slide-on hard case included. Approved for all university exams.")
                .startingPrice(new BigDecimal("450.00"))
                .minimumBidIncrement(new BigDecimal("25.00"))
                .currentHighestBid(new BigDecimal("500.00"))
                .leadingBidder(junior1)
                .closingAt(OffsetDateTime.now().plusHours(32))
                .status(ListingStatus.OPEN)
                .bidCount(2)
                .build();

        ListingImage img2 = ListingImage.builder()
                .listing(item2)
                .imageUrl("https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80")
                .displayOrder(0)
                .build();
        item2.getImages().add(img2);

        Listing item3 = Listing.builder()
                .seller(senior1)
                .title("Introduction to Algorithms (CLRS 3rd Ed) + Operating System Concepts")
                .category(ListingCategory.BOOKS)
                .condition(ItemCondition.GOOD)
                .description("Must-have bundle for 2nd and 3rd year CS/IT students. Clean pages with minimal pencil highlights. Saves over 70% compared to bookstore new copies.")
                .startingPrice(new BigDecimal("350.00"))
                .minimumBidIncrement(new BigDecimal("20.00"))
                .currentHighestBid(new BigDecimal("350.00"))
                .closingAt(OffsetDateTime.now().plusHours(4))
                .status(ListingStatus.OPEN)
                .bidCount(0)
                .build();

        ListingImage img3 = ListingImage.builder()
                .listing(item3)
                .imageUrl("https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80")
                .displayOrder(0)
                .build();
        item3.getImages().add(img3);

        Listing item4 = Listing.builder()
                .seller(senior2)
                .title("Arduino Mega 2560 R3 + Full Sensor Lab Starter Kit")
                .category(ListingCategory.LAB_EQUIPMENT)
                .condition(ItemCondition.LIKE_NEW)
                .description("Complete kit with ultrasonic sensors, servo motors, breadboard, LCD module, jumper wires, and original component organizer box. Ideal for IoT and robotics lab courses.")
                .startingPrice(new BigDecimal("800.00"))
                .minimumBidIncrement(new BigDecimal("50.00"))
                .currentHighestBid(new BigDecimal("800.00"))
                .closingAt(OffsetDateTime.now().plusDays(3))
                .status(ListingStatus.OPEN)
                .bidCount(0)
                .build();

        ListingImage img4 = ListingImage.builder()
                .listing(item4)
                .imageUrl("https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80")
                .displayOrder(0)
                .build();
        item4.getImages().add(img4);

        Listing item5 = Listing.builder()
                .seller(senior1)
                .title("Ergonomic Mesh Study Chair with Lumbar Support")
                .category(ListingCategory.FURNITURE)
                .condition(ItemCondition.GOOD)
                .description("Sturdy pneumatic height adjustable study chair. Breathable mesh backrest. Great for hostel or rented apartment study setups.")
                .startingPrice(new BigDecimal("750.00"))
                .minimumBidIncrement(new BigDecimal("50.00"))
                .currentHighestBid(new BigDecimal("850.00"))
                .leadingBidder(junior1)
                .closingAt(OffsetDateTime.now().plusHours(12))
                .status(ListingStatus.OPEN)
                .bidCount(3)
                .build();

        ListingImage img5 = ListingImage.builder()
                .listing(item5)
                .imageUrl("https://images.unsplash.com/photo-1580481077195-c328ad4f4477?auto=format&fit=crop&w=800&q=80")
                .displayOrder(0)
                .build();
        item5.getImages().add(img5);

        listingRepository.saveAll(List.of(item1, item2, item3, item4, item5));
        log.info("Database seeding completed successfully with 3 users and 5 active auctions.");
    }
}
