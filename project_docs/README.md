# Campus Auction Platform — Technical Visualizations & Diagrams

This directory contains comprehensive visual models, database schemas, ER models, system architecture, and workflow state machines for the **Campus Auction Platform**.

---

## 🚀 Interactive Visualizer Suite

You can view all diagrams rendered with interactive vector SVG, dark/light themes, zoom, and high-res image previews by opening:
👉 [**Interactive Diagram Viewer (`index.html`)**](file:///d:/study/GitHub/campus_auction/project_docs/index.html) (Open in any modern browser)

---

## 📑 Diagram Directory Index

| Diagram Category | Markdown Document | Visual Asset (PNG) | Key Architectural Highlights |
|---|---|---|---|
| **System Architecture** | [architecture_diagram.md](file:///d:/study/GitHub/campus_auction/project_docs/architecture_diagram.md) | [architecture_diagram.png](file:///d:/study/GitHub/campus_auction/project_docs/architecture_diagram.png) | 3-tier decoupling (React 19 / Spring Boot 3.3.4 / PostgreSQL 17), Spring Security JWT filter, STOMP WebSocket broker, HikariCP connection pool, and Vite proxy. |
| **Database Schema** | [database_diagram.md](file:///d:/study/GitHub/campus_auction/project_docs/database_diagram.md) | [database_diagram.png](file:///d:/study/GitHub/campus_auction/project_docs/database_diagram.png) | PostgreSQL 17 table layout, `NUMERIC(12,2)` monetary precision, 9 B-tree performance indexes, and pessimistic locking query structure (`FOR UPDATE`). |
| **Entity-Relationship (ER)** | [er_diagram.md](file:///d:/study/GitHub/campus_auction/project_docs/er_diagram.md) | [ER_diagram.png](file:///d:/study/GitHub/campus_auction/project_docs/ER_diagram.png) | Relational model of all 8 entities (`users`, `listings`, `listing_images`, `bids`, `auction_outcomes`, `handovers`, `notifications`, `audit_events`), cardinalities, and foreign keys. |
| **Workflows & State Machines** | [workflow_diagrams.md](file:///d:/study/GitHub/campus_auction/project_docs/workflow_diagrams.md) | [workflow_diagram.png](file:///d:/study/GitHub/campus_auction/project_docs/workflow_diagram.png) | 4 core flows: (1) Auction finite state machine, (2) Concurrent bidding lock serialization sequence, (3) Automated 5s scheduled closing engine flowchart, and (4) Dual-party campus handover sequence. |

---

## 🛠️ Diagram Rendering Formats

Every diagram is provided in dual formats:
1. **GitHub-Flavored Markdown Mermaid (`mermaid`)**: Renders natively directly inside GitHub, VS Code, Cursor, and markdown preview tools.
2. **High-Resolution PNG Assets**: Ready for inclusion in slide decks, project reports, and system design reviews.
3. **Standalone HTML Dashboard**: [index.html](file:///d:/study/GitHub/campus_auction/project_docs/index.html) powered by Tailwind CSS and Mermaid.js with one-click toggling between vector SVG and high-resolution PNG modes.
