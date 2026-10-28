The Campus Auction Platform has been built, tested, and verified end to end.

🏛️ Summary of Deliverables & System Architecture
campus_auction/
├── backend/                              # Spring Boot 3.3.4 (Java 21 LTS)
│   ├── src/main/java/com/campusauction/
│   │   ├── config/                       # Security, WebConfig, WebSocket STOMP, DatabaseSeeder, OpenAPI
│   │   ├── security/                     # Spring Security, JWT Token Provider, UserPrincipal
│   │   ├── auth/                         # Register, Login, Me endpoints & services
│   │   ├── user/                         # Student profiles & database-backed metrics
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
└── README.md                             # Comprehensive setup and run guide
🎯 Key Engineering Highlights
1. Concurrency-Safe Bidding Engine (BiddingService.java)
Protected by PostgreSQL row-level pessimistic locking (@Lock(LockModeType.PESSIMISTIC_WRITE)).
Atomically validates the committed database state inside the transaction to eliminate lost updates, race conditions, and stale-price bids.
Authoritative minimum acceptable bid calculated server-side:
If no accepted bids: $\text{Min Acceptable Bid} = \text{Starting Price}$
If accepted bids exist: $\text{Min Acceptable Bid} = \text{Current Highest Bid} + \text{Minimum Bid Increment}$
Rejects bids from the seller on their own items and bids submitted after the closing timestamp.
2. Scheduled Auto-Closing Process (AuctionClosingScheduler.java)
Independent Spring @Scheduled worker continuously evaluates expired open auctions (closingAt <= NOW()) on the authoritative UTC clock.
Idempotently marks auctions with 0 bids as UNSOLD, and auctions with valid bids as AWAITING_SELLER_APPROVAL with the provisional winner assigned.
3. Seller Approval & Campus Handover State Machine (HandoverService.java)
$$\text{DRAFT} \longrightarrow \text{OPEN} \longrightarrow \text{AWAITING_SELLER_APPROVAL} \longrightarrow \text{RESERVED} \longrightarrow \text{SOLD}$$ $$\text{Outcomes: } \text{UNSOLD},\ \text{SELLER_REJECTED},\ \text{CANCELLED},\ \text{PICKUP_FAILED}$$

After bidding concludes, the seller explicitly approves or rejects the winning reserve.
When approved (RESERVED), both the seller and winning student must confirm in-person campus handover before the auction transitions to SOLD.
4. Real-Time Communication & Web Notifications API
Spring WebSocket STOMP broker at /ws broadcasts live bids (/topic/auctions/{id}/bids) and listing state changes (/topic/auctions/{id}) so bid tables update without page reloads.
Desktop browser alerts integrated via the browser's Web Notifications API with an opt-in toggle.
5. Bold Editorial Auction Aesthetics
Built with solid colors and controlled contrast: deep navy/charcoal (#0f172a), warm ivory/slate canvas (#f8fafc), strong auction orange (#ea580c), and verified emerald badges (#059669). Zero distracting gradients.
🧪 Verification & Test Results
Backend Integration & Concurrency Tests:
[INFO] Tests run: 4, Failures: 0, Errors: 0, Skipped: 0
Verified student registration, login, first-bid rule, increment enforcement, self-bidding rejection, and closing boundaries.
Frontend Production Build:
✓ built in 941ms with strict TypeScript checks passing without warnings.
Browser Journey:
Navigated the marketplace, filtered categories, logged in as junior student Karthik, submitted a live bid of $550.00 on the Casio Scientific Calculator, and confirmed the live bid history update and student profile statistics.
🚀 Running the Platform Locally
PostgreSQL Database:

Database: campus_auction
Port: 5432 | User: postgres | Password: dhoddudb
Managed automatically via Flyway migrations.
Backend:

powershell
cd backend
.\mvnw.cmd spring-boot:run
Running at: http://localhost:8085
Swagger OpenAPI Docs: http://localhost:8085/swagger-ui.html
Frontend:

powershell
cd frontend
npm run dev
Running at: http://localhost:5180
Pre-Seeded Demo Accounts:

Senior Seller (Cycles, Books): rohan@campus.edu / password123
Senior Seller (Calculators, Lab Kits): ananya@campus.edu / password123
Junior Bidder: karthik@campus.edu / password123 (1-Click Fill buttons are available on the Sign In page for quick testing).
9:47 AM
now inside the project_docs folder create visualization diagrams of the project such as database digram, workflow, ER diagram, architectural diagram
10:39 AM
All visualization diagrams have been created and formatted in standard GitHub-Flavored Markdown with native Mermaid diagram syntax inside the project documentation folders (

project-docs
 / 

project_docs
).

📑 Diagram Directory & Document Overview
Diagram	File Link	Focus & Highlights
System Architecture Diagram	

architecture_diagram.md
Three-Tier Architecture: Client SPA (React 19, TypeScript, Tailwind, STOMP), Gateway proxy, Spring Boot 3.3.4 (Java 21 LTS), Spring Security JWT Filter Chain, REST Controllers, Service Layer, STOMP in-memory WebSocket broker, and PostgreSQL 17 via HikariCP.
Entity-Relationship (ER) Diagram	

er_diagram.md
Relational Entities & Cardinalities: All 8 domain tables (users, listings, listing_images, bids, auction_outcomes, handovers, notifications, audit_events), Primary Keys, Foreign Keys, cascade rules, and decimal-safe NUMERIC(12,2) representations.
Database Schema Diagram	

database_diagram.md
Physical Schema & Index Optimization: Physical column types, table constraints, composite B-Tree indexes (idx_listings_status_closing, etc.), and row-level pessimistic locking (SELECT ... FOR UPDATE).
Workflow & State Machine Diagrams	

workflow_diagrams.md
State Machine & Concurrency Sequences: Auction lifecycle state transitions, concurrent bidding sequence diagram with pessimistic write locks, automated auto-closing worker flow, and dual-party handover confirmation.
🔍 Quick Visual Summary of the Diagrams
1. System Architecture Diagram
mermaid
graph TB
    subgraph Client_Tier["Client Tier (React 19 + TypeScript - Port 5180)"]
        Browser["Student Browser"]
        ReactApp["React SPA + Tailwind CSS"]
        StompClient["STOMP / SockJS Client"]
        Browser --> ReactApp
        ReactApp --> StompClient
    end
    subgraph Backend_Tier["Backend Application Tier (Spring Boot 3.3.4 - Port 8085)"]
        Tomcat["Embedded Tomcat Web Server"]
        Security["Spring Security (Stateless JWT Filter)"]
        Controllers["REST Controllers (/api/auth, /api/listings, /api/bids)"]
        Services["Business Services (Auth, Listing, Bidding, Handover)"]
        Scheduler["AuctionClosingScheduler (@Scheduled Worker)"]
        WsBroker["Spring STOMP Message Broker (/topic, /queue)"]
        Repositories["Spring Data JPA Repositories (Pessimistic Locks)"]
        
        Tomcat --> Security --> Controllers --> Services
        Services --> WsBroker
        WsBroker -.->|WebSocket /ws Push| StompClient
        Services --> Repositories
        Scheduler --> Repositories
    end
    subgraph Storage_Tier["Data Tier"]
        PostgresDB[("PostgreSQL 17 Database\n(campus_auction)")]
        DiskUploads["Local Disk Uploads (/uploads/**)"]
        Repositories --> PostgresDB
        Services --> DiskUploads
    end
2. Auction Lifecycle State Machine
mermaid
stateDiagram-v2
    [*] --> DRAFT : Seller drafts listing
    DRAFT --> OPEN : Published (Closing time in future)
    
    OPEN --> OPEN : Valid bid accepted (Atomic update)
    OPEN --> CANCELLED : Seller cancels (Only if open, bid history preserved)
    
    state "Closing Time Reached (UTC)" as AutoClose
    OPEN --> AutoClose : closing_at <= NOW()
    
    AutoClose --> UNSOLD : 0 accepted bids
    AutoClose --> AWAITING_SELLER_APPROVAL : Has accepted bids (Provisional winner assigned)
    
    AWAITING_SELLER_APPROVAL --> SELLER_REJECTED : Seller declines reserve price
    AWAITING_SELLER_APPROVAL --> RESERVED : Seller approves winning bid
    
    state "Campus In-Person Handover" as Handover
    RESERVED --> Handover : Exchange item on campus
    
    Handover --> SOLD : Dual confirmation (Both Seller & Buyer confirm)
    Handover --> PICKUP_FAILED : Verified pickup/handover issue reported
    
    UNSOLD --> [*]
    CANCELLED --> [*]
    SELLER_REJECTED --> [*]
    SOLD --> [*]
    PICKUP_FAILED --> [*]
3. Concurrent Bidding Serialization Sequence
mermaid
sequenceDiagram
    autonumber
    actor BidderA as Junior Student A ($525.00)
    actor BidderB as Junior Student B ($525.00)
    participant Service as BiddingService (@Transactional)
    participant DB as PostgreSQL 17 (Pessimistic Lock)
    participant WS as WebSocket STOMP Broker
    Note over BidderA,BidderB: Both click 'Place Secure Bid' simultaneously
    BidderA->>Service: placeBid(listingId=4, amount=525.00)
    BidderB->>Service: placeBid(listingId=4, amount=525.00)
    
    Service->>DB: Thread A acquires SELECT ... FOR UPDATE on listing row
    Note over DB: Lock granted to Thread A. Thread B waits safely on lock.
    Service->>DB: Thread A validates: $525.00 >= $525.00. Inserts bid & updates leading price.
    Service->>DB: Thread A Commits Transaction. Lock released.
    Service->>WS: Broadcast new price $525.00 to subscribers
    Service-->>BidderA: 201 Created (Bid Accepted)
    Note over DB: Lock granted to Thread B. Reads committed state (Current = $525.00).
    Note over Service: Thread B re-evaluates: Next min bid is $550.00 ($525 + $25 increment).
    Note over Service: Validation fails: $525.00 < $550.00.
    Service->>DB: Thread B Rollback Transaction
    Service-->>BidderB: 422 Unprocessable Entity ("Bid below minimum required bid of $550.00")
All documents can be viewed directly in markdown or rendered in any Git / Markdown preview tool via the links above.

All visualization diagrams and documentation for the Campus Auction Platform are organized inside the 

project_docs
 folder.

Each model is provided in dual formats:

Interactive Markdown (.md) with GitHub-flavored Mermaid blocks.
High-Resolution Vector / PNG Assets (.png) embedded directly into the markdown files and available for standalone presentation.
Interactive Visualizer (index.html): A standalone browser-based dashboard with tab switching, zoom, and live toggle between vector Mermaid SVG and rendered high-res PNG views.
📑 Summary of Generated Diagrams
Category	Markdown Spec & Details	Visual Asset (PNG)	Core Architectural Focus
🏗️ System Architecture	

architecture_diagram.md


architecture_diagram.png
3-tier decoupling (React 19 / Spring Boot 3.3.4 / PostgreSQL 17), Spring Security JWT stateless filter, STOMP WebSocket broker (/topic, /queue), HikariCP connection pool, and Vite dev reverse proxy.
🗄️ Database Schema	

database_diagram.md


database_diagram.png
PostgreSQL 17 physical layout across all 8 tables, decimal-safe NUMERIC(12,2) monetary types, pessimistic locking query structure (FOR UPDATE), and 9 B-tree performance indexes.
📊 Entity-Relationship (ER)	

er_diagram.md


ER_diagram.png
Complete relational entity model (users, listings, listing_images, bids, auction_outcomes, handovers, notifications, audit_events), cardinalities, primary/foreign keys, and cascade rules.
🔄 Workflows & State Machines	

workflow_diagrams.md


workflow_diagram.png
4 lifecycle & concurrency models:
1. Auction Lifecycle State Machine (DRAFT → OPEN → RESERVED → SOLD / PICKUP_FAILED / UNSOLD / CANCELLED)
2. Concurrent Bidding Serialization Sequence (Sub-millisecond lock acquisition preventing race conditions)
3. Auto-Closing Scheduler Engine Flowchart (Every 5s UTC clock boundary check)
4. Dual-Party Campus Handover Sequence (In-person exchange dual confirmation)
🌐 Standalone Interactive Viewer
You can open the visualization dashboard in your browser:



project_docs/index.html
Main Documentation Index: 

project_docs/README.md
10:39 AM
11:13 AM
Implementation Summary: Role-Based Access, Clean UI, INR Currency & Dark Theme
The Campus Auction Platform has been updated end-to-end across the React 19 frontend, Spring Boot 3.3.4 (Java 21) backend, and PostgreSQL 17 database. All existing auction rules, transaction locks, live WebSockets, data records, and deployment settings were preserved.

1. Database Migration & Historical User Reclassification
Migration File: 

V2__role_migration.sql
Intelligently classified existing accounts based on activity: accounts with item listings were reclassified to 'SENIOR', while historical bidders were reclassified to 'JUNIOR'.
Added a PostgreSQL CHECK constraint: CONSTRAINT check_user_role CHECK (role IN ('JUNIOR', 'SENIOR', 'ADMIN')).
Set column default to 'JUNIOR'. Existing user records, passwords, and auctions remained intact.
2. Registration — Two Strict User Roles (Junior vs Senior)
Frontend (

RegisterPage.tsx
):
Two selectable role cards with solid backgrounds, distinct icons, and visible selected states:
Junior: "Bid on items" (Gavel icon, solid background, ring highlight).
Senior: "Sell items" (Tag icon, solid background, ring highlight).
Clean form: Name (Full name), College email (College email), Password (Password), Confirm password (Confirm password), Account type selection, and Register button.
Role-based redirect upon registration: Seniors are routed to My Listings, Juniors to Marketplace.
Backend Enforcement (

AuthService.java
, 

RegisterRequest.java
):
Requires @NotNull Role role. Rejects any non-standard role (e.g. attempting to pass ADMIN) with HTTP 400 Bad Request.
3. Server-Side Authorization & Role Enforcement
Strict Spring Security @PreAuthorize method security and service-level checks:

Junior Permissions Enforced:
Can browse auctions, view public bid history, and place bids (@PreAuthorize("hasRole('JUNIOR') or hasRole('ADMIN')") in 

BidController.java
).
Junior accounts attempting to create listings receive HTTP 403 Forbidden.
Junior accounts cannot approve/reject winning bids or access seller endpoints.
Senior Permissions Enforced:
Can create and manage own listings (@PreAuthorize("hasRole('SENIOR') or hasRole('ADMIN')") in 

ListingController.java
 & 

FileController.java
).
Ownership validation: Seniors cannot cancel or modify another user's listing (tested and verified with HTTP 403 Forbidden).
Can approve/reject provisional winners (@PreAuthorize("hasRole('SENIOR') or hasRole('ADMIN')") in 

HandoverController.java
).
Senior accounts attempting to bid on any auction are blocked with HTTP 403 Forbidden (ForbiddenException("Only Junior accounts can place bids.") in 

BiddingService.java
).
Tamper Resistance:
Client-supplied IDs and roles are disregarded; the server extracts the user ID and role directly from the trusted JWT SecurityContext.
4. Role-Specific Navigation & Access Guards
Navbar (

Navbar.tsx
):
Junior: Browse Auctions, My Bids, Notifications, Profile (Hide Create Listing and My Listings).
Senior: Browse Auctions, Create Listing, My Listings, Notifications, Profile (Hide My Bids).
Role pill badges (SENIOR in amber, JUNIOR in sky blue) displayed in user dropdown.
Route Guard (

App.tsx
):
Direct URL hash attempts to unauthorized routes display a compact access-denied state with a clear redirect button rather than just relying on hidden links.
5. Indian Rupee (INR ₹) Currency Standardization
Central Utility (

frontend/src/utils/currency.ts
):
Created formatCurrency(amount) utilizing Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }). Formats integers without trailing .00 (e.g. ₹500, ₹1,200, ₹1,25,000) and preserves paise when non-zero.
Application-Wide Application:
Replaced all hardcoded $ symbols in 

AuctionCard.tsx
, 

MarketplacePage.tsx
, 

ListingDetailPage.tsx
 (quick increment buttons +₹20, +₹50, next valid bid), 

CreateListingPage.tsx
, 

MyListingsPage.tsx
, and 

MyBidsPage.tsx
.
Backend audit messages, exception messages, and scheduler notifications all updated to ₹. Underlying BigDecimal and NUMERIC(12,2) precision preserved.
6. Complete Dark Theme (Solid Colors, Zero Gradients)
Theme Engine (

ThemeContext.tsx
 & 

tailwind.config.js
):
Class-based dark mode (darkMode: 'class').
Persisted in localStorage under campus_auction_theme.
Sun/Moon toggle located in the main navigation bar.
Color Palette:
Light Mode: Warm off-white/slate backgrounds (#f8fafc), clean white cards, dark slate text.
Dark Mode: Deep navy/slate solid background (#020617 / #0f172a), solid card surfaces (#1e293b), high-contrast text, solid auction orange primary buttons.
Zero gradients used across all components.
7. Clean, Compact UI & Shortened Placeholders
Removed redundant secondary paragraphs, generic filler marketing text, and long subtitles across all pages.
Standardized short placeholders:
Search items...
Full name
College email
Password & Confirm password
Item title & Item description
Starting price (₹) & Min. bid increment (₹)
8. Verification Results
Verification Check	Result	Details
Backend Unit & Integration Tests	PASS	mvnw.cmd test ran 4 tests, 0 failures, 0 errors (BUILD SUCCESS).
Frontend Production Build	PASS	npm run build compiled 2042 modules in 865ms with zero errors.
Junior Registration & Role Persistence	VERIFIED	Registered aarav@campus.edu with JUNIOR role, stored in PostgreSQL.
Senior Registration & Role Persistence	VERIFIED	Registered priya@campus.edu with SENIOR role, stored in PostgreSQL.
Arbitrary Role Registration Block	VERIFIED	Registration with ADMIN rejected with HTTP 400 Bad Request.
Junior Listing Attempt Block	VERIFIED	Junior attempting POST to /api/listings rejected with HTTP 403 Forbidden.
Senior Bidding Attempt Block	VERIFIED	Senior attempting POST to /api/listings/{id}/bids rejected with HTTP 403 Forbidden.
Junior Valid Bid Execution	VERIFIED	Junior successfully placed bid on listing, broadcast via WebSocket.
Cross-User Listing Cancellation Block	VERIFIED	Senior attempting to cancel another senior's listing rejected with HTTP 403 Forbidden.
Visual Light / Dark Theme Toggle	VERIFIED	Verified smooth solid-color transition, persistent across refresh.
INR Display Consistency	VERIFIED	All monetary fields throughout the application display ₹ with Indian formatting.
11:13 AM
i have updated the cloudinary api keys in the .env file make use of that and integrate cloudinary in our website and make sure these sample product's images are also uploaded in the cloudinary
12:02 PM
Cloudinary Integration & Sample Image Migration Complete
Cloudinary has been integrated into the backend and frontend. The Cloudinary API credentials provided in .env have been verified, active product images have been migrated to Cloudinary, and the image upload pipeline now uploads directly to Cloudinary.

1. Cloudinary Integration Overview
Automatic .env Loader:
Updated 

CampusAuctionApplication.java
 to automatically detect and load environment variables from the root 

.env
 file at startup into system properties.
Cloudinary SDK Dependency:
Added the official com.cloudinary:cloudinary-http44:1.39.0 dependency to 

backend/pom.xml
.
Cloudinary Configuration & Service:
Added properties to 

application.properties
:
properties
cloudinary.cloud-name=${CLOUDINARY_CLOUD_NAME:}
cloudinary.api-key=${CLOUDINARY_API_KEY:}
cloudinary.api-secret=${CLOUDINARY_API_SECRET:}
Created 

CloudinaryService.java
 to manage authenticated API operations, upload multipart files under the campus_auction folder, and return secure HTTPS URLs.
File Storage Fallback Architecture:
Updated 

FileStorageService.java
: When Cloudinary credentials are active, images uploaded via POST /api/listings/upload-image upload directly to Cloudinary CDN. If Cloudinary is ever unreachable, it falls back to local disk storage seamlessly.
2. Sample Product Images Uploaded to Cloudinary
All sample campus auction products were uploaded to Cloudinary (pemtzvgl) under campus_auction/samples:

Product	Category	Cloudinary CDN URL
Hercules Roadeo 21-Speed Mountain Cycle	CYCLE	https://res.cloudinary.com/pemtzvgl/image/upload/v1793169281/campus_auction/samples/sample_cycle.jpg
Casio FX-991CW Scientific Calculator	CALCULATOR	https://res.cloudinary.com/pemtzvgl/image/upload/v1793169282/campus_auction/samples/sample_calculator.jpg
Introduction to Algorithms (CLRS 3rd Ed)	BOOKS	https://res.cloudinary.com/pemtzvgl/image/upload/v1793169283/campus_auction/samples/sample_books.jpg
Arduino Mega 2560 R3 Sensor Lab Kit	LAB_EQUIPMENT	https://res.cloudinary.com/pemtzvgl/image/upload/v1793169284/campus_auction/samples/sample_arduino.jpg
Ergonomic Mesh Study Chair	FURNITURE	https://res.cloudinary.com/pemtzvgl/image/upload/v1793169310/campus_auction/samples/sample_chair.jpg
Biomedical Lab Microscope Kit	LAB_EQUIPMENT	https://res.cloudinary.com/pemtzvgl/image/upload/v1793169286/campus_auction/samples/sample_microscope.jpg
Database Updated: Executed database updates on the PostgreSQL listing_images table so all existing active auctions use the Cloudinary URLs.
Seeder Updated: Updated 

DatabaseSeeder.java
 so any future database seedings also use Cloudinary URLs.
3. Verification & Live Testing
Cloudinary API Ping: Authenticated ping to https://api.cloudinary.com/v1_1/pemtzvgl/ping returned {"status": "ok"}.
Backend Image Upload Test: Verified POST /api/listings/upload-image with an authenticated senior session; returned secure Cloudinary URL (https://res.cloudinary.com/pemtzvgl/image/upload/...).
Backend Test Suite: mvnw.cmd test executed with 4/4 passing tests (BUILD SUCCESS).
Browser & Marketplace Verification: Verified in browser that the Marketplace (#marketplace) and Listing Detail pages render all Cloudinary images crisply without any layout or network errors.
12:02 PM