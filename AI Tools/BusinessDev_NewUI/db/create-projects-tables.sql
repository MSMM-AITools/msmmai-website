-- ============================================================================
-- CREATE PROJECT MANAGEMENT TABLES FOR CALENDAR
-- Oracle Database Compatible
-- ============================================================================

-- Create sequences for auto-increment IDs
CREATE SEQUENCE seq_calendar_projects_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_calendar_milestones_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_calendar_resources_id START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_calendar_tasks_id START WITH 1 INCREMENT BY 1;

-- ============================================================================
-- CALENDAR_PROJECTS TABLE
-- ============================================================================
CREATE TABLE CALENDAR_PROJECTS (
    PROJECT_ID NUMBER PRIMARY KEY,
    TITLE VARCHAR2(255) NOT NULL,
    DESCRIPTION VARCHAR2(4000),
    START_DATE DATE,
    END_DATE DATE,
    STATUS VARCHAR2(50) DEFAULT 'Not Started' CHECK (STATUS IN ('Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled')),
    PRIORITY VARCHAR2(20) DEFAULT 'Medium' CHECK (PRIORITY IN ('Low', 'Medium', 'High', 'Critical')),
    COLOR VARCHAR2(7) DEFAULT '#3B82F6',
    BUDGET NUMBER(12,2),
    ACTUAL_COST NUMBER(12,2) DEFAULT 0,
    PROGRESS_PERCENTAGE NUMBER(3,0) DEFAULT 0 CHECK (PROGRESS_PERCENTAGE BETWEEN 0 AND 100),
    CATEGORY VARCHAR2(100),
    PROJECT_MANAGER VARCHAR2(255),
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CALENDAR_MILESTONES TABLE
-- ============================================================================
CREATE TABLE CALENDAR_MILESTONES (
    MILESTONE_ID NUMBER PRIMARY KEY,
    PROJECT_ID NUMBER NOT NULL,
    TITLE VARCHAR2(255) NOT NULL,
    DESCRIPTION VARCHAR2(2000),
    DUE_DATE DATE NOT NULL,
    STATUS VARCHAR2(50) DEFAULT 'Pending' CHECK (STATUS IN ('Pending', 'In Progress', 'Completed', 'Delayed')),
    COMPLETION_DATE DATE,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cal_milestone_project FOREIGN KEY (PROJECT_ID) REFERENCES CALENDAR_PROJECTS(PROJECT_ID) ON DELETE CASCADE
);

-- ============================================================================
-- CALENDAR_RESOURCES TABLE
-- ============================================================================
CREATE TABLE CALENDAR_RESOURCES (
    RESOURCE_ID NUMBER PRIMARY KEY,
    PROJECT_ID NUMBER NOT NULL,
    RESOURCE_NAME VARCHAR2(255) NOT NULL,
    RESOURCE_TYPE VARCHAR2(50) DEFAULT 'Team Member' CHECK (RESOURCE_TYPE IN ('Team Member', 'Contractor', 'Consultant', 'Manager', 'Other')),
    ROLE VARCHAR2(100),
    EMAIL VARCHAR2(255),
    PHONE VARCHAR2(50),
    ALLOCATED_HOURS NUMBER(8,2) DEFAULT 0,
    ACTUAL_HOURS NUMBER(8,2) DEFAULT 0,
    HOURLY_RATE NUMBER(10,2),
    START_DATE DATE,
    END_DATE DATE,
    NOTES VARCHAR2(2000),
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cal_resource_project FOREIGN KEY (PROJECT_ID) REFERENCES CALENDAR_PROJECTS(PROJECT_ID) ON DELETE CASCADE
);

-- ============================================================================
-- CALENDAR_TASKS TABLE
-- ============================================================================
CREATE TABLE CALENDAR_TASKS (
    TASK_ID NUMBER PRIMARY KEY,
    PROJECT_ID NUMBER NOT NULL,
    MILESTONE_ID NUMBER,
    TITLE VARCHAR2(255) NOT NULL,
    DESCRIPTION VARCHAR2(4000),
    STATUS VARCHAR2(50) DEFAULT 'To Do' CHECK (STATUS IN ('To Do', 'In Progress', 'In Review', 'Done', 'Blocked')),
    PRIORITY VARCHAR2(20) DEFAULT 'Medium' CHECK (PRIORITY IN ('Low', 'Medium', 'High', 'Critical')),
    ASSIGNED_TO VARCHAR2(255),
    DUE_DATE DATE,
    ESTIMATED_HOURS NUMBER(8,2),
    ACTUAL_HOURS NUMBER(8,2),
    TAGS VARCHAR2(500),
    SORT_ORDER NUMBER DEFAULT 0,
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UPDATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cal_task_project FOREIGN KEY (PROJECT_ID) REFERENCES CALENDAR_PROJECTS(PROJECT_ID) ON DELETE CASCADE,
    CONSTRAINT fk_cal_task_milestone FOREIGN KEY (MILESTONE_ID) REFERENCES CALENDAR_MILESTONES(MILESTONE_ID) ON DELETE SET NULL
);

-- ============================================================================
-- AUTO-INCREMENT TRIGGERS
-- ============================================================================

CREATE OR REPLACE TRIGGER trg_calendar_projects_id
BEFORE INSERT ON CALENDAR_PROJECTS
FOR EACH ROW
BEGIN
    SELECT seq_calendar_projects_id.NEXTVAL INTO :NEW.PROJECT_ID FROM DUAL;
END;
/

CREATE OR REPLACE TRIGGER trg_calendar_milestones_id
BEFORE INSERT ON CALENDAR_MILESTONES
FOR EACH ROW
BEGIN
    SELECT seq_calendar_milestones_id.NEXTVAL INTO :NEW.MILESTONE_ID FROM DUAL;
END;
/

CREATE OR REPLACE TRIGGER trg_calendar_resources_id
BEFORE INSERT ON CALENDAR_RESOURCES
FOR EACH ROW
BEGIN
    SELECT seq_calendar_resources_id.NEXTVAL INTO :NEW.RESOURCE_ID FROM DUAL;
END;
/

CREATE OR REPLACE TRIGGER trg_calendar_tasks_id
BEFORE INSERT ON CALENDAR_TASKS
FOR EACH ROW
BEGIN
    SELECT seq_calendar_tasks_id.NEXTVAL INTO :NEW.TASK_ID FROM DUAL;
END;
/

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

CREATE OR REPLACE TRIGGER trg_calendar_projects_upd
BEFORE UPDATE ON CALENDAR_PROJECTS
FOR EACH ROW
BEGIN
    SELECT CURRENT_TIMESTAMP INTO :NEW.UPDATED_AT FROM DUAL;
END;
/

CREATE OR REPLACE TRIGGER trg_calendar_milestones_upd
BEFORE UPDATE ON CALENDAR_MILESTONES
FOR EACH ROW
BEGIN
    SELECT CURRENT_TIMESTAMP INTO :NEW.UPDATED_AT FROM DUAL;
END;
/

CREATE OR REPLACE TRIGGER trg_calendar_resources_upd
BEFORE UPDATE ON CALENDAR_RESOURCES
FOR EACH ROW
BEGIN
    SELECT CURRENT_TIMESTAMP INTO :NEW.UPDATED_AT FROM DUAL;
END;
/

CREATE OR REPLACE TRIGGER trg_calendar_tasks_upd
BEFORE UPDATE ON CALENDAR_TASKS
FOR EACH ROW
BEGIN
    SELECT CURRENT_TIMESTAMP INTO :NEW.UPDATED_AT FROM DUAL;
END;
/

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_cal_milestones_project ON CALENDAR_MILESTONES(PROJECT_ID);
CREATE INDEX idx_cal_resources_project ON CALENDAR_RESOURCES(PROJECT_ID);
CREATE INDEX idx_cal_tasks_project ON CALENDAR_TASKS(PROJECT_ID);
CREATE INDEX idx_cal_tasks_milestone ON CALENDAR_TASKS(MILESTONE_ID);
CREATE INDEX idx_cal_tasks_status ON CALENDAR_TASKS(STATUS);
CREATE INDEX idx_cal_projects_status ON CALENDAR_PROJECTS(STATUS);

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

INSERT INTO CALENDAR_PROJECTS (TITLE, DESCRIPTION, START_DATE, END_DATE, STATUS, PRIORITY, COLOR, BUDGET, CATEGORY, PROJECT_MANAGER)
VALUES ('Website Redesign', 'Complete redesign of company website with modern UI/UX', TO_DATE('2025-01-15', 'YYYY-MM-DD'), TO_DATE('2025-03-31', 'YYYY-MM-DD'), 'In Progress', 'High', '#10B981', 50000, 'IT/Development', 'John Smith');

INSERT INTO CALENDAR_PROJECTS (TITLE, DESCRIPTION, START_DATE, END_DATE, STATUS, PRIORITY, COLOR, BUDGET, CATEGORY, PROJECT_MANAGER)
VALUES ('Marketing Campaign Q1', 'Digital marketing campaign for Q1 2025', TO_DATE('2025-01-01', 'YYYY-MM-DD'), TO_DATE('2025-03-31', 'YYYY-MM-DD'), 'In Progress', 'Medium', '#F59E0B', 25000, 'Marketing', 'Jane Doe');

INSERT INTO CALENDAR_MILESTONES (PROJECT_ID, TITLE, DESCRIPTION, DUE_DATE, STATUS)
VALUES (1, 'Design Mockups Complete', 'All design mockups approved by stakeholders', TO_DATE('2025-02-15', 'YYYY-MM-DD'), 'Completed');

INSERT INTO CALENDAR_MILESTONES (PROJECT_ID, TITLE, DESCRIPTION, DUE_DATE, STATUS)
VALUES (1, 'Frontend Development', 'Complete frontend implementation', TO_DATE('2025-03-15', 'YYYY-MM-DD'), 'In Progress');

INSERT INTO CALENDAR_RESOURCES (PROJECT_ID, RESOURCE_NAME, RESOURCE_TYPE, ROLE, EMAIL, ALLOCATED_HOURS, HOURLY_RATE)
VALUES (1, 'Alice Johnson', 'Team Member', 'UI/UX Designer', 'alice@example.com', 160, 75);

INSERT INTO CALENDAR_RESOURCES (PROJECT_ID, RESOURCE_NAME, RESOURCE_TYPE, ROLE, EMAIL, ALLOCATED_HOURS, HOURLY_RATE)
VALUES (1, 'Bob Williams', 'Team Member', 'Frontend Developer', 'bob@example.com', 200, 85);

INSERT INTO CALENDAR_TASKS (PROJECT_ID, MILESTONE_ID, TITLE, STATUS, PRIORITY, ASSIGNED_TO, DUE_DATE, ESTIMATED_HOURS)
VALUES (1, 1, 'Create wireframes', 'Done', 'High', 'Alice Johnson', TO_DATE('2025-02-01', 'YYYY-MM-DD'), 16);

INSERT INTO CALENDAR_TASKS (PROJECT_ID, MILESTONE_ID, TITLE, STATUS, PRIORITY, ASSIGNED_TO, DUE_DATE, ESTIMATED_HOURS)
VALUES (1, 2, 'Implement responsive navigation', 'In Progress', 'High', 'Bob Williams', TO_DATE('2025-03-05', 'YYYY-MM-DD'), 24);

INSERT INTO CALENDAR_TASKS (PROJECT_ID, MILESTONE_ID, TITLE, STATUS, PRIORITY, ASSIGNED_TO, DUE_DATE, ESTIMATED_HOURS)
VALUES (1, 2, 'Setup homepage layout', 'To Do', 'Medium', 'Bob Williams', TO_DATE('2025-03-10', 'YYYY-MM-DD'), 16);

COMMIT;

-- Verify tables were created
SELECT 'Calendar Projects' AS TABLE_NAME, COUNT(*) AS RECORD_COUNT FROM CALENDAR_PROJECTS
UNION ALL SELECT 'Calendar Milestones', COUNT(*) FROM CALENDAR_MILESTONES
UNION ALL SELECT 'Calendar Resources', COUNT(*) FROM CALENDAR_RESOURCES
UNION ALL SELECT 'Calendar Tasks', COUNT(*) FROM CALENDAR_TASKS;
