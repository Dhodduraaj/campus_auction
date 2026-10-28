# Campus Auction Platform — Technical Visualizations & Diagrams

This directory contains comprehensive visual models, database schemas, ER models, system architecture, and workflow state machines for the **Campus Auction Platform**.

---

## 📑 Diagram Directory Index

| Diagram Document | Description | Key Focus Areas |
|---|---|---|
| [**Architecture Diagram**](file:///d:/study/GitHub/campus_auction/project-docs/architecture_diagram.md) | High-level and component system architecture | Three-tier decoupling, Spring Security JWT filter, STOMP WebSocket broker, PostgreSQL 17, and Vite proxy. |
| [**Entity-Relationship (ER) Diagram**](file:///d:/study/GitHub/campus_auction/project-docs/er_diagram.md) | Relational entity-relationship model | Complete Mermaid ER diagram of all 8 entities, cardinalities, primary/foreign keys, and cascade rules. |
| [**Database Schema Diagram**](file:///d:/study/GitHub/campus_auction/project-docs/database_diagram.md) | Physical database schema & index design | Table definitions, numeric precision (`NUMERIC(12,2)`), B-tree performance index specs, and row locking. |
| [**Workflow & State Machine Diagrams**](file:///d:/study/GitHub/campus_auction/project-docs/workflow_diagrams.md) | Interactive business logic & lifecycle flows | Auction lifecycle state machine, atomic concurrent bidding sequence, auto-closing engine, and dual-party handover verification. |

---

## 🛠️ Diagram Rendering

All diagrams in this directory are written using standard **GitHub-Flavored Markdown Mermaid (`mermaid`)** blocks. They render natively on GitHub, in IDE markdown previewers (Antigravity, VS Code, Cursor), and inside documentation generators.
