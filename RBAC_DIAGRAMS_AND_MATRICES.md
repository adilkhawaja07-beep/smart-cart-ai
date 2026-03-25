# Smart Cart AI - RBAC Visual Diagrams & Matrices

## Access Control Matrices & Flow Diagrams

---

## 1. Role Permission Matrix

```txt
┌──────────────────────────────────────────────────────────────────────────┐
│                      PERMISSION MATRIX BY ROLE                          │
├──────────────────────────────┬──────┬───────┬─────────┬────────┬────────┤
│ Permission                   │Cust. │Duty   │Shipping │Dispatch│Mgmt.  │
│                              │      │Clerk  │Clerk    │Rider   │       │
├──────────────────────────────┼──────┼───────┼─────────┼────────┼────────┤
│ View own orders              │ ✅   │  -    │   -     │   -    │  ✅    │
│ View all orders              │ ❌   │  ✅   │   ✅    │  ❌    │  ✅    │
│ View pending orders          │ ❌   │  ✅   │   ❌    │  ❌    │  ✅    │
│ View confirmed orders        │ ❌   │  ❌   │   ✅    │  ❌    │  ✅    │
│ View picking queue           │ ❌   │  ❌   │   ✅    │  ❌    │  ✅    │
│ View picked orders           │ ❌   │  ❌   │   ❌    │  ✅    │  ✅    │
│ View in-transit orders       │ ❌   │  ❌   │   ❌    │  ✅    │  ✅    │
│ View delivered orders        │ ✅   │  ❌   │   ❌    │  ❌    │  ✅    │
│ Mark order as confirmed      │ ❌   │  ✅   │   ❌    │  ❌    │  ✅    │
│ Mark order as picking        │ ❌   │  ❌   │   ✅    │  ❌    │  ✅    │
│ Mark order as picked         │ ❌   │  ❌   │   ✅    │  ❌    │  ✅    │
│ Mark order as in_transit     │ ❌   │  ❌   │   ❌    │  ✅    │  ✅    │
│ Mark order as delivered      │ ❌   │  ❌   │   ❌    │  ✅    │  ✅    │
│ Cancel orders                │ ❌   │  ⚠️   │   ❌    │  ❌    │  ✅    │
│ Assign orders to staff       │ ❌   │  ❌   │   ❌    │  ❌    │  ✅    │
│ Track delivery GPS           │ ❌   │  ❌   │   ❌    │  ✅    │  ✅    │
│ Submit delivery proof        │ ❌   │  ❌   │   ❌    │  ✅    │  ✅    │
│ View inventory               │ ❌   │  ✅   │   ✅    │  ❌    │  ✅    │
│ Update inventory             │ ❌   │  ❌   │   ⚠️    │  ❌    │  ✅    │
│ View cost prices             │ ❌   │  ✅   │   ✅    │  ❌    │  ✅    │
│ View profit margins          │ ❌   │  ❌   │   ❌    │  ❌    │  ✅    │
│ View analytics               │ ❌   │  ❌   │   ❌    │  ❌    │  ✅    │
│ Manage users & roles         │ ❌   │  ❌   │   ❌    │  ❌    │  ✅    │
│ View audit logs              │ ❌   │  ❌   │   ❌    │  ❌    │  ✅    │
│ Generate reports             │ ❌   │  ❌   │   ❌    │  ❌    │  ✅    │
└──────────────────────────────┴──────┴───────┴─────────┴────────┴────────┘

Legend:
✅ = Can perform
❌ = Cannot perform  
⚠️ = Limited/Conditional (e.g., only own orders)
-  = Not applicable
```

---

## 2. Data Field Visibility Matrix

```txt
┌──────────────────────────────────────────────────────────────────────────┐
│              DATA FIELD VISIBILITY BY ROLE & CONTEXT                    │
├─────────────────────────────┬──────┬───────┬─────────┬────────┬────────┤
│ Data Field                  │Cust. │Duty   │Shipping │Dispatch│Mgmt.  │
│                             │      │Clerk  │Clerk    │Rider   │       │
├─────────────────────────────┼──────┼───────┼─────────┼────────┼────────┤
│ ORDER FIELDS                │      │       │         │        │        │
│ ├─ Order ID                 │ ✅   │  ✅   │   ✅    │  ✅    │  ✅    │
│ ├─ Customer Name            │ ✅   │  ✅   │   ✅    │  ✅    │  ✅    │
│ ├─ Customer Email           │ ✅   │  ✅   │   🔒    │  ✅    │  ✅    │
│ ├─ Customer Phone           │ ✅   │  ✅   │   🔒    │  ✅*   │  ✅    │
│ ├─ Delivery Address         │ ✅   │  ✅   │   ✅    │  ✅    │  ✅    │
│ ├─ City/Zip                 │ ✅   │  ✅   │   🔒    │  ✅    │  ✅    │
│ ├─ Created At               │ ✅   │  ✅   │   ✅    │  ✅    │  ✅    │
│ ├─ Status                   │ ✅   │  ✅   │   ✅    │  ✅    │  ✅    │
│                             │      │       │         │        │        │
│ ORDER ITEMS                 │      │       │         │        │        │
│ ├─ Product Name             │ ✅   │  ✅   │   ✅    │  ✅ *  │  ✅    │
│ ├─ Quantity                 │ ✅   │  ✅   │   ✅    │  ✅    │  ✅    │
│ ├─ Unit Price               │ ✅   │  ✅   │   ✅    │  🔒    │  ✅    │
│ ├─ Total Price (per item)   │ ✅   │  ✅   │   ✅    │  🔒    │  ✅    │
│                             │      │       │         │        │        │
│ PRICING FIELDS              │      │       │         │        │        │
│ ├─ Subtotal                 │ ✅   │  ✅   │   🔒    │  🔒    │  ✅    │
│ ├─ Delivery Fee             │ ✅   │  ✅   │   🔒    │  🔒    │  ✅    │
│ ├─ Tax                      │ ✅   │  ✅   │   🔒    │  🔒    │  ✅    │
│ ├─ Total Amount             │ ✅   │  ✅   │   🔒    │  🔒    │  ✅    │
│ ├─ Cost Price               │ ❌   │  ✅   │   ✅    │  ❌    │  ✅    │
│ ├─ Profit/Margin            │ ❌   │  ❌   │   ❌    │  ❌    │  ✅    │
│                             │      │       │         │        │        │
│ STAFF FIELDS                │      │       │         │        │        │
│ ├─ Duty Clerk Name          │ ❌   │  ✅   │   ⚠️ *  │  ❌    │  ✅    │
│ ├─ Shipping Clerk Name      │ ❌   │  ❌   │   ✅    │  ❌    │  ✅    │
│ ├─ Dispatch Rider Name      │ ⚠️ * │  ❌   │   🔒    │  ✅    │  ✅    │
│ ├─ Dispatch Rider Phone     │ ⚠️ * │  ❌   │   🔒    │  ❌    │  ✅    │
│ ├─ Vehicle Info             │ ❌   │  ❌   │   🔒    │  ✅    │  ✅    │
│                             │      │       │         │        │        │
│ AUDIT FIELDS                │      │       │         │        │        │
│ ├─ Created By               │ ❌   │  ❌   │   ❌    │  ❌    │  ✅    │
│ ├─ Updated By               │ ❌   │  ❌   │   ❌    │  ❌    │  ✅    │
│ ├─ Audit Log                │ ❌   │  ❌   │   ❌    │  ❌    │  ✅    │
│ ├─ Status Change History    │ ⚠️   │  ⚠️   │   ⚠️    │  ⚠️    │  ✅    │
└─────────────────────────────┴──────┴───────┴─────────┴────────┴────────┘

Legend:
✅ = Can view
❌ = Cannot view
🔒 = Redacted/Hidden
⚠️ = Conditional visibility
*  = Only when order is in specific status (e.g., rider name only in_transit)
```

---

## 3. Complete Order Processing Sequence

```mermaid
graph TD
    A["👤 CUSTOMER<br/>Browses & Shops"] --> B["🛒 Adds to Cart"]
    B --> C["💳 Proceeds to Checkout"]
    C --> D["📋 Enters Delivery Info"]
    D --> E["✅ Confirms Order"]
    E --> F["📦 ORDER CREATED<br/>Status: PENDING"]
    
    F --> G["📧 Email: Order Confirmed"]
    F --> H["🔔 Notification: Duty Clerk"]
    
    H --> I["👨‍💼 DUTY CLERK<br/>Views Pending Queue"]
    I --> J["🔍 Verifies Payment"]
    J --> K["📊 Checks Inventory"]
    K --> L{All Items<br/>In Stock?}
    
    L -->|Yes| M["✅ Approves Order"]
    L -->|No| N["❌ Cancels Order"]
    N --> O["📧 Email: Refund Issued"]
    
    M --> P["Status: CONFIRMED"]
    P --> Q["📧 Alert: Shipping Clerk<br/>Order Ready to Pick"]
    
    Q --> R["📦 SHIPPING CLERK<br/>Sees Picking List"]
    R --> S["🏪 Walks to Shelves"]
    S --> T["📍 Scans Shelf Locations"]
    T --> U["✋ Picks Products"]
    U --> V["🔍 Quality Check"]
    V --> W{Everything<br/>OK?}
    
    W -->|Issues Found| X["⚠️ Reports Problem"]
    X --> Y["👨‍💼 Duty Clerk Resolves"]
    
    W -->|OK| Z["Status: PICKING"]
    Z --> AA["Status: PICKED"]
    AA --> AB["📦 Deducts Inventory"]
    AB --> AC["🔔 Alert: Dispatch Rider<br/>Order Ready"]
    
    AC --> AD["🚗 DISPATCH RIDER<br/>Views Assigned Orders"]
    AD --> AE["📍 Plans Delivery Route"]
    AE --> AF["🚚 Loads Vehicle"]
    AF --> AG["Status: IN_TRANSIT"]
    AG --> AH["📍 GPS Tracking Shared"]
    AH --> AI["📱 SMS: ETA to Customer"]
    
    AI --> AJ["👤 CUSTOMER<br/>Tracks on Map"]
    
    AJ --> AK["🏠 Arrives at Address"]
    AK --> AL["📸 Takes Photo Proof"]
    AL --> AM["✍️ Customer Confirms"]
    AM --> AN["Status: DELIVERED"]
    AN --> AO["📦 Order Complete"]
    
    AO --> AP["📧 Email: Delivery Confirmed"]
    AP --> AQ["⭐ Invite: Rate Delivery"]
    
    AQ --> AR["👤 CUSTOMER<br/>Leaves Rating"]
    AR --> AS["✅ 5 Stars!"]
    
    AS --> AT["⚙️ MANAGEMENT<br/>Sees Daily Metrics"]
    AT --> AU["📊 Analytics Updated"]
    AU --> AV["💰 Revenue Recorded"]
    AV --> AW["👷 Staff Performance Tracked"]
    
    style A fill:#e1f5ff
    style F fill:#fff3e0
    style I fill:#f3e5f5
    style P fill:#fff3e0
    style R fill:#fff3e0
    style AA fill:#fff3e0
    style Z fill:#fff3e0
    style AD fill:#f1f8e9
    style AG fill:#f1f8e9
    style AN fill:#f1f8e9
    style AT fill:#ffe0b2
```

---

## 4. Database Access Control Layer

```mermaid
graph LR
    subgraph Auth["🔐 Authentication Layer"]
        JWT["JWT Token<br/>(email, uid, role)"]
    end
    
    subgraph Frontend["🖥️ Frontend"]
        UC["User Component<br/>(checks role)"]
        PQ["Protected Query<br/>(filters data)"]
    end
    
    subgraph RLS["🛡️ Row-Level Security"]
        RLS1["Verify JWT Valid"]
        RLS2["Get User Role"]
        RLS3["Check Policy<br/>(USING clause)"]
        RLS4["Filter Rows<br/>(WHERE uid = user)"]
    end
    
    subgraph DB["🗄️ Database"]
        ORDERS["orders table<br/>with user_id FK"]
        ITEMS["order_items table"]
        AUDIT["audit_log table"]
    end
    
    JWT --> UC
    UC --> PQ
    PQ --> RLS1
    RLS1 --> RLS2
    RLS2 --> RLS3
    RLS3 --> RLS4
    RLS4 --> ORDERS
    RLS4 --> ITEMS
    ORDERS --> AUDIT
    
    style Auth fill:#ffcdd2
    style Frontend fill:#e1f5ff
    style RLS fill:#fff9c4
    style DB fill:#c8e6c9
```

---

## 5. Role State Machine Diagram

```mermaid
stateDiagram-v2
    [*] --> PENDING: Order Created<br/>by Customer
    
    PENDING --> CONFIRMED: ✅ Duty Clerk<br/>Approves
    PENDING --> CANCELLED: ❌ Out of Stock<br/>or Customer Cancels
    
    CONFIRMED --> PICKING: 🏪 Shipping Clerk<br/>Starts Picking
    CONFIRMED --> CANCELLED: ❌ Inventory Issue
    
    PICKING --> PICKED: 📦 All Items Picked<br/>& QC Passed
    PICKING --> CONFIRMED: 🔄 Customer Requests Change
    
    PICKED --> IN_TRANSIT: 🚗 Dispatch Rider<br/>Departs
    PICKED --> CANCELLED: ⚠️ Damaged Item Found
    
    IN_TRANSIT --> DELIVERED: 📍 Arrived at<br/>Delivery Location
    IN_TRANSIT --> PENDING: ⚠️ Rider Unavailable
    
    DELIVERED --> [*]: ✅ Order Complete
    
    CANCELLED --> [*]: ❌ Order Cancelled
    
    note right of PENDING
        Who can see: All
        Who can change: Duty Clerk
        Duration: 5-30 mins
    end note
    
    note right of CONFIRMED
        Who can see: Shipping staff
        Who can change: Shipping Clerk
        Duration: 30-120 mins
    end note
    
    note right of PICKING
        Who can see: Shipping staff
        Who can change: Shipping Clerk
        Duration: 15-60 mins
    end note
    
    note right of PICKED
        Who can see: Dispatch
        Who can change: Dispatch Rider
        Duration: 5-30 mins
    end note
    
    note right of IN_TRANSIT
        Who can see: Customer + Dispatch
        Who can change: Dispatch Rider
        Duration: 15-120 mins
    end note
    
    note right of DELIVERED
        Who can see: Everyone
        Who can change: System
        Duration: Final
    end note
```

---

## 6. API Endpoint Access Control

```txt
┌────────────────────────────────────────────────────────────────────────┐
│                     API ENDPOINT RBAC MATRIX                          │
├──────────────────────────────────┬────────┬─────────┬──────────┬──────┤
│ Endpoint                         │GET     │POST     │PUT       │DEL   │
├──────────────────────────────────┼────────┼─────────┼──────────┼──────┤
│ /api/orders                      │        │         │          │      │
│ ├─ (all orders)                  │ MGMT   │ CUST *  │ DC/SC/DR │ MGMT │
│ └─ (own orders - customer)       │ CUST   │ -       │ -        │ CUST │
│                                  │        │         │          │      │
│ /api/orders/:id                  │        │         │          │      │
│ ├─ READ                          │ AUTH   │ -       │ -        │ -    │
│ ├─ UPDATE status → confirmed     │ -      │ -       │ DC       │ -    │
│ ├─ UPDATE status → picking       │ -      │ -       │ SC       │ -    │
│ ├─ UPDATE status → picked        │ -      │ -       │ SC       │ -    │
│ ├─ UPDATE status → in_transit    │ -      │ -       │ DR       │ -    │
│ ├─ UPDATE status → delivered     │ -      │ -       │ DR       │ -    │
│ └─ DELETE (cancel)               │ -      │ -       │ MGMT     │ -    │
│                                  │        │         │          │      │
│ /api/orders/:id/items            │        │         │          │      │
│ ├─ LIST                          │ STAFF  │ -       │ -        │ -    │
│ └─ UPDATE picked status          │ -      │ -       │ SC       │ -    │
│                                  │        │         │          │      │
│ /api/orders/:id/assignment       │        │         │          │      │
│ ├─ CREATE (assign rider)         │ -      │ MGMT    │ -        │ -    │
│ └─ READ                          │ STAFF  │ -       │ -        │ -    │
│                                  │        │         │          │      │
│ /api/orders/:id/delivery-proof   │        │         │          │      │
│ ├─ READ                          │ OWN+M  │ -       │ -        │ -    │
│ └─ CREATE (photo + signature)    │ -      │ DR      │ -        │ -    │
│                                  │        │         │          │      │
│ /api/orders/:id/audit-log        │        │         │          │      │
│ └─ READ                          │ MGMT   │ -       │ -        │ -    │
│                                  │        │         │          │      │
│ /api/inventory                   │        │         │          │      │
│ ├─ LIST                          │ STAFF  │ -       │ -        │ -    │
│ └─ UPDATE                        │ -      │ -       │ MGMT     │ -    │
│                                  │        │         │          │      │
│ /api/analytics                   │        │         │          │      │
│ └─ READ                          │ MGMT   │ -       │ -        │ -    │
│                                  │        │         │          │      │
│ /api/users/:id/role              │        │         │          │      │
│ └─ UPDATE                        │ -      │ -       │ MGMT     │ -    │
└──────────────────────────────────┴────────┴─────────┴──────────┴──────┘

Legend:
✅ = Can access (with RLS filtering if needed)
❌ = Cannot access
CUST = Customer
DC = Duty Clerk
SC = Shipping Clerk
DR = Dispatch Rider
MGMT = Management
STAFF = All non-customer roles
AUTH = Any authenticated user
OWN+M = Own order or management
*  = Creates order with own user_id
```

---

## 7. Data Flow: Customer Order to Delivery

```mermaid
graph TD
    subgraph CUST["👤 CUSTOMER"]
        C1["Browse Products"]
        C2["Add to Cart"]
        C3["Checkout Form"]
        C4["View Order Status<br/>(real-time)"]
    end
    
    subgraph API["🔌 API Layer"]
        A1["POST /orders<br/>(validate & create)"]
        A2["PUT /orders/:id/status<br/>(with validation)"]
        A3["GET /orders<br/>(filtered by user_id)"]
    end
    
    subgraph DB["🗄️ Database"]
        D1["INSERT orders<br/>(user_id = auth.uid)"]
        D2["INSERT order_items"]
        D3["INSERT audit_log<br/>(auto via trigger)"]
        D4["SELECT * FROM orders<br/>WHERE user_id = ?"]
        D5["UPDATE inventory"]
    end
    
    subgraph DC["👨‍💼 DUTY CLERK<br/>(Portal)"]
        DC1["View Pending Queue<br/>GET /orders?status=pending"]
        DC2["Verify Payment"]
        DC3["Check Inventory"]
        DC4["Approve: status → confirmed<br/>PUT /orders/:id"]
    end
    
    subgraph SC["📦 SHIPPING CLERK<br/>(Portal)"]
        SC1["See Ready Orders<br/>GET /orders?status=confirmed"]
        SC2["Start Picking<br/>PUT /orders/:id?status=picking"]
        SC3["Scan Items"]
        SC4["Mark as Picked<br/>PUT /orders/:id?status=picked"]
    end
    
    subgraph DR["🚗 DISPATCH RIDER<br/>(Mobile App)"]
        DR1["Get Assignments<br/>GET /orders?assigned_to=me"]
        DR2["View Route on Map"]
        DR3["Start Delivery<br/>PUT /orders/:id?status=in_transit"]
        DR4["Submit Proof<br/>POST /orders/:id/delivery-proof"]
        DR5["Mark Delivered"]
    end
    
    subgraph MGT["⚙️ MANAGEMENT<br/>(Dashboard)"]
        MGT1["Real-time KPIs"]
        MGT2["Audit Trail"]
        MGT3["Staff Performance"]
        MGT4["Financial Reports"]
    end
    
    C1 --> C2
    C2 --> C3
    C3 --> A1
    A1 --> D1
    D1 --> D2
    D2 --> D3
    D1 --> DC1
    
    DC1 --> DC2
    DC2 --> DC3
    DC3 --> DC4
    DC4 --> A2
    A2 --> D3
    
    DC4 --> SC1
    SC1 --> SC2
    SC2 --> A2
    SC3 --> SC4
    SC4 --> A2
    A2 --> D5
    D5 --> D3
    
    SC4 --> DR1
    DR1 --> DR2
    DR2 --> DR3
    DR3 --> A2
    DR4 --> D3
    DR5 --> A2
    A2 --> MGT2
    
    C4 --> A3
    A3 --> D4
    
    D3 --> MGT1
    D3 --> MGT4
    D5 --> MGT3
    
    style CUST fill:#e1f5ff
    style DC fill:#f3e5f5
    style SC fill:#fff3e0
    style DR fill:#f1f8e9
    style MGT fill:#ffe0b2
    style API fill:#f5f5f5
    style DB fill:#e0f2f1
```

---

## 8. Security Vulnerability Map

```mermaid
graph LR
    subgraph CRITICAL["🔴 CRITICAL (Fix Week 1)"]
        C1["No user_id FK<br/>on orders"]
        C2["RLS allows<br/>any auth user<br/>to read all"]
        C3["No audit trail<br/>for changes"]
        C4["Order status<br/>not validated"]
    end
    
    subgraph HIGH["🟠 HIGH (Fix Week 2-3)"]
        H1["No specialist<br/>roles defined"]
        H2["No role-based<br/>workflow"]
        H3["Customers can't<br/>track orders"]
        H4["No notifications"]
    end
    
    subgraph MEDIUM["🟡 MEDIUM (Nice to have)"]
        M1["Status as TEXT<br/>not ENUM"]
        M2["No RLS on<br/>order_items"]
        M3["No delivery<br/>proof tracking"]
        M4["Hardcoded role<br/>names"]
    end
    
    style CRITICAL fill:#ffcdd2,stroke:#c62828,stroke-width:3px
    style HIGH fill:#ffe0b2,stroke:#e65100,stroke-width:2px
    style MEDIUM fill:#fff9c4,stroke:#f57f17,stroke-width:2px
```

---

## 9. Implementation Timeline

```mermaid
gantt
    title RBAC Implementation Plan
    
    section Phase 1: Critical
    Add user_id to orders :P1a, 2024-04-01, 2d
    RLS policy fixes :P1b, 2024-04-03, 2d
    Audit table + triggers :P1c, 2024-04-05, 2d
    Status validation :P1d, 2024-04-07, 2d
    Testing & QA :P1e, 2024-04-09, 3d
    
    section Phase 2: Roles
    Create role enums :P2a, 2024-04-13, 2d
    Role assignment table :P2b, 2024-04-15, 2d
    RLS for each role :P2c, 2024-04-17, 3d
    Frontend auth hook :P2d, 2024-04-20, 2d
    Testing :P2e, 2024-04-22, 3d
    
    section Phase 3: Workflow
    State machine :P3a, 2024-04-26, 2d
    Duty clerk dashboard :P3b, 2024-04-28, 3d
    Shipping picker :P3c, 2024-05-01, 3d
    Dispatch rider app :P3d, 2024-05-04, 3d
    Testing :P3e, 2024-05-07, 3d
    
    section Phase 4: Customer
    Order tracking :P4a, 2024-05-11, 2d
    Notifications :P4b, 2024-05-13, 3d
    Real-time map :P4c, 2024-05-16, 2d
    Testing :P4d, 2024-05-18, 2d
    
    section Phase 5: Mgmt
    Analytics dashboard :P5a, 2024-05-21, 3d
    Audit log viewer :P5b, 2024-05-24, 2d
    Reports :P5c, 2024-05-26, 2d
    System admin :P5d, 2024-05-28, 2d
```

---

## 10. Pre-Deployment Security Checklist

### Database Level
- [ ] Add user_id FK to orders table
- [ ] Add user_id FK to order_items table
- [ ] Create user_roles table
- [ ] Convert status to ENUM
- [ ] Create audit_log table with triggers
- [ ] Create order_assignments table
- [ ] Create delivery_proof table
- [ ] Drop old broken RLS policies
- [ ] Create new granular RLS policies
- [ ] Test RLS policies block unauthorized access
- [ ] Create indexes for performance
- [ ] Set up automatic backups

### Backend Level
- [ ] Implement status validation (enum check)
- [ ] Add role check before each role-specific endpoint
- [ ] Implement OrderService.updateOrderStatus()
- [ ] Add audit logging for manual updates
- [ ] Verify JWT token validation
- [ ] Add rate limiting on API
- [ ] Add input validation on all endpoints
- [ ] Implement order ownership verification
- [ ] Create role-based queries for each endpoint
- [ ] Add error logging

### Frontend Level
- [ ] Remove hardcoded role checks
- [ ] Implement useAuthorization hook
- [ ] Create RoleProtectedRoute component
- [ ] Add role-based routing
- [ ] Hide admin features for customers
- [ ] Implement role-specific dashboards
- [ ] Add loading states during authorization
- [ ] Test access denied scenarios
- [ ] Verify correct data visibility per role

### Testing
- [ ] Unit tests: Status transitions
- [ ] Unit tests: Role permissions
- [ ] Integration tests: RLS policies
- [ ] Integration tests: Order flow
- [ ] E2E tests: Customer checkout to delivery
- [ ] E2E tests: Each role workflow
- [ ] Security tests: Try to access unauthorized orders
- [ ] Performance tests: Query times with RLS
- [ ] Load tests: Concurrent role operations

### Deployment
- [ ] Backup production database
- [ ] Create rollback procedure
- [ ] Test migrations on staging
- [ ] Monitor Supabase logs for RLS errors
- [ ] Deploy in off-peak hours
- [ ] Have rollback plan ready
- [ ] Notify all stakeholders
- [ ] Monitor error rates post-deploy
- [ ] Verify all role workflows work
- [ ] Check customer experience

### Post-Deployment
- [ ] Monitor audit logs for anomalies
- [ ] Review role assignments
- [ ] Check staff training needs
- [ ] Gather user feedback
- [ ] Performance optimization
- [ ] Document new admin procedures
- [ ] Schedule follow-up security audit

