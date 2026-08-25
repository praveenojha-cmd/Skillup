// SkillUp Enterprise Admin Portal - Local State Management Store
// Handles reactive routing, master data CRUD, access controls, course lifecycle & audit trails

class AdminStore {
    constructor() {
        this.subscribers = [];
        this.navigationStack = [];
        this.selectedEmployeeIds = new Set();
        this.loadState();
    }

    loadState() {
        try {
            const savedState = localStorage.getItem("skillup_admin_state_v3");
            if (savedState) {
                const parsed = JSON.parse(savedState);
                this.adminUser = parsed.adminUser || INITIAL_ADMIN_USER;
                this.employees = parsed.employees || INITIAL_EMPLOYEES;
                this.courses = parsed.courses || INITIAL_COURSES;
                this.quizzes = parsed.quizzes || INITIAL_QUIZZES;
                this.assignments = parsed.assignments || INITIAL_ASSIGNMENTS;
                this.notifications = parsed.notifications || INITIAL_NOTIFICATIONS;
                this.activities = parsed.activities || INITIAL_ACTIVITIES;
                this.auditLogs = parsed.auditLogs || INITIAL_AUDIT_LOGS;
                this.isLoggedIn = parsed.isLoggedIn !== undefined ? parsed.isLoggedIn : true;
                this.currentRoute = parsed.currentRoute || "dashboard";
                this.selectedEmployeeId = parsed.selectedEmployeeId || "EMP001";
                this.selectedCourseId = parsed.selectedCourseId || "C001";
                this.editingModuleId = parsed.editingModuleId || null;
                this.editingLessonId = parsed.editingLessonId || null;
                this.editingQuizId = parsed.editingQuizId || "Q101";
                this.settings = parsed.settings || {
                    defaultPassingScore: 70,
                    defaultCourseType: "Mandatory",
                    emailReminders: true,
                    pushAlerts: true,
                    autoOverdueAlerts: true,
                    twoFactorAuth: false
                };
                // Ensure all employees have full master data & compatibility properties
                this.normalizeEmployees();
                return;
            }
        } catch (e) {
            console.warn("Could not parse saved admin state, resetting to defaults", e);
        }

        this.adminUser = INITIAL_ADMIN_USER;
        this.employees = JSON.parse(JSON.stringify(INITIAL_EMPLOYEES));
        this.courses = JSON.parse(JSON.stringify(INITIAL_COURSES));
        this.quizzes = JSON.parse(JSON.stringify(INITIAL_QUIZZES));
        this.assignments = JSON.parse(JSON.stringify(INITIAL_ASSIGNMENTS));
        this.notifications = JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS));
        this.activities = JSON.parse(JSON.stringify(INITIAL_ACTIVITIES));
        this.auditLogs = JSON.parse(JSON.stringify(INITIAL_AUDIT_LOGS));
        this.isLoggedIn = true;
        this.currentRoute = "dashboard";
        this.selectedEmployeeId = "EMP001";
        this.selectedCourseId = "C001";
        this.editingModuleId = null;
        this.editingLessonId = null;
        this.editingQuizId = "Q101";
        this.settings = {
            defaultPassingScore: 70,
            defaultCourseType: "Mandatory",
            emailReminders: true,
            pushAlerts: true,
            autoOverdueAlerts: true,
            twoFactorAuth: false
        };
        this.normalizeEmployees();
        this.saveState();
    }

    normalizeEmployees() {
        if (!this.employees) return;
        this.employees.forEach(emp => {
            emp.employeeId = emp.employeeId || emp.id;
            emp.fullName = emp.fullName || emp.name;
            emp.mobileNumber = emp.mobileNumber || emp.phone || "";
            emp.employmentStatus = emp.employmentStatus || (emp.status === "Inactive" ? "Inactive" : "Active");
            emp.status = emp.employmentStatus; // backward compatibility
            emp.skillupAccessEnabled = emp.skillupAccessEnabled !== undefined ? emp.skillupAccessEnabled : (emp.status === "Active");
            if (emp.courseProgress) {
                emp.courseProgress.forEach(cp => {
                    if (cp.status === "In Progress" || cp.status === "IN PROGRESS") cp.status = "IN PROGRESS";
                    else if (cp.status === "Completed" || cp.status === "COMPLETED") cp.status = "COMPLETED";
                    else if (cp.status === "Revoked" || cp.status === "REVOKED") cp.status = "REVOKED";
                    else if (cp.status === "Not Started" || cp.status === "ASSIGNED") cp.status = "ASSIGNED";
                });
            }
        });
    }

    saveState() {
        try {
            const state = {
                adminUser: this.adminUser,
                employees: this.employees,
                courses: this.courses,
                quizzes: this.quizzes,
                assignments: this.assignments,
                notifications: this.notifications,
                activities: this.activities,
                auditLogs: this.auditLogs,
                isLoggedIn: this.isLoggedIn,
                currentRoute: this.currentRoute,
                selectedEmployeeId: this.selectedEmployeeId,
                selectedCourseId: this.selectedCourseId,
                editingModuleId: this.editingModuleId,
                editingLessonId: this.editingLessonId,
                editingQuizId: this.editingQuizId,
                settings: this.settings
            };
            localStorage.setItem("skillup_admin_state_v3", JSON.stringify(state));
        } catch (e) {
            console.error("Storage error:", e);
        }
    }

    subscribe(callback) {
        this.subscribers.push(callback);
        return () => {
            this.subscribers = this.subscribers.filter(cb => cb !== callback);
        };
    }

    notify() {
        this.saveState();
        this.subscribers.forEach(cb => cb(this));
    }

    // Navigation & Routing
    navigate(route, params = {}) {
        if (this.currentRoute !== route) {
            this.navigationStack.push({ route: this.currentRoute, params: {
                selectedEmployeeId: this.selectedEmployeeId,
                selectedCourseId: this.selectedCourseId,
                editingModuleId: this.editingModuleId,
                editingLessonId: this.editingLessonId,
                editingQuizId: this.editingQuizId
            }});
        }

        this.currentRoute = route;
        if (params.employeeId) this.selectedEmployeeId = params.employeeId;
        if (params.courseId) this.selectedCourseId = params.courseId;
        if (params.moduleId !== undefined) this.editingModuleId = params.moduleId;
        if (params.lessonId !== undefined) this.editingLessonId = params.lessonId;
        if (params.quizId !== undefined) this.editingQuizId = params.quizId;

        // Clear row selection on screen navigation
        if (route !== 'employees') {
            this.selectedEmployeeIds.clear();
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.notify();
    }

    goBack() {
        if (this.navigationStack.length > 0) {
            const previous = this.navigationStack.pop();
            this.currentRoute = previous.route;
            if (previous.params.selectedEmployeeId) this.selectedEmployeeId = previous.params.selectedEmployeeId;
            if (previous.params.selectedCourseId) this.selectedCourseId = previous.params.selectedCourseId;
            if (previous.params.editingModuleId !== undefined) this.editingModuleId = previous.params.editingModuleId;
            if (previous.params.editingLessonId !== undefined) this.editingLessonId = previous.params.editingLessonId;
            if (previous.params.editingQuizId !== undefined) this.editingQuizId = previous.params.editingQuizId;
        } else {
            if (this.currentRoute === 'employee-detail') this.currentRoute = 'employees';
            else if (this.currentRoute === 'lesson-editor' || this.currentRoute === 'quiz-builder') this.currentRoute = 'course-builder';
            else if (this.currentRoute === 'course-builder') this.currentRoute = 'courses';
            else this.currentRoute = 'dashboard';
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.notify();
    }

    // Auth
    login(adminId, password) {
        if (adminId.trim().toUpperCase() === "ADMIN001" && password === "admin123") {
            this.isLoggedIn = true;
            this.currentRoute = "dashboard";
            this.addActivity(`Admin logged in successfully to portal`, "login", "shield", "text-blue-500");
            this.notify();
            return { success: true };
        } else {
            return { success: false, message: "Invalid credentials. Use ADMIN001 / admin123 for prototype access." };
        }
    }

    logout() {
        this.isLoggedIn = false;
        this.currentRoute = "login";
        this.navigationStack = [];
        this.notify();
    }

    // Activities & Audit Logs
    addActivity(text, type = "general", icon = "activity", color = "text-blue-500") {
        this.activities.unshift({
            id: `ACT-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            text,
            time: "Just now",
            type,
            icon,
            color
        });
        if (this.activities.length > 25) this.activities.pop();
    }

    logAudit(adminId, employeeId, employeeName, action, details = "") {
        const now = new Date();
        const dateFormatted = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;
        const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        const newAudit = {
            id: `AUD-${Date.now()}-${Math.floor(Math.random()*1000)}`,
            date: dateFormatted,
            timestamp: `${dateFormatted}, ${timeFormatted}`,
            adminId: adminId || this.adminUser.id,
            employeeId,
            employeeName,
            action,
            details
        };
        this.auditLogs.unshift(newAudit);
        if (this.auditLogs.length > 100) this.auditLogs.pop();
    }

    getAuditLogsForEmployee(employeeId) {
        return this.auditLogs.filter(log => log.employeeId === employeeId);
    }

    // Employee Master Management
    getEmployeeById(id) {
        return this.employees.find(e => e.id === id || e.employeeId === id) || this.employees[0];
    }

    addEmployee(empData) {
        // Validate required fields
        if (!empData.employeeId || !empData.fullName || !empData.email || !empData.role || !empData.location || !empData.manager || !empData.employmentStatus) {
            throw new Error("Missing required employee master data fields.");
        }

        const cleanId = empData.employeeId.trim().toUpperCase();
        // Check uniqueness
        const exists = this.employees.some(e => (e.id && e.id.toUpperCase() === cleanId) || (e.employeeId && e.employeeId.toUpperCase() === cleanId));
        if (exists) {
            throw new Error(`Employee ID "${cleanId}" already exists. Each employee must have a unique ID.`);
        }

        const colors = ["bg-blue-600", "bg-emerald-600", "bg-purple-600", "bg-pink-600", "bg-indigo-600", "bg-amber-600", "bg-teal-600"];
        const randomBg = colors[Math.floor(Math.random() * colors.length)];

        const newEmp = {
            id: cleanId,
            employeeId: cleanId,
            name: empData.fullName.trim(),
            fullName: empData.fullName.trim(),
            email: empData.email.trim().toLowerCase(),
            phone: empData.mobileNumber ? empData.mobileNumber.trim() : "",
            mobileNumber: empData.mobileNumber ? empData.mobileNumber.trim() : "",
            role: empData.role,
            department: empData.role === "TBM" || empData.role === "ABM" ? "Branch Operations" : (empData.role === "RBH" ? "Regional Leadership" : "Sales & Distribution"),
            location: empData.location,
            manager: empData.manager,
            employmentStatus: empData.employmentStatus || "Active",
            status: empData.employmentStatus || "Active",
            skillupAccessEnabled: empData.skillupAccessEnabled !== undefined ? empData.skillupAccessEnabled : true,
            joiningDate: "Today",
            progress: 0,
            coursesAssigned: 0,
            coursesCompleted: 0,
            coursesInProgress: 0,
            avgScore: null,
            avatarBg: randomBg,
            courseProgress: []
        };

        this.employees.unshift(newEmp);
        this.addActivity(`Added new employee: ${newEmp.fullName} (${newEmp.employeeId})`, "employee", "user-plus", "text-emerald-500");
        this.logAudit(this.adminUser.id, newEmp.employeeId, newEmp.fullName, "Employee Created", `Created with Employment Status: ${newEmp.employmentStatus}, SkillUp Access: ${newEmp.skillupAccessEnabled ? 'Enabled' : 'Disabled'}`);
        this.notify();
        return newEmp;
    }

    bulkImportEmployees(validEmployeesList) {
        if (!validEmployeesList || validEmployeesList.length === 0) return 0;
        const colors = ["bg-blue-600", "bg-emerald-600", "bg-purple-600", "bg-pink-600", "bg-indigo-600", "bg-amber-600", "bg-teal-600"];
        
        let count = 0;
        validEmployeesList.forEach(item => {
            const cleanId = item.employeeId.trim().toUpperCase();
            const randomBg = colors[Math.floor(Math.random() * colors.length)];
            const emp = {
                id: cleanId,
                employeeId: cleanId,
                name: item.fullName.trim(),
                fullName: item.fullName.trim(),
                email: item.email.trim().toLowerCase(),
                phone: item.mobileNumber ? item.mobileNumber.trim() : "",
                mobileNumber: item.mobileNumber ? item.mobileNumber.trim() : "",
                role: item.role,
                department: item.role === "TBM" || item.role === "ABM" ? "Branch Operations" : (item.role === "RBH" ? "Regional Leadership" : "Sales & Distribution"),
                location: item.location,
                manager: item.manager,
                employmentStatus: item.employmentStatus || "Active",
                status: item.employmentStatus || "Active",
                skillupAccessEnabled: item.skillupAccessEnabled !== undefined ? item.skillupAccessEnabled : true,
                joiningDate: "Today",
                progress: 0,
                coursesAssigned: 0,
                coursesCompleted: 0,
                coursesInProgress: 0,
                avgScore: null,
                avatarBg: randomBg,
                courseProgress: []
            };
            this.employees.unshift(emp);
            count++;
        });

        this.addActivity(`Bulk imported ${count} employees via CSV`, "employee", "upload-cloud", "text-blue-500");
        this.logAudit(this.adminUser.id, "BULK", `${count} Employees`, "Bulk CSV Import", `Imported ${count} verified employee records`);
        this.notify();
        return count;
    }

    // SkillUp Access Toggling (Data retention strictly guaranteed)
    setEmployeeSkillUpAccess(employeeId, enabled) {
        const emp = this.getEmployeeById(employeeId);
        if (emp) {
            emp.skillupAccessEnabled = Boolean(enabled);
            const actionText = enabled ? "SkillUp Access Enabled" : "SkillUp Access Disabled";
            const detailText = enabled 
                ? "Restored login access and active learning content access" 
                : "Suspended portal login rights. All employee records, course progress, quiz results & history retained.";
            
            this.addActivity(`${emp.fullName} (${emp.employeeId}): ${actionText}`, "access", enabled ? "shield-check" : "shield-alert", enabled ? "text-emerald-500" : "text-rose-500");
            this.logAudit(this.adminUser.id, emp.employeeId, emp.fullName, actionText, detailText);
            this.notify();
        }
    }

    bulkSetSkillUpAccess(employeeIds, enabled) {
        if (!employeeIds || employeeIds.length === 0) return;
        const actionText = enabled ? "SkillUp Access Enabled" : "SkillUp Access Disabled";
        
        employeeIds.forEach(id => {
            const emp = this.getEmployeeById(id);
            if (emp) {
                emp.skillupAccessEnabled = Boolean(enabled);
                this.logAudit(this.adminUser.id, emp.employeeId, emp.fullName, actionText, `Bulk update (${actionText})`);
            }
        });

        this.addActivity(`${actionText} for ${employeeIds.length} employees`, "access", enabled ? "shield-check" : "shield-alert", enabled ? "text-emerald-500" : "text-rose-500");
        this.selectedEmployeeIds.clear();
        this.notify();
    }

    // Course Access Revocation & Restoration (Data retention strictly guaranteed)
    revokeCourseAccess(employeeId, courseId) {
        const emp = this.getEmployeeById(employeeId);
        if (!emp || !emp.courseProgress) return;
        const cp = emp.courseProgress.find(c => c.courseId === courseId);
        if (cp) {
            cp.status = "REVOKED";
            const now = new Date();
            const dateStr = `${now.getDate()} ${now.toLocaleString('default', { month: 'short' })} ${now.getFullYear()}`;
            cp.revokedAt = dateStr;
            cp.revokedBy = this.adminUser.id;

            this.addActivity(`${emp.fullName}: Revoked access to "${cp.title}"`, "course-access", "slash", "text-rose-500");
            this.logAudit(this.adminUser.id, emp.employeeId, emp.fullName, `${cp.title} Access Revoked`, `Progress (${cp.progress}%) and quiz history preserved; active learning suspended.`);
            this.notify();
        }
    }

    restoreCourseAccess(employeeId, courseId) {
        const emp = this.getEmployeeById(employeeId);
        if (!emp || !emp.courseProgress) return;
        const cp = emp.courseProgress.find(c => c.courseId === courseId);
        if (cp) {
            cp.status = cp.progress > 0 ? (cp.progress >= 100 ? "COMPLETED" : "IN PROGRESS") : "ASSIGNED";
            cp.revokedAt = null;
            cp.revokedBy = null;

            this.addActivity(`${emp.fullName}: Restored access to "${cp.title}"`, "course-access", "refresh-cw", "text-emerald-500");
            this.logAudit(this.adminUser.id, emp.employeeId, emp.fullName, `${cp.title} Access Restored`, `Employee can resume learning from ${cp.progress}% with preserved quiz records.`);
            this.notify();
        }
    }

    // Selection helper
    toggleSelectEmployee(id) {
        if (this.selectedEmployeeIds.has(id)) {
            this.selectedEmployeeIds.delete(id);
        } else {
            this.selectedEmployeeIds.add(id);
        }
        this.notify();
    }

    selectAllEmployees(ids) {
        if (this.selectedEmployeeIds.size === ids.length) {
            this.selectedEmployeeIds.clear();
        } else {
            ids.forEach(id => this.selectedEmployeeIds.add(id));
        }
        this.notify();
    }

    clearEmployeeSelection() {
        this.selectedEmployeeIds.clear();
        this.notify();
    }

    // Course Management
    getCourseById(id) {
        return this.courses.find(c => c.id === id) || this.courses[0];
    }

    createCourse(courseData) {
        const newId = `C00${this.courses.length + 1}`;
        const newCourse = {
            id: newId,
            title: courseData.title || "Untitled Course",
            category: courseData.category || "PRODUCT KNOWLEDGE",
            type: courseData.type || "MANDATORY",
            difficulty: courseData.difficulty || "Beginner",
            durationMinutes: parseInt(courseData.durationMinutes || 45),
            assignedCount: 0,
            startedCount: 0,
            completedCount: 0,
            avgScore: null,
            completionPercentage: 0,
            status: courseData.status || "Draft",
            thumbnail: courseData.thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
            description: courseData.description || "Course description and learning goals.",
            modules: [
                {
                    id: `M${Date.now()}_1`,
                    title: "Module 1: Introduction & Foundations",
                    description: "Core conceptual understanding and foundational lessons.",
                    lessons: [
                        { id: `L${Date.now()}_1`, title: "Welcome & Course Overview", type: "VIDEO", duration: "5 min", file: "intro_video.mp4", objectives: ["Understand course roadmap"], takeaways: ["Complete all mandatory quizzes"] }
                    ]
                }
            ]
        };
        this.courses.unshift(newCourse);
        this.selectedCourseId = newId;
        this.addActivity(`Created new course: ${newCourse.title}`, "course", "book-open", "text-blue-500");
        this.notify();
        return newCourse;
    }

    updateCourse(id, updatedFields) {
        const course = this.getCourseById(id);
        if (course) {
            Object.assign(course, updatedFields);
            this.addActivity(`Updated course details: ${course.title}`, "course", "edit", "text-blue-500");
            this.notify();
        }
    }

    duplicateCourse(id) {
        const original = this.getCourseById(id);
        if (original) {
            const duplicate = JSON.parse(JSON.stringify(original));
            duplicate.id = `C00${this.courses.length + 1}`;
            duplicate.title = `${original.title} (Copy)`;
            duplicate.status = "Draft";
            duplicate.assignedCount = 0;
            duplicate.startedCount = 0;
            duplicate.completedCount = 0;
            duplicate.completionPercentage = 0;
            this.courses.unshift(duplicate);
            this.addActivity(`Duplicated course: ${duplicate.title}`, "course", "copy", "text-indigo-500");
            this.notify();
        }
    }

    addModuleToCourse(courseId, title = "New Module") {
        const course = this.getCourseById(courseId);
        if (course) {
            const newModId = `M${Date.now()}`;
            course.modules = course.modules || [];
            course.modules.push({
                id: newModId,
                title: title,
                description: "Module objectives and lesson plan.",
                lessons: []
            });
            this.notify();
            return newModId;
        }
    }

    deleteModuleFromCourse(courseId, moduleId) {
        const course = this.getCourseById(courseId);
        if (course && course.modules) {
            course.modules = course.modules.filter(m => m.id !== moduleId);
            this.notify();
        }
    }

    reorderModule(courseId, moduleId, direction) {
        const course = this.getCourseById(courseId);
        if (!course || !course.modules) return;
        const index = course.modules.findIndex(m => m.id === moduleId);
        if (index < 0) return;
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex >= 0 && targetIndex < course.modules.length) {
            const temp = course.modules[index];
            course.modules[index] = course.modules[targetIndex];
            course.modules[targetIndex] = temp;
            this.notify();
        }
    }

    addLessonToModule(courseId, moduleId, lessonData = {}) {
        const course = this.getCourseById(courseId);
        if (!course) return;
        const module = course.modules.find(m => m.id === moduleId);
        if (module) {
            module.lessons = module.lessons || [];
            const newLessonId = `L${Date.now()}`;
            const newLesson = {
                id: newLessonId,
                title: lessonData.title || `Lesson ${module.lessons.length + 1}`,
                type: lessonData.type || "VIDEO",
                duration: lessonData.duration || "8 min",
                file: lessonData.file || "lesson_asset.mp4",
                objectives: lessonData.objectives || ["Understand core concept"],
                takeaways: lessonData.takeaways || ["Key operational takeaway"]
            };
            module.lessons.push(newLesson);
            this.notify();
            return newLesson;
        }
    }

    deleteLessonFromModule(courseId, moduleId, lessonId) {
        const course = this.getCourseById(courseId);
        if (!course) return;
        const module = course.modules.find(m => m.id === moduleId);
        if (module && module.lessons) {
            module.lessons = module.lessons.filter(l => l.id !== lessonId);
            this.notify();
        }
    }

    reorderLesson(courseId, moduleId, lessonId, direction) {
        const course = this.getCourseById(courseId);
        if (!course) return;
        const module = course.modules.find(m => m.id === moduleId);
        if (!module || !module.lessons) return;
        const index = module.lessons.findIndex(l => l.id === lessonId);
        if (index < 0) return;
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex >= 0 && targetIndex < module.lessons.length) {
            const temp = module.lessons[index];
            module.lessons[index] = module.lessons[targetIndex];
            module.lessons[targetIndex] = temp;
            this.notify();
        }
    }

    // Quizzes
    getQuizById(quizId) {
        return this.quizzes.find(q => q.id === quizId) || this.quizzes[0];
    }

    saveQuiz(quizData) {
        let existing = this.quizzes.find(q => q.id === quizData.id);
        if (existing) {
            Object.assign(existing, quizData);
        } else {
            this.quizzes.push(quizData);
        }
        this.addActivity(`Updated quiz: ${quizData.title}`, "quiz", "award", "text-amber-500");
        this.notify();
    }

    // Assignments
    createAssignment(assignmentData) {
        const newId = `ASG-00${this.assignments.length + 1}`;
        const newAsg = {
            id: newId,
            courseId: assignmentData.courseId,
            courseTitle: assignmentData.courseTitle,
            assignedToLabel: assignmentData.assignedToLabel,
            targetType: assignmentData.targetType,
            employeeCount: assignmentData.employeeCount || 42,
            assignedDate: "Today",
            deadline: assignmentData.deadline || "30 Sep 2026",
            status: "Active",
            completedCount: 0
        };
        this.assignments.unshift(newAsg);

        const course = this.getCourseById(assignmentData.courseId);
        if (course) {
            course.assignedCount = (course.assignedCount || 0) + newAsg.employeeCount;
        }

        this.addActivity(`Assigned "${newAsg.courseTitle}" to ${newAsg.assignedToLabel} (${newAsg.employeeCount} employees)`, "assignment", "send", "text-indigo-500");
        this.notify();
        return newAsg;
    }

    sendReminder(notificationId) {
        const notif = this.notifications.find(n => n.id === notificationId);
        if (notif) {
            notif.status = "Reminders Dispatched";
            this.addActivity(`Sent automated reminder alerts for: "${notif.title}"`, "notification", "bell-ring", "text-blue-500");
            this.notify();
        }
    }

    updateSettings(newSettings) {
        this.settings = Object.assign({}, this.settings, newSettings);
        this.addActivity(`Admin settings updated`, "settings", "settings", "text-slate-500");
        this.notify();
    }

    resetToFactoryDefaults() {
        localStorage.removeItem("skillup_admin_state_v3");
        this.loadState();
        this.notify();
    }
}

// Global singleton instance
window.adminStore = new AdminStore();
