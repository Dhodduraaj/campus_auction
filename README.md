# Campus Auction Platform

> “Build the place where campus competes fairly for them, and every item finds its next owner.”

A production-minded, full-stack college second-hand auction platform built for graduating seniors to pass down cycles, calculators, textbooks, electronics, and lab equipment, and for juniors to bid transparently without hidden negotiation.

---

## 🏛️ System Architecture

```
campus_auction/
├── backend/                              # Spring Boot 3.3.4 (Java 21 LTS)
│   ├── src/main/java/com/campusauction/
│   │   ├── config/                       # Security, WebConfig, WebSocket, DatabaseSeeder, OpenAPI
│   │   ├── security/                     # Spring Security, JWT Token Provider, UserPrincipal
│   │   ├── auth/                         # Register, Login, Me endpoints & services
│   │   ├── user/                         # Student accounts, Profiles, Statistics
│   │   ├── listing/                      # One item, one auction lifecycle & image storage
│   │   ├── bid/                          # Concurrency engine with Pessimistic Locking
│   │   ├── auction/                      # Auto-closing scheduled process & outcomes
│   │   ├── handover/                     # Seller approval & campus handover confirmation
│   │   ├── notification/                 # In-app & Web Notifications API & STOMP push
│   │   ├── audit/                        # Append-only audit trail
│   │   └── common/                       # Centralized exception handling, DTOs, Enums
│   ├── src/main/resources/
│   │   ├── application.properties        # Authoritative UTC timestamps, PostgreSQL config
│   │   └── db/migration/V1__initial_schema.sql # Flyway migration schema
│   ├── src/test/java/                    # JUnit 5 integration & concurrency tests
│   ├── mvnw.cmd                          # Maven wrapper targeting Java 21 LTS
│   └── pom.xml
│
├── frontend/                             # React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/                   # Bold auction theme components, Navbar, Footer
│   │   ├── pages/                        # Home, Marketplace, Listing Details, Create, My Bids, etc.
│   │   ├── context/                      # AuthContext & NotificationContext
│   │   ├── services/                     # ApiClient, WebSocket STOMP client, Web Notifications API
│   │   └── types/                        # Full TypeScript API contracts
│   ├── tailwind.config.js                # Editorial auction house color palette
│   └── vite.config.ts                    # Reverse proxy for REST API, WebSockets & uploads
│
├── project-docs/                         # Project design specifications & architecture guides
├── .env.example                          # Environment template
└── README.md
```

---

## ⚡ Core Features & Engineering Highlights

### 1. Concurrency-Safe Bidding Engine
- Atomic transactional bid acceptance protected by database row-level pessimistic locking (`@Lock(LockModeType.PESSIMISTIC_WRITE)`).
- Re-reads and strictly validates the committed auction state inside the transaction boundary.
- Minimum acceptable bid calculated authoritatively on the backend:
  - If no bids: `Minimum acceptable bid = startingPrice`
  - If bids exist: `Minimum acceptable bid = currentHighestBid + minimumBidIncrement`
- Sellers are strictly prohibited from bidding on their own listings.
- Rejected bids never corrupt state or become winning bids.

### 2. Idempotent Automated Auction Closing
- Spring `@Scheduled` worker continuously scans for expired open auctions (`closingAt <= NOW()`).
- Automatically transitions auctions:
  - No bids: Marked `UNSOLD`.
  - With bids: Marked `AWAITING_SELLER_APPROVAL` with provisional winner assigned.
- Independent of browser tabs—auctions close reliably on the authoritative UTC clock.

### 3. Seller Approval & In-Person Handover Lifecycle
```
DRAFT → OPEN → AWAITING_SELLER_APPROVAL → RESERVED → SOLD
                    ↓                         ↓
              SELLER_REJECTED           PICKUP_FAILED
```
- **Seller Approval**: Seller approves or rejects the winning reserve price.
- **Handover Confirmation**: Both seller and winning student must confirm in-person exchange on campus before the auction transitions to `SOLD`.
- Handover failure or dispute can be recorded with verified audit reasons.

### 4. Real-Time WebSocket & Web Notifications API
- Live bid updates broadcast to listing subscribers via Spring WebSocket STOMP (`/ws`, `/topic/auctions/{id}/bids`).
- Bid histories update in real-time without page refresh.
- Browser desktop notification pop-ups powered by the Web Notifications API (with opt-in toggle).

### 5. Bold Editorial Auction Aesthetic
- Solid, high-contrast, professional auction house identity:
  - Deep charcoal/navy foundation (`#0f172a`)
  - Warm ivory/slate canvas (`#f8fafc`)
  - Strong auction orange accents (`#ea580c`)
  - Confirmed teal badges (`#059669`)
- Zero distracting gradients or generic placeholders.

---

## 🚀 Quick Start Guide

### Prerequisites
- Java 21 LTS (`jdk-21`)
- PostgreSQL 17 (Running on `localhost:5432`)
- Node.js v20+ and npm

### 1. Database Configuration
Ensure PostgreSQL is running. The database `campus_auction` is created and managed via Flyway migrations:
```sql
CREATE DATABASE campus_auction;
```
Configure your credentials in `backend/src/main/resources/application.properties` or environment variables:
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/campus_auction
spring.datasource.username=postgres
spring.datasource.password=dhoddudb
```

### 2. Start the Backend Server
```bash
cd backend
./mvnw.cmd spring-boot:run
```
- Backend starts at: `http://localhost:8085`
- Swagger OpenAPI documentation: `http://localhost:8085/swagger-ui.html`
- Initial demo data is seeded automatically on first boot.

### 3. Start the Frontend Application
```bash
cd frontend
npm install
npm run dev
```
- Frontend application starts at: `http://localhost:5180`

---

## 👥 Demo Testing Accounts

Pre-seeded with active listings and bids for instant evaluation:

| Role | Name | Email | Password |
|---|---|---|---|
| **Senior Seller** | Rohan Sharma | `rohan.sharma@campus.edu` | `password123` |
| **Senior Seller** | Ananya Iyer | `ananya.iyer@campus.edu` | `password123` |
| **Junior Bidder** | Karthik Verma | `karthik.verma@campus.edu` | `password123` |

*(Use the 1-Click Fill buttons on the Sign In page for rapid switching between seller and bidder roles).*

---

## 🧪 Testing & Verification

### Run Backend Unit & Integration Tests:
```bash
cd backend
./mvnw.cmd test
```
Tests verify:
- Student registration, login & JWT security
- First bid = starting price rule
- Minimum bid increment validation
- Anti-seller self-bidding restriction
- UTC expiration timestamp enforcement
- End-to-end auction creation, bidding, seller approval, and handover

### Verify Frontend Production Build:
```bash
cd frontend
npm run build
```
Builds cleanly with TypeScript strict typing and Tailwind CSS optimization.
