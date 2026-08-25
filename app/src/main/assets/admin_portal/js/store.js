// SkillUp Enterprise Admin Portal - Local State Management Store
// Handles reactive routing, CRUD operations in local memory/localStorage, and audit trails

class AdminStore {
    constructor() {
        this.loadState();
        this.subscribers = [];
        this.navigationStack = [];
    }

    loadState() {
        try {
            const savedState = localStorage.getItem("skillup_admin_state_v2");
            if (savedState) {
                const parsed = JSON.parse(savedState);
                this.adminUser = parsed.adminUser || INITIAL_ADMIN_USER;
                this.employees = parsed.employees || INITIAL_EMPLOYEES;
                this.courses = parsed.courses || INITIAL_COURSES;
                this.quizzes = parsed.quizzes || INITIAL_QUIZZES;
                this.assignments = parsed.assignments || INITIAL_ASSIGNMENTS;
                this.notifications = parsed.notifications || INITIAL_NOTIFICATIONS;
                this.activities = parsed.activities || INITIAL_ACTIVITIES;
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
        this.saveState();
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
                isLoggedIn: this.isLoggedIn,
                currentRoute: this.currentRoute,
                selectedEmployeeId: this.selectedEmployeeId,
                selectedCourseId: this.selectedCourseId,
                editingModuleId: this.editingModuleId,
                editingLessonId: this.editingLessonId,
                editingQuizId: this.editingQuizId,
                settings: this.settings
            };
            localStorage.setItem("skillup_admin_state_v2", JSON.stringify(state));
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
            // Default fallback
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

    // Activities
    addActivity(text, type = "general", icon = "activity", color = "text-blue-500") {
        this.activities.unshift({
            id: `ACT-${Date.now()}`,
            text,
            time: "Just now",
            type,
            icon,
            color
        });
        if (this.activities.length > 20) this.activities.pop();
    }

    // Employees
    getEmployeeById(id) {
        return this.employees.find(e => e.id === id) || this.employees[0];
    }

    addEmployee(empData) {
        const newId = `EMP00${this.employees.length + 1}`;
        const newEmp = {
            id: newId,
            name: empData.name || "New Employee",
            role: empData.role || "Relationship Manager",
            department: empData.department || "Sales & Distribution",
            location: empData.location || "Bangalore",
            manager: empData.manager || "Amit Kumar",
            email: empData.email || `${newId.toLowerCase()}@skillup.com`,
            phone: empData.phone || "+91 98765 00000",
            joiningDate: "Today",
            progress: 0,
            coursesAssigned: 0,
            coursesCompleted: 0,
            coursesInProgress: 0,
            avgScore: null,
            status: "Active",
            avatarBg: "bg-blue-600",
            courseProgress: []
        };
        this.employees.unshift(newEmp);
        this.addActivity(`Added new employee: ${newEmp.name} (${newId})`, "employee", "user-plus", "text-emerald-500");
        this.notify();
        return newEmp;
    }

    // Courses
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

    // Modules & Lessons in Course Builder
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

    // Assignments Workflow
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

        // Also update the course's assignedCount
        const course = this.getCourseById(assignmentData.courseId);
        if (course) {
            course.assignedCount = (course.assignedCount || 0) + newAsg.employeeCount;
        }

        this.addActivity(`Assigned "${newAsg.courseTitle}" to ${newAsg.assignedToLabel} (${newAsg.employeeCount} employees)`, "assignment", "send", "text-indigo-500");
        this.notify();
        return newAsg;
    }

    // Notification Reminders
    sendReminder(notificationId) {
        const notif = this.notifications.find(n => n.id === notificationId);
        if (notif) {
            notif.status = "Reminders Dispatched";
            this.addActivity(`Sent automated reminder alerts for: "${notif.title}"`, "notification", "bell-ring", "text-blue-500");
            this.notify();
        }
    }

    // Update Settings
    updateSettings(newSettings) {
        this.settings = Object.assign({}, this.settings, newSettings);
        this.addActivity(`Admin settings updated`, "settings", "settings", "text-slate-500");
        this.notify();
    }

    // Reset data to defaults
    resetToFactoryDefaults() {
        localStorage.removeItem("skillup_admin_state_v2");
        this.loadState();
        this.notify();
    }
}

// Global singleton instance
window.adminStore = new AdminStore();
