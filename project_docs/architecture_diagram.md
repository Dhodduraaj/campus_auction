# System Architecture Diagram — Campus Auction Platform

This document describes the high-level and component-level architecture of the **Campus Auction Platform**.

---

## 1. High-Level Architecture Overview

The system uses a decoupled, three-tier architecture with real-time bidirectional messaging:
- **Client Tier**: Single Page Application (SPA) built with React, Vite, TypeScript, and Tailwind CSS.
- **Application Tier**: Spring Boot 3.3.4 (Java 21 LTS) REST APIs, Spring Security with stateless JWT, Spring WebSocket with in-memory STOMP broker, and Spring Task Scheduling.
- **Persistence Tier**: PostgreSQL 17 relational database with Flyway version-controlled schema migrations and HikariCP connection pooling.

```mermaid
graph TB
    subgraph Client_Tier["Client Tier (Frontend - Port 5180)"]
        Browser["Student Browser (Desktop / Mobile)"]
        ReactApp["React 19 + TypeScript SPA"]
        TailwindUI["Tailwind CSS (Bold Auction Theme)"]
        StompClient["STOMP / SockJS Client"]
        WebNotificationAPI["Web Notifications API (Desktop Popups)"]
        
        Browser --> ReactApp
        ReactApp --> TailwindUI
        ReactApp --> StompClient
        ReactApp --> WebNotificationAPI
    end

    subgraph Gateway_Proxy["Development & Routing Gateway"]
        ViteProxy["Vite Dev Reverse Proxy (Port 5180)"]
        ReactApp -.->|HTTP REST /api| ViteProxy
        ReactApp -.->|Static /uploads| ViteProxy
        StompClient -.->|WebSocket /ws| ViteProxy
    end

    subgraph Backend_Tier["Backend Application Tier (Spring Boot 3.3.4 / Java 21 - Port 8085)"]
        Tomcat["Embedded Apache Tomcat"]
        SecurityFilter["Spring Security Filter Chain (JWT Auth)"]
        
        subgraph Controllers["REST Controllers"]
            AuthController["AuthController (/api/auth)"]
            ListingController["ListingController (/api/listings)"]
            BidController["BidController (/api/listings/{id}/bids)"]
            HandoverController["HandoverController (/api/listings/{id})"]
            UserController["UserController (/api/users/me)"]
            FileController["FileController (/api/listings/upload-image)"]
        end

        subgraph Service_Layer["Business & Engine Services"]
            AuthService["AuthService (Campus Verification)"]
            ListingService["ListingService (Validations & Specifications)"]
            BiddingService["BiddingService (Pessimistic Lock Engine)"]
            Scheduler["AuctionClosingScheduler (@Scheduled Auto-Close)"]
            HandoverService["HandoverService (Seller Approval & Handover)"]
            NotificationService["NotificationService (In-app + Live Push)"]
            AuditService["AuditService (Append-only Audit Log)"]
            FileStorageService["FileStorageService (Local / Cloudinary)"]
        end

        subgraph Messaging_Subsystem["Real-Time Subsystem"]
            WsBroker["Spring STOMP Message Broker (/topic, /queue)"]
            PubSub["Auction & Notification Event Broadcaster"]
        end

        subgraph ORM_Data_Access["Spring Data JPA & Hibernate"]
            Repositories["JPA Repositories (LockModeType.PESSIMISTIC_WRITE)"]
            HikariPool["HikariCP Connection Pool"]
        end
    end

    subgraph Storage_Tier["Data & Storage Tier"]
        PostgresDB[("PostgreSQL 17 Database\n(campus_auction)")]
        FlywayMigration["Flyway Migration Engine (V1__initial_schema.sql)"]
        DiskUploads["Local Disk Uploads (/uploads/**)"]
    end

    %% Wiring
    ViteProxy -->|Proxy HTTP :8085| Tomcat
    ViteProxy -->|Proxy WS :8085| Tomcat
    Tomcat --> SecurityFilter
    SecurityFilter --> Controllers
    
    Controllers --> Service_Layer
    Service_Layer --> Messaging_Subsystem
    Messaging_Subsystem --> WsBroker
    WsBroker -.->|Push to /topic/auctions/{id}| StompClient
    WsBroker -.->|Push to /topic/notifications/{userId}| StompClient

    Service_Layer --> Repositories
    Repositories --> HikariPool
    HikariPool --> PostgresDB
    FlywayMigration -.->|On Startup| PostgresDB
    FileStorageService --> DiskUploads
```

---

## 2. Component Layer Responsibilities

### 2.1 Security & Authentication Flow
- **Filter**: `JwtAuthenticationFilter` intercepts requests, extracts `Bearer <token>`, validates HMAC-SHA256 signature, and injects `UserPrincipal` into Spring's `SecurityContext`.
- **Statelessness**: Session creation is set to `STATELESS`.
- **Domain Verification**: `AuthService` verifies college email domains (e.g. `@campus.edu`, `@university.ac.in`).

### 2.2 Concurrency & Bidding Engine
- `BiddingService` executes inside a `@Transactional(isolation = Isolation.READ_COMMITTED)` boundary.
- Employs database row locking: `SELECT ... FROM listings WHERE id = :id FOR UPDATE` (`LockModeType.PESSIMISTIC_WRITE`).
- Guarantees serialized execution for competing bids submitted in the same millisecond.

### 2.3 Automated Closing Engine
- `AuctionClosingScheduler` runs every 5,000ms.
- Evaluates `closing_at <= NOW()` on authoritative UTC clock.
- Idempotently transitions auctions without client tab dependency.

### 2.4 Real-time STOMP Messaging
- Client connects via SockJS fallback or native WebSocket to `/ws`.
- Subscribes to:
  - `/topic/auctions/{id}`: Live price and leading bidder changes.
  - `/topic/auctions/{id}/bids`: Live bid stream prepending to bid history table.
  - `/topic/auctions`: Global marketplace card updates.
  - `/topic/notifications/{userId}`: Private student alerts.
