// SkillUp Enterprise Admin Portal - Main Application Engine
// Renders all 12 Screens, Modals, Breadcrumbs, and Workflow Wizards

function showToast(message, icon = "check-circle", duration = 3500) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
        <i data-lucide="${icon}" class="w-5 h-5 text-emerald-400"></i>
        <span class="font-medium">${message}</span>
    `;
    container.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transition = "opacity 0.3s ease";
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ----------------------------------------------------
// SCREEN RENDERERS
// ----------------------------------------------------

function renderLoginScreen() {
    return `
    <div class="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 select-none">
        <div class="max-w-md w-full">
            <!-- Brand Badge -->
            <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#0A2540] text-white shadow-lg mb-4">
                    <i data-lucide="graduation-cap" class="w-9 h-9 text-blue-400"></i>
                </div>
                <h1 class="text-3xl font-extrabold text-[#0A2540] tracking-tight">SKILLUP</h1>
                <div class="inline-block bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mt-2 uppercase tracking-wider">
                    Admin Portal
                </div>
                <p class="text-slate-500 mt-2 text-sm italic">"Manage learning. Build capability."</p>
            </div>

            <!-- Login Card -->
            <div class="admin-card p-8 shadow-sm">
                <h2 class="text-xl font-bold text-slate-900 mb-1">Administrator Sign In</h2>
                <p class="text-xs text-slate-500 mb-6">Enter your authorized enterprise credentials to access the console.</p>

                <form id="admin-login-form" class="space-y-4" onsubmit="handleAdminLogin(event)">
                    <div>
                        <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">Admin User ID</label>
                        <div class="relative">
                            <i data-lucide="shield" class="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5"></i>
                            <input type="text" id="login-admin-id" value="ADMIN001" required
                                class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                placeholder="e.g. ADMIN001" />
                        </div>
                    </div>

                    <div>
                        <div class="flex items-center justify-between mb-1">
                            <label class="block text-xs font-semibold uppercase tracking-wider text-slate-700">Password</label>
                            <a href="#" onclick="alert('For prototype access, use Password: admin123'); return false;" class="text-xs font-medium text-blue-600 hover:underline">Forgot Password?</a>
                        </div>
                        <div class="relative">
                            <i data-lucide="lock" class="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5"></i>
                            <input type="password" id="login-password" value="admin123" required
                                class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                                placeholder="Enter admin password" />
                        </div>
                    </div>

                    <div class="pt-2">
                        <button type="submit" class="w-full py-3 bg-[#0A2540] hover:bg-slate-900 text-white rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center justify-center gap-2">
                            <span>LOGIN TO ADMIN PORTAL</span>
                            <i data-lucide="arrow-right" class="w-4 h-4"></i>
                        </button>
                    </div>
                </form>

                <!-- Prototype Credentials Callout -->
                <div class="mt-6 p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-xs text-slate-600 flex items-start gap-2.5">
                    <i data-lucide="info" class="w-4 h-4 text-blue-600 shrink-0 mt-0.5"></i>
                    <div>
                        <span class="font-semibold text-blue-900">Prototype Demo Credentials:</span>
                        <div class="mt-1 font-mono text-[11px] text-blue-800">
                            Admin ID: <strong class="text-slate-900">ADMIN001</strong> &nbsp;|&nbsp; Password: <strong class="text-slate-900">admin123</strong>
                        </div>
                    </div>
                </div>
            </div>

            <div class="text-center mt-6 text-xs text-slate-400">
                SkillUp L&D Systems &copy; 2026 Enterprise Edition
            </div>
        </div>
    </div>
    `;
}

function handleAdminLogin(event) {
    event.preventDefault();
    const id = document.getElementById("login-admin-id").value;
    const pwd = document.getElementById("login-password").value;
    const result = window.adminStore.login(id, pwd);
    if (result.success) {
        showToast("Welcome to SkillUp Admin Portal, Praveen!", "check-circle");
    } else {
        alert(result.message);
    }
}

// SCREEN 2: DASHBOARD
function renderDashboardScreen(store) {
    const totalEmployees = 200;
    const activeLearners = 167;
    const activeCourses = store.courses.filter(c => c.status === "Published").length || 8;
    const overallCompletion = 72;

    return `
    <div class="space-y-6 fade-in">
        <!-- Page Header -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">Dashboard</h1>
                <p class="text-sm text-slate-500 mt-0.5">"Here's your learning overview."</p>
            </div>
            <div class="flex items-center gap-3">
                <button onclick="window.adminStore.navigate('assignments')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition">
                    <i data-lucide="send" class="w-3.5 h-3.5"></i>
                    <span>+ Quick Assign Course</span>
                </button>
                <button onclick="window.adminStore.navigate('reports')" class="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition">
                    <i data-lucide="download" class="w-3.5 h-3.5 text-slate-500"></i>
                    <span>Export Reports</span>
                </button>
            </div>
        </div>

        <!-- Top KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="admin-card p-5">
                <div class="flex items-center justify-between text-slate-500 mb-2">
                    <span class="text-xs font-semibold uppercase tracking-wider">Employees</span>
                    <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <i data-lucide="users" class="w-4 h-4"></i>
                    </div>
                </div>
                <div class="text-3xl font-extrabold text-slate-900">${totalEmployees}</div>
                <div class="mt-2 text-xs text-emerald-600 flex items-center gap-1 font-medium">
                    <i data-lucide="trending-up" class="w-3.5 h-3.5"></i>
                    <span>100% onboarded on platform</span>
                </div>
            </div>

            <div class="admin-card p-5">
                <div class="flex items-center justify-between text-slate-500 mb-2">
                    <span class="text-xs font-semibold uppercase tracking-wider">Active Learners</span>
                    <div class="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <i data-lucide="user-check" class="w-4 h-4"></i>
                    </div>
                </div>
                <div class="text-3xl font-extrabold text-slate-900">${activeLearners}</div>
                <div class="mt-2 text-xs text-slate-500 font-medium">
                    <span>83.5% learning engagement this month</span>
                </div>
            </div>

            <div class="admin-card p-5">
                <div class="flex items-center justify-between text-slate-500 mb-2">
                    <span class="text-xs font-semibold uppercase tracking-wider">Active Courses</span>
                    <div class="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <i data-lucide="book-open" class="w-4 h-4"></i>
                    </div>
                </div>
                <div class="text-3xl font-extrabold text-slate-900">${activeCourses}</div>
                <div class="mt-2 text-xs text-blue-600 font-medium">
                    <span>Across 4 strategic capability tracks</span>
                </div>
            </div>

            <div class="admin-card p-5">
                <div class="flex items-center justify-between text-slate-500 mb-2">
                    <span class="text-xs font-semibold uppercase tracking-wider">Overall Completion</span>
                    <div class="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                        <i data-lucide="pie-chart" class="w-4 h-4"></i>
                    </div>
                </div>
                <div class="text-3xl font-extrabold text-slate-900">${overallCompletion}%</div>
                <div class="mt-2 flex items-center gap-2">
                    <div class="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div class="bg-blue-600 h-1.5 rounded-full" style="width: ${overallCompletion}%"></div>
                    </div>
                    <span class="text-[11px] text-slate-500 font-semibold">+4.2% MoM</span>
                </div>
            </div>
        </div>

        <!-- Course Performance Table -->
        <div class="admin-card p-6">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-base font-bold text-slate-900">COURSE PERFORMANCE</h2>
                    <p class="text-xs text-slate-500">Track assignment adoption and completion benchmarks across active programs.</p>
                </div>
                <button onclick="window.adminStore.navigate('courses')" class="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    <span>View all courses</span>
                    <i data-lucide="chevron-right" class="w-3.5 h-3.5"></i>
                </button>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                    <thead>
                        <tr class="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                            <th class="pb-3">Course</th>
                            <th class="pb-3 text-center">Assigned</th>
                            <th class="pb-3 text-center">Started</th>
                            <th class="pb-3 text-center">Completed</th>
                            <th class="pb-3">Completion Progress</th>
                            <th class="pb-3 text-right">Avg Score</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50 font-medium text-slate-700">
                        ${store.courses.map(c => `
                            <tr class="hover:bg-slate-50/70 transition cursor-pointer" onclick="window.adminStore.navigate('course-builder', { courseId: '${c.id}' })">
                                <td class="py-3.5 pr-4 font-semibold text-slate-900 flex items-center gap-2.5">
                                    <div class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <i data-lucide="book-text" class="w-3.5 h-3.5"></i>
                                    </div>
                                    <span>${c.title}</span>
                                </td>
                                <td class="py-3.5 text-center text-slate-600">${c.assignedCount}</td>
                                <td class="py-3.5 text-center text-slate-600">${c.startedCount}</td>
                                <td class="py-3.5 text-center font-semibold text-emerald-600">${c.completedCount}</td>
                                <td class="py-3.5 pr-4 w-48">
                                    <div class="flex items-center gap-2">
                                        <div class="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                                            <div class="bg-blue-600 h-2 rounded-full" style="width: ${c.completionPercentage}%"></div>
                                        </div>
                                        <span class="text-[11px] font-bold text-slate-700 w-9">${c.completionPercentage}%</span>
                                    </div>
                                </td>
                                <td class="py-3.5 text-right font-bold text-slate-900">${c.avgScore ? c.avgScore + '%' : '—'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- 2 Column Section: Needs Attention & Recent Activity -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- NEEDS ATTENTION -->
            <div class="admin-card p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                            <i data-lucide="alert-circle" class="w-4 h-4"></i>
                        </div>
                        <h2 class="text-base font-bold text-slate-900">NEEDS ATTENTION</h2>
                    </div>
                    <button onclick="window.adminStore.navigate('notifications')" class="text-xs font-semibold text-blue-600 hover:underline">
                        Manage all
                    </button>
                </div>

                <div class="space-y-3">
                    <div class="p-3.5 bg-rose-50/60 border border-rose-100 rounded-xl flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-xs">
                                27
                            </div>
                            <div>
                                <h3 class="text-xs font-bold text-slate-900">27 employees overdue</h3>
                                <p class="text-[11px] text-slate-500">Missed statutory completion deadline</p>
                            </div>
                        </div>
                        <button onclick="window.adminStore.sendReminder('NOTIF-001'); showToast('Overdue reminders sent to 27 employees');" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition">
                            Send Reminder
                        </button>
                    </div>

                    <div class="p-3.5 bg-amber-50/60 border border-amber-100 rounded-xl flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xs">
                                18
                            </div>
                            <div>
                                <h3 class="text-xs font-bold text-slate-900">18 employees haven't started assigned courses</h3>
                                <p class="text-[11px] text-slate-500">Assigned more than 7 days ago</p>
                            </div>
                        </div>
                        <button onclick="window.adminStore.sendReminder('NOTIF-002'); showToast('Nudge reminders dispatched');" class="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold transition">
                            Send Nudge
                        </button>
                    </div>

                    <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                                9
                            </div>
                            <div>
                                <h3 class="text-xs font-bold text-slate-900">9 employees failed assessment</h3>
                                <p class="text-[11px] text-slate-500">Scored under 70% threshold</p>
                            </div>
                        </div>
                        <button onclick="window.adminStore.navigate('reports')" class="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition">
                            Review Results
                        </button>
                    </div>
                </div>
            </div>

            <!-- RECENT ACTIVITY -->
            <div class="admin-card p-6">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-2">
                        <div class="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <i data-lucide="clock" class="w-4 h-4"></i>
                        </div>
                        <h2 class="text-base font-bold text-slate-900">RECENT ACTIVITY</h2>
                    </div>
                    <span class="text-xs text-slate-400 font-medium">Live Stream</span>
                </div>

                <div class="space-y-3.5">
                    ${store.activities.slice(0, 5).map(act => `
                        <div class="flex items-start gap-3 text-xs">
                            <div class="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                                <i data-lucide="${act.icon || 'activity'}" class="w-3.5 h-3.5 ${act.color || 'text-blue-500'}"></i>
                            </div>
                            <div class="flex-1">
                                <p class="text-slate-800 font-medium leading-snug">${act.text}</p>
                                <span class="text-[11px] text-slate-400">${act.time}</span>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    </div>
    `;
}

// (Employee screens and handlers are modularized in js/employee-mgmt.js)

// SCREEN 5: COURSES CATALOG
function renderCoursesScreen(store) {
    return `
    <div class="space-y-6 fade-in">
        <!-- Page Header -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">Courses</h1>
                <p class="text-sm text-slate-500 mt-0.5">Design syllabus, manage interactive modules, and track completion statistics.</p>
            </div>
            <div>
                <button onclick="handleCreateNewCourse()" class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition">
                    <i data-lucide="plus-circle" class="w-4 h-4"></i>
                    <span>+ Create Course</span>
                </button>
            </div>
        </div>

        <!-- Filter & Search -->
        <div class="admin-card p-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div class="lg:col-span-2 relative">
                    <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-3"></i>
                    <input type="text" id="course-search-input" onkeyup="filterCoursesTable()"
                        placeholder="Search courses..."
                        class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition" />
                </div>

                <div>
                    <select id="course-filter-category" onchange="filterCoursesTable()" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">All Categories</option>
                        <option value="PRODUCT KNOWLEDGE">Product Knowledge</option>
                        <option value="SALES & GROWTH">Sales & Growth</option>
                        <option value="CUSTOMER EXPERIENCE">Customer Experience</option>
                        <option value="OPERATIONS & RISK">Operations & Risk</option>
                        <option value="COMPLIANCE">Compliance</option>
                    </select>
                </div>

                <div>
                    <select id="course-filter-type" onchange="filterCoursesTable()" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">Mandatory / Elective</option>
                        <option value="MANDATORY">Mandatory</option>
                        <option value="ELECTIVE">Elective</option>
                    </select>
                </div>

                <div>
                    <select id="course-filter-status" onchange="filterCoursesTable()" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">All Statuses</option>
                        <option value="Published">Published</option>
                        <option value="Draft">Draft</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Course Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="courses-grid">
            ${store.courses.map(course => `
                <div class="admin-card admin-card-interactive p-5 flex flex-col justify-between course-card-item">
                    <div>
                        <!-- Thumbnail & Badges -->
                        <div class="relative h-36 rounded-xl overflow-hidden mb-3 bg-slate-100">
                            <img src="${course.thumbnail}" alt="${course.title}" class="w-full h-full object-cover" />
                            <div class="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide bg-white/90 backdrop-blur text-[#0A2540] shadow-sm">
                                    ${course.category}
                                </span>
                                <span class="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${course.type === 'MANDATORY' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'} shadow-sm">
                                    ${course.type}
                                </span>
                            </div>
                            <div class="absolute bottom-2.5 right-2.5">
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${course.status === 'Published' ? 'badge-published' : 'badge-draft'} shadow-sm">
                                    ${course.status}
                                </span>
                            </div>
                        </div>

                        <h2 class="text-base font-bold text-slate-900 leading-snug hover:text-blue-600 transition cursor-pointer" onclick="window.adminStore.navigate('course-builder', { courseId: '${course.id}' })">
                            ${course.title}
                        </h2>
                        <p class="text-xs text-slate-500 mt-1 line-clamp-2">${course.description}</p>

                        <!-- Course Metadata Stats -->
                        <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                            <span class="flex items-center gap-1">
                                <i data-lucide="layers" class="w-3.5 h-3.5 text-slate-400"></i>
                                ${(course.modules || []).length} Modules
                            </span>
                            <span class="flex items-center gap-1">
                                <i data-lucide="clock" class="w-3.5 h-3.5 text-slate-400"></i>
                                ${course.durationMinutes} min
                            </span>
                            <span class="flex items-center gap-1">
                                <i data-lucide="users" class="w-3.5 h-3.5 text-slate-400"></i>
                                ${course.assignedCount} Assigned
                            </span>
                        </div>

                        <!-- Progress Bar -->
                        <div class="mt-3">
                            <div class="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1">
                                <span>Completion</span>
                                <span>${course.completionPercentage}%</span>
                            </div>
                            <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                <div class="bg-blue-600 h-1.5 rounded-full" style="width: ${course.completionPercentage}%"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Actions Row -->
                    <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button onclick="window.adminStore.navigate('course-builder', { courseId: '${course.id}' })" class="flex-1 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1">
                            <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
                            <span>Edit</span>
                        </button>
                        <button onclick="window.adminStore.duplicateCourse('${course.id}'); showToast('Course duplicated as draft');" title="Duplicate Course" class="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition">
                            <i data-lucide="copy" class="w-4 h-4"></i>
                        </button>
                        <button onclick="window.adminStore.navigate('assignments', { courseId: '${course.id}' })" title="Assign Course" class="p-1.5 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition">
                            <i data-lucide="send" class="w-4 h-4"></i>
                        </button>
                        <button onclick="window.adminStore.navigate('reports')" title="View Analytics" class="p-1.5 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition">
                            <i data-lucide="bar-chart-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    `;
}

function handleCreateNewCourse() {
    const newCourse = window.adminStore.createCourse({
        title: "New Enterprise Course",
        category: "PRODUCT KNOWLEDGE",
        type: "MANDATORY",
        difficulty: "Intermediate",
        durationMinutes: 45,
        status: "Draft",
        description: "Comprehensive capability training program."
    });
    window.adminStore.navigate("course-builder", { courseId: newCourse.id });
    showToast("New course drafted! Configure syllabus below.", "plus-circle");
}

function filterCoursesTable() {
    const q = (document.getElementById("course-search-input")?.value || "").toLowerCase();
    const cat = (document.getElementById("course-filter-category")?.value || "").toLowerCase();
    const type = (document.getElementById("course-filter-type")?.value || "").toLowerCase();
    const status = (document.getElementById("course-filter-status")?.value || "").toLowerCase();

    const cards = document.querySelectorAll(".course-card-item");
    cards.forEach(card => {
        const text = card.innerText.toLowerCase();
        const matchesQ = !q || text.includes(q);
        const matchesCat = !cat || text.includes(cat);
        const matchesType = !type || text.includes(type);
        const matchesStatus = !status || text.includes(status);

        card.style.display = (matchesQ && matchesCat && matchesType && matchesStatus) ? "" : "none";
    });
}

// SCREEN 6: COURSE BUILDER (THE MOST IMPORTANT SCREEN)
function renderCourseBuilderScreen(store) {
    const course = store.getCourseById(store.selectedCourseId);
    const modules = course.modules || [];

    return `
    <div class="space-y-6 fade-in">
        <!-- Back Navigation & Breadcrumb -->
        <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-2 text-slate-500">
                <button onclick="window.adminStore.goBack()" class="hover:text-slate-900 font-semibold flex items-center gap-1">
                    <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
                    <span>Courses</span>
                </button>
                <span>/</span>
                <span class="text-slate-900 font-bold">${course.title}</span>
            </div>
            <div class="flex items-center gap-2">
                <button onclick="saveCourseBuilderState('${course.id}', 'Draft')" class="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition">
                    Save Draft
                </button>
                <button onclick="saveCourseBuilderState('${course.id}', 'Published')" class="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition flex items-center gap-1.5 shadow-sm">
                    <i data-lucide="check" class="w-3.5 h-3.5"></i>
                    <span>Publish Course</span>
                </button>
            </div>
        </div>

        <!-- Course Metadata Configuration Form -->
        <div class="admin-card p-6">
            <h2 class="text-base font-bold text-slate-900 mb-4">Course Properties</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div class="md:col-span-2">
                    <label class="block font-semibold text-slate-700 mb-1">Course Name</label>
                    <input type="text" id="builder-title" value="${course.title}" class="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>

                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Category</label>
                    <select id="builder-category" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500">
                        <option value="PRODUCT KNOWLEDGE" ${course.category === 'PRODUCT KNOWLEDGE' ? 'selected' : ''}>Product Knowledge</option>
                        <option value="SALES & GROWTH" ${course.category === 'SALES & GROWTH' ? 'selected' : ''}>Sales & Growth</option>
                        <option value="CUSTOMER EXPERIENCE" ${course.category === 'CUSTOMER EXPERIENCE' ? 'selected' : ''}>Customer Experience</option>
                        <option value="OPERATIONS & RISK" ${course.category === 'OPERATIONS & RISK' ? 'selected' : ''}>Operations & Risk</option>
                        <option value="COMPLIANCE" ${course.category === 'COMPLIANCE' ? 'selected' : ''}>Compliance</option>
                    </select>
                </div>

                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Course Type</label>
                    <select id="builder-type" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500">
                        <option value="MANDATORY" ${course.type === 'MANDATORY' ? 'selected' : ''}>MANDATORY</option>
                        <option value="ELECTIVE" ${course.type === 'ELECTIVE' ? 'selected' : ''}>ELECTIVE</option>
                    </select>
                </div>

                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Difficulty</label>
                    <select id="builder-difficulty" class="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500">
                        <option value="Beginner" ${course.difficulty === 'Beginner' ? 'selected' : ''}>Beginner</option>
                        <option value="Intermediate" ${course.difficulty === 'Intermediate' ? 'selected' : ''}>Intermediate</option>
                        <option value="Advanced" ${course.difficulty === 'Advanced' ? 'selected' : ''}>Advanced</option>
                    </select>
                </div>

                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Estimated Duration (minutes)</label>
                    <input type="number" id="builder-duration" value="${course.durationMinutes}" class="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>

                <div class="md:col-span-2 lg:col-span-3">
                    <label class="block font-semibold text-slate-700 mb-1">Description</label>
                    <textarea id="builder-description" rows="2" class="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none">${course.description}</textarea>
                </div>
            </div>
        </div>

        <!-- COURSE STRUCTURE (MODULE & LESSON BUILDER) -->
        <div class="space-y-4">
            <div class="flex items-center justify-between">
                <div>
                    <h2 class="text-lg font-bold text-slate-900">COURSE STRUCTURE</h2>
                    <p class="text-xs text-slate-500">Organize modules, multimedia lessons, and knowledge checks.</p>
                </div>
                <button onclick="promptAddModule('${course.id}')" class="px-3.5 py-2 bg-[#0A2540] hover:bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition">
                    <i data-lucide="folder-plus" class="w-4 h-4"></i>
                    <span>+ Add Module</span>
                </button>
            </div>

            ${modules.length === 0 ? `
                <div class="admin-card p-12 text-center">
                    <i data-lucide="layers" class="w-12 h-12 text-slate-300 mx-auto mb-3"></i>
                    <h3 class="text-sm font-bold text-slate-700">No modules yet in this course</h3>
                    <p class="text-xs text-slate-400 mt-1 max-w-sm mx-auto">Get started by creating your first instructional module above.</p>
                </div>
            ` : `
                <div class="space-y-4">
                    ${modules.map((mod, modIdx) => `
                        <div class="admin-card p-5 border-l-4 border-l-blue-600">
                            <!-- Module Header -->
                            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-100">
                                <div class="flex items-center gap-2">
                                    <div class="drag-handle text-slate-400 cursor-grab">
                                        <i data-lucide="grip-vertical" class="w-4 h-4"></i>
                                    </div>
                                    <span class="text-xs font-bold text-blue-600 uppercase tracking-wider">MODULE ${modIdx + 1}</span>
                                    <h3 class="text-sm font-bold text-slate-900">${mod.title}</h3>
                                </div>

                                <div class="flex items-center gap-1 text-xs">
                                    <button onclick="window.adminStore.reorderModule('${course.id}', '${mod.id}', 'up')" title="Move Up" class="p-1 hover:bg-slate-100 rounded text-slate-500">
                                        <i data-lucide="arrow-up" class="w-3.5 h-3.5"></i>
                                    </button>
                                    <button onclick="window.adminStore.reorderModule('${course.id}', '${mod.id}', 'down')" title="Move Down" class="p-1 hover:bg-slate-100 rounded text-slate-500">
                                        <i data-lucide="arrow-down" class="w-3.5 h-3.5"></i>
                                    </button>
                                    <button onclick="promptAddLesson('${course.id}', '${mod.id}')" class="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-semibold flex items-center gap-1 transition">
                                        <i data-lucide="plus" class="w-3 h-3"></i>
                                        <span>+ Add Lesson</span>
                                    </button>
                                    <button onclick="if(confirm('Delete module and its lessons?')) window.adminStore.deleteModuleFromCourse('${course.id}', '${mod.id}')" title="Delete Module" class="p-1 hover:bg-rose-50 text-rose-500 rounded">
                                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Module Lessons List -->
                            <div class="mt-3 space-y-2">
                                ${(mod.lessons || []).length === 0 ? `
                                    <p class="text-xs text-slate-400 italic py-2">No lessons yet. Click '+ Add Lesson' to insert video, PDF, text, or quiz.</p>
                                ` : `
                                    ${mod.lessons.map((lesson, lesIdx) => `
                                        <div class="p-2.5 bg-slate-50/90 hover:bg-slate-100/90 border border-slate-200/60 rounded-xl flex items-center justify-between text-xs transition">
                                            <div class="flex items-center gap-3">
                                                <div class="drag-handle text-slate-400">
                                                    <i data-lucide="grip-vertical" class="w-3.5 h-3.5"></i>
                                                </div>
                                                <span class="text-slate-400 font-mono text-[11px]">${lesIdx + 1}.</span>
                                                <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase
                                                    ${lesson.type === 'VIDEO' ? 'bg-rose-100 text-rose-700' : lesson.type === 'PDF' ? 'bg-amber-100 text-amber-700' : lesson.type === 'QUIZ' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}">
                                                    ${lesson.type}
                                                </span>
                                                <span class="font-semibold text-slate-800">${lesson.title}</span>
                                                ${lesson.duration ? `<span class="text-[11px] text-slate-400">(${lesson.duration})</span>` : ''}
                                            </div>

                                            <div class="flex items-center gap-1.5">
                                                ${lesson.type === 'QUIZ' ? `
                                                    <button onclick="window.adminStore.navigate('quiz-builder', { quizId: '${lesson.quizId || 'Q101'}', courseId: '${course.id}', moduleId: '${mod.id}', lessonId: '${lesson.id}' })" class="px-2 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded font-semibold transition">
                                                        Edit Quiz
                                                    </button>
                                                ` : `
                                                    <button onclick="window.adminStore.navigate('lesson-editor', { courseId: '${course.id}', moduleId: '${mod.id}', lessonId: '${lesson.id}' })" class="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded font-semibold transition">
                                                        Edit Content
                                                    </button>
                                                `}
                                                <button onclick="window.adminStore.reorderLesson('${course.id}', '${mod.id}', '${lesson.id}', 'up')" class="p-1 text-slate-400 hover:text-slate-700">
                                                    <i data-lucide="chevron-up" class="w-3.5 h-3.5"></i>
                                                </button>
                                                <button onclick="window.adminStore.reorderLesson('${course.id}', '${mod.id}', '${lesson.id}', 'down')" class="p-1 text-slate-400 hover:text-slate-700">
                                                    <i data-lucide="chevron-down" class="w-3.5 h-3.5"></i>
                                                </button>
                                                <button onclick="window.adminStore.deleteLessonFromModule('${course.id}', '${mod.id}', '${lesson.id}')" class="p-1 text-rose-400 hover:text-rose-600">
                                                    <i data-lucide="x" class="w-3.5 h-3.5"></i>
                                                </button>
                                            </div>
                                        </div>
                                    `).join('')}
                                `}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}

            <!-- Bottom Action Footer -->
            <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button onclick="saveCourseBuilderState('${course.id}', 'Draft')" class="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition">
                    Save Draft
                </button>
                <button onclick="saveCourseBuilderState('${course.id}', 'Published')" class="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-sm transition">
                    Publish Course
                </button>
            </div>
        </div>
    </div>
    `;
}

function promptAddModule(courseId) {
    const title = prompt("Enter Module Title:", "New Module");
    if (title && title.trim()) {
        window.adminStore.addModuleToCourse(courseId, title.trim());
        showToast("Module added to syllabus", "folder-plus");
    }
}

function promptAddLesson(courseId, moduleId) {
    const title = prompt("Enter Lesson Title:", "New Lesson");
    if (!title || !title.trim()) return;
    const typeChoice = prompt("Select Lesson Type (VIDEO / PDF / TEXT / QUIZ):", "VIDEO");
    const type = (typeChoice || "VIDEO").toUpperCase();

    window.adminStore.addLessonToModule(courseId, moduleId, {
        title: title.trim(),
        type: ["VIDEO", "PDF", "TEXT", "QUIZ"].includes(type) ? type : "VIDEO",
        duration: "7 min"
    });
    showToast("Lesson added successfully", "plus");
}

function saveCourseBuilderState(courseId, status) {
    const title = document.getElementById("builder-title")?.value;
    const category = document.getElementById("builder-category")?.value;
    const type = document.getElementById("builder-type")?.value;
    const difficulty = document.getElementById("builder-difficulty")?.value;
    const duration = document.getElementById("builder-duration")?.value;
    const description = document.getElementById("builder-description")?.value;

    window.adminStore.updateCourse(courseId, {
        title,
        category,
        type,
        difficulty,
        durationMinutes: parseInt(duration || 45),
        description,
        status
    });

    showToast(`Course successfully saved as ${status}!`, "check-circle");
}

// SCREEN 7: LESSON EDITOR
function renderLessonEditorScreen(store) {
    const course = store.getCourseById(store.selectedCourseId);
    let targetLesson = null;
    let targetModule = null;

    if (course && course.modules) {
        for (const mod of course.modules) {
            if (mod.lessons) {
                const found = mod.lessons.find(l => l.id === store.editingLessonId);
                if (found) {
                    targetLesson = found;
                    targetModule = mod;
                    break;
                }
            }
        }
    }

    if (!targetLesson) {
        targetLesson = { id: "L_DEF", title: "Introduction Lesson", type: "VIDEO", duration: "8 min", file: "sample_video.mp4", objectives: ["Understand basic value proposition"], takeaways: ["Asset-backed safety"] };
    }

    return `
    <div class="space-y-6 fade-in max-w-4xl mx-auto">
        <!-- Back Navigation & Breadcrumb -->
        <div class="flex items-center gap-2 text-xs text-slate-500">
            <button onclick="window.adminStore.navigate('course-builder', { courseId: '${course.id}' })" class="hover:text-slate-900 font-semibold flex items-center gap-1">
                <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
                <span>Course Builder</span>
            </button>
            <span>/</span>
            <span class="text-slate-900 font-bold">Edit Lesson: ${targetLesson.title}</span>
        </div>

        <!-- Lesson Editor Card -->
        <div class="admin-card p-6">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                    <h1 class="text-xl font-bold text-slate-900">Lesson Editor</h1>
                    <p class="text-xs text-slate-500">Configure multimedia assets, objectives, and instructional summary.</p>
                </div>
                <span class="px-2.5 py-1 rounded-full text-xs font-bold uppercase
                    ${targetLesson.type === 'VIDEO' ? 'bg-rose-100 text-rose-700' : targetLesson.type === 'PDF' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}">
                    ${targetLesson.type} LESSON
                </span>
            </div>

            <form onsubmit="handleSaveLesson(event, '${course.id}', '${targetModule ? targetModule.id : ''}', '${targetLesson.id}')" class="space-y-5 text-xs">
                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Lesson Title</label>
                    <input type="text" id="lesson-title-input" value="${targetLesson.title}" required
                        class="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">Lesson Type</label>
                        <select id="lesson-type-select" onchange="toggleLessonTypeFields()" class="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500">
                            <option value="VIDEO" ${targetLesson.type === 'VIDEO' ? 'selected' : ''}>Video Lesson (.mp4, .webm)</option>
                            <option value="PDF" ${targetLesson.type === 'PDF' ? 'selected' : ''}>PDF Document (.pdf)</option>
                            <option value="TEXT" ${targetLesson.type === 'TEXT' ? 'selected' : ''}>Rich Text Article</option>
                        </select>
                    </div>

                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">Estimated Duration</label>
                        <input type="text" id="lesson-duration-input" value="${targetLesson.duration || '8 min'}"
                            class="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>
                </div>

                <!-- DYNAMIC MEDIA UPLOAD / CONTENT AREA -->
                <div id="media-upload-container" class="p-5 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                    <div id="video-upload-section" class="${targetLesson.type === 'VIDEO' ? '' : 'hidden'}">
                        <i data-lucide="video" class="w-10 h-10 text-rose-500 mx-auto mb-2"></i>
                        <h3 class="font-bold text-slate-800 text-sm">Video Content Upload</h3>
                        <p class="text-slate-500 text-xs mt-0.5">Supports MP4, WebM (Up to 500 MB). Prototype local storage file simulation.</p>
                        <div class="mt-3 flex items-center justify-center gap-2">
                            <label class="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold cursor-pointer shadow-sm">
                                <i data-lucide="upload" class="w-3.5 h-3.5 inline mr-1"></i> Upload Video
                                <input type="file" accept="video/*" class="hidden" onchange="simulateUpload(this, 'video-filename')" />
                            </label>
                        </div>
                        <div class="mt-2 font-mono text-[11px] text-slate-600" id="video-filename">
                            Current File: <span class="font-bold text-slate-900">${targetLesson.file || 'gold_loan_mastery.mp4'}</span>
                        </div>
                    </div>

                    <div id="pdf-upload-section" class="${targetLesson.type === 'PDF' ? '' : 'hidden'}">
                        <i data-lucide="file-text" class="w-10 h-10 text-amber-500 mx-auto mb-2"></i>
                        <h3 class="font-bold text-slate-800 text-sm">PDF Document Upload</h3>
                        <p class="text-slate-500 text-xs mt-0.5">Upload policy manuals, compliance checklists, or study guides.</p>
                        <div class="mt-3 flex items-center justify-center gap-2">
                            <label class="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold cursor-pointer shadow-sm">
                                <i data-lucide="upload" class="w-3.5 h-3.5 inline mr-1"></i> Upload PDF
                                <input type="file" accept=".pdf" class="hidden" onchange="simulateUpload(this, 'pdf-filename')" />
                            </label>
                        </div>
                        <div class="mt-2 font-mono text-[11px] text-slate-600" id="pdf-filename">
                            Current File: <span class="font-bold text-slate-900">${targetLesson.file || 'curriculum_policy_v2.pdf'}</span>
                        </div>
                    </div>

                    <div id="text-editor-section" class="${targetLesson.type === 'TEXT' ? '' : 'hidden'} text-left">
                        <label class="block font-semibold text-slate-700 mb-1">Rich Text Article Content</label>
                        <textarea rows="6" class="w-full p-3 bg-white border border-slate-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Write or paste rich instructional text and markdown here..."></textarea>
                    </div>
                </div>

                <!-- Learning Objectives -->
                <div>
                    <div class="flex items-center justify-between mb-1">
                        <label class="font-semibold text-slate-700">Learning Objectives</label>
                        <button type="button" onclick="addListItem('objectives-list', 'New learning objective')" class="text-blue-600 font-bold hover:underline">+ Add Objective</button>
                    </div>
                    <div id="objectives-list" class="space-y-2">
                        ${(targetLesson.objectives || ["Understand core value proposition", "Identify customer needs"]).map(obj => `
                            <div class="flex items-center gap-2">
                                <input type="text" value="${obj}" class="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs" />
                                <button type="button" onclick="this.parentElement.remove()" class="text-slate-400 hover:text-rose-500 p-1">
                                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Key Takeaways -->
                <div>
                    <div class="flex items-center justify-between mb-1">
                        <label class="font-semibold text-slate-700">Key Takeaways</label>
                        <button type="button" onclick="addListItem('takeaways-list', 'Key operational takeaway')" class="text-blue-600 font-bold hover:underline">+ Add Takeaway</button>
                    </div>
                    <div id="takeaways-list" class="space-y-2">
                        ${(targetLesson.takeaways || ["Always verify KYC before appraisal"]).map(tak => `
                            <div class="flex items-center gap-2">
                                <input type="text" value="${tak}" class="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs" />
                                <button type="button" onclick="this.parentElement.remove()" class="text-slate-400 hover:text-rose-500 p-1">
                                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Bottom Buttons -->
                <div class="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                    <button type="button" onclick="window.adminStore.navigate('course-builder', { courseId: '${course.id}' })" class="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition">
                        Cancel
                    </button>
                    <button type="submit" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-sm transition">
                        Save Lesson
                    </button>
                </div>
            </form>
        </div>
    </div>
    `;
}

function toggleLessonTypeFields() {
    const type = document.getElementById("lesson-type-select").value;
    document.getElementById("video-upload-section").classList.toggle("hidden", type !== "VIDEO");
    document.getElementById("pdf-upload-section").classList.toggle("hidden", type !== "PDF");
    document.getElementById("text-editor-section").classList.toggle("hidden", type !== "TEXT");
    lucide.createIcons();
}

function simulateUpload(input, targetElId) {
    if (input.files && input.files[0]) {
        document.getElementById(targetElId).innerHTML = `Uploaded: <strong class="text-emerald-700">${input.files[0].name}</strong> (${(input.files[0].size / (1024*1024)).toFixed(1)} MB)`;
        showToast(`File "${input.files[0].name}" attached`, "file-check");
    }
}

function addListItem(containerId, defaultValue) {
    const container = document.getElementById(containerId);
    const div = document.createElement("div");
    div.className = "flex items-center gap-2";
    div.innerHTML = `
        <input type="text" value="${defaultValue}" class="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs" />
        <button type="button" onclick="this.parentElement.remove()" class="text-slate-400 hover:text-rose-500 p-1">
            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
        </button>
    `;
    container.appendChild(div);
    lucide.createIcons();
}

function handleSaveLesson(e, courseId, moduleId, lessonId) {
    e.preventDefault();
    const title = document.getElementById("lesson-title-input").value;
    const type = document.getElementById("lesson-type-select").value;
    const duration = document.getElementById("lesson-duration-input").value;

    showToast(`Lesson "${title}" saved successfully!`, "check-circle");
    window.adminStore.navigate("course-builder", { courseId });
}

// SCREEN 8: QUIZ BUILDER
function renderQuizBuilderScreen(store) {
    const quiz = store.getQuizById(store.editingQuizId);
    const questions = quiz.questions || [];

    return `
    <div class="space-y-6 fade-in max-w-4xl mx-auto">
        <!-- Back Navigation & Breadcrumb -->
        <div class="flex items-center gap-2 text-xs text-slate-500">
            <button onclick="window.adminStore.goBack()" class="hover:text-slate-900 font-semibold flex items-center gap-1">
                <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
                <span>Course Builder</span>
            </button>
            <span>/</span>
            <span class="text-slate-900 font-bold">${quiz.title}</span>
        </div>

        <!-- Quiz Properties Card -->
        <div class="admin-card p-6">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div>
                    <h1 class="text-xl font-bold text-slate-900">Quiz Builder</h1>
                    <p class="text-xs text-slate-500">Create multiple choice knowledge assessments, scoring rules, and explanations.</p>
                </div>
                <button onclick="addNewQuestionToQuiz()" class="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition">
                    <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                    <span>+ Add Question</span>
                </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div class="sm:col-span-2">
                    <label class="block font-semibold text-slate-700 mb-1">Quiz Name</label>
                    <input type="text" id="quiz-title-input" value="${quiz.title}" class="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                </div>
                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Passing Score (%)</label>
                    <input type="number" id="quiz-passing-score" value="${quiz.passingScore || 70}" class="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                </div>
            </div>
        </div>

        <!-- Questions List -->
        <div class="space-y-4" id="quiz-questions-container">
            ${questions.map((q, idx) => `
                <div class="admin-card p-5 border-l-4 border-l-purple-600 question-block" data-qid="${q.id}">
                    <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                        <div class="flex items-center gap-2">
                            <span class="px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-bold text-[11px] uppercase">QUESTION ${idx + 1}</span>
                        </div>
                        <div class="flex items-center gap-1">
                            <button onclick="this.closest('.question-block').remove(); showToast('Question deleted');" class="p-1 text-rose-500 hover:bg-rose-50 rounded">
                                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>
                    </div>

                    <div class="space-y-3 text-xs">
                        <div>
                            <label class="block font-semibold text-slate-700 mb-1">Question Prompt</label>
                            <input type="text" value="${q.text}" class="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            ${q.options.map((opt, optIdx) => `
                                <div>
                                    <label class="block font-semibold text-slate-500 mb-1 text-[11px]">Option ${String.fromCharCode(65 + optIdx)}</label>
                                    <div class="flex items-center gap-2">
                                        <input type="radio" name="correct_ans_${q.id}" ${q.correctAnswerIndex === optIdx ? 'checked' : ''} class="w-4 h-4 text-purple-600" title="Mark as correct answer" />
                                        <input type="text" value="${opt}" class="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-800 text-xs" />
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <div class="pt-2">
                            <label class="block font-semibold text-slate-700 mb-1">Correct Answer & Explanation</label>
                            <textarea rows="2" class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none">${q.explanation || ''}</textarea>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>

        <!-- Action Footer -->
        <div class="pt-4 flex items-center justify-end gap-3">
            <button onclick="window.adminStore.goBack()" class="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl text-xs transition">
                Cancel
            </button>
            <button onclick="handleSaveQuizComplete('${quiz.id}')" class="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5">
                <i data-lucide="check" class="w-4 h-4"></i>
                <span>Save Quiz</span>
            </button>
        </div>
    </div>
    `;
}

function addNewQuestionToQuiz() {
    const container = document.getElementById("quiz-questions-container");
    const count = container.querySelectorAll(".question-block").length + 1;
    const qid = `Q_NEW_${Date.now()}`;

    const div = document.createElement("div");
    div.className = "admin-card p-5 border-l-4 border-l-purple-600 question-block";
    div.dataset.qid = qid;
    div.innerHTML = `
        <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <span class="px-2 py-0.5 rounded bg-purple-100 text-purple-700 font-bold text-[11px] uppercase">QUESTION ${count}</span>
            <button onclick="this.closest('.question-block').remove(); showToast('Question deleted');" class="p-1 text-rose-500 hover:bg-rose-50 rounded">
                <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
        </div>
        <div class="space-y-3 text-xs">
            <div>
                <label class="block font-semibold text-slate-700 mb-1">Question Prompt</label>
                <input type="text" placeholder="Enter question text..." class="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none" />
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                    <label class="block font-semibold text-slate-500 mb-1 text-[11px]">Option A</label>
                    <div class="flex items-center gap-2">
                        <input type="radio" name="correct_ans_${qid}" checked class="w-4 h-4 text-purple-600" />
                        <input type="text" value="Option A choice" class="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-800 text-xs" />
                    </div>
                </div>
                <div>
                    <label class="block font-semibold text-slate-500 mb-1 text-[11px]">Option B</label>
                    <div class="flex items-center gap-2">
                        <input type="radio" name="correct_ans_${qid}" class="w-4 h-4 text-purple-600" />
                        <input type="text" value="Option B choice" class="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-800 text-xs" />
                    </div>
                </div>
                <div>
                    <label class="block font-semibold text-slate-500 mb-1 text-[11px]">Option C</label>
                    <div class="flex items-center gap-2">
                        <input type="radio" name="correct_ans_${qid}" class="w-4 h-4 text-purple-600" />
                        <input type="text" value="Option C choice" class="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-800 text-xs" />
                    </div>
                </div>
                <div>
                    <label class="block font-semibold text-slate-500 mb-1 text-[11px]">Option D</label>
                    <div class="flex items-center gap-2">
                        <input type="radio" name="correct_ans_${qid}" class="w-4 h-4 text-purple-600" />
                        <input type="text" value="Option D choice" class="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-medium text-slate-800 text-xs" />
                    </div>
                </div>
            </div>
            <div class="pt-2">
                <label class="block font-semibold text-slate-700 mb-1">Correct Answer & Explanation</label>
                <textarea rows="2" placeholder="Explain the rationale..." class="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-purple-500 focus:outline-none"></textarea>
            </div>
        </div>
    `;
    container.appendChild(div);
    lucide.createIcons();
    showToast("Question added", "plus");
}

function handleSaveQuizComplete(quizId) {
    const title = document.getElementById("quiz-title-input")?.value || "Quiz Assessment";
    const score = parseInt(document.getElementById("quiz-passing-score")?.value || 70);

    window.adminStore.saveQuiz({
        id: quizId,
        title,
        passingScore: score
    });

    showToast(`Quiz "${title}" successfully saved!`, "award");
    window.adminStore.goBack();
}

// SCREEN 9: ASSIGNMENTS WORKFLOW
function renderAssignmentsScreen(store) {
    return `
    <div class="space-y-6 fade-in">
        <!-- Page Header -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">Course Assignments</h1>
                <p class="text-sm text-slate-500 mt-0.5">Enroll cohorts by role, location, manager, or individual employee roster.</p>
            </div>
            <div>
                <button onclick="openAssignmentWizard()" class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition">
                    <i data-lucide="send" class="w-4 h-4"></i>
                    <span>+ Assign Course</span>
                </button>
            </div>
        </div>

        <!-- 4-Step Assignment Wizard Card -->
        <div id="assignment-wizard-card" class="admin-card p-6 border-2 border-blue-500/30">
            <div class="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                    <h2 class="text-base font-bold text-slate-900">New Course Assignment Workflow</h2>
                    <p class="text-xs text-slate-500">Configure target cohort and statutory completion deadline.</p>
                </div>
                <div class="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    <span>Step <span id="wizard-step-num">1</span> of 4</span>
                </div>
            </div>

            <form onsubmit="handleExecuteAssignment(event)" class="space-y-6 text-xs">
                <!-- STEP 1: SELECT COURSE -->
                <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span class="block font-bold text-slate-900 mb-2 uppercase text-[11px] tracking-wider">Step 1: Select Course</span>
                    <select id="asg-course-select" class="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500">
                        ${store.courses.map(c => `
                            <option value="${c.id}">${c.title} (${c.category} - ${c.type})</option>
                        `).join('')}
                    </select>
                </div>

                <!-- STEP 2: ASSIGN TO -->
                <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span class="block font-bold text-slate-900 mb-2 uppercase text-[11px] tracking-wider">Step 2: Assign To (Cohort Targeting)</span>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <label class="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-2.5 cursor-pointer hover:border-blue-400 transition">
                            <input type="radio" name="asg_target_type" value="All Employees" checked class="mt-0.5 text-blue-600" />
                            <div>
                                <span class="font-bold text-slate-900 block">All Employees</span>
                                <span class="text-[11px] text-slate-500">Entire company (200 employees)</span>
                            </div>
                        </label>

                        <label class="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-2.5 cursor-pointer hover:border-blue-400 transition">
                            <input type="radio" name="asg_target_type" value="Role" class="mt-0.5 text-blue-600" />
                            <div>
                                <span class="font-bold text-slate-900 block">Target by Role</span>
                                <span class="text-[11px] text-slate-500">RM, TBM, ABM, RBH</span>
                            </div>
                        </label>

                        <label class="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-2.5 cursor-pointer hover:border-blue-400 transition">
                            <input type="radio" name="asg_target_type" value="Location" class="mt-0.5 text-blue-600" />
                            <div>
                                <span class="font-bold text-slate-900 block">Target Location</span>
                                <span class="text-[11px] text-slate-500">Bangalore, Delhi, Mumbai, Hyd</span>
                            </div>
                        </label>

                        <label class="p-3 bg-white border border-slate-200 rounded-xl flex items-start gap-2.5 cursor-pointer hover:border-blue-400 transition">
                            <input type="radio" name="asg_target_type" value="Individual Employees" class="mt-0.5 text-blue-600" />
                            <div>
                                <span class="font-bold text-slate-900 block">Individual Roster</span>
                                <span class="text-[11px] text-slate-500">Select specific learners</span>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- STEP 3: DEADLINE -->
                <div class="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span class="block font-bold text-slate-900 mb-2 uppercase text-[11px] tracking-wider">Step 3: Completion Deadline</span>
                    <div class="max-w-xs">
                        <input type="date" id="asg-deadline-input" value="2026-09-30" required class="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                    </div>
                </div>

                <!-- STEP 4: REVIEW & CONFIRM -->
                <div class="p-4 bg-blue-50/70 border border-blue-200 rounded-xl">
                    <span class="block font-bold text-blue-950 mb-1 uppercase text-[11px] tracking-wider">Step 4: Review Summary</span>
                    <div class="text-xs text-blue-900 space-y-1">
                        <div>Target Cohort: <strong id="asg-review-cohort">42 Relationship Managers</strong></div>
                        <div>Target Deadline: <strong id="asg-review-date">30 Sep 2026</strong></div>
                    </div>
                </div>

                <!-- Submit Button -->
                <div class="flex items-center justify-end gap-3 pt-2">
                    <button type="submit" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-sm transition flex items-center gap-2">
                        <i data-lucide="send" class="w-4 h-4"></i>
                        <span>Assign Course</span>
                    </button>
                </div>
            </form>
        </div>

        <!-- ASSIGNMENT HISTORY TABLE -->
        <div class="admin-card p-6">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-base font-bold text-slate-900">ASSIGNMENT HISTORY</h2>
                    <p class="text-xs text-slate-500">Record of cohort dispatches, target counts, and statuses.</p>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                    <thead>
                        <tr class="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                            <th class="pb-3">Course</th>
                            <th class="pb-3">Assigned To</th>
                            <th class="pb-3 text-center">Employees</th>
                            <th class="pb-3 text-center">Deadline</th>
                            <th class="pb-3 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50 font-medium text-slate-700">
                        ${store.assignments.map(asg => `
                            <tr class="hover:bg-slate-50/70 transition">
                                <td class="py-3.5 font-semibold text-slate-900">${asg.courseTitle}</td>
                                <td class="py-3.5 text-slate-600">${asg.assignedToLabel}</td>
                                <td class="py-3.5 text-center font-bold text-slate-900">${asg.employeeCount}</td>
                                <td class="py-3.5 text-center font-mono text-slate-600">${asg.deadline}</td>
                                <td class="py-3.5 text-right">
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${asg.status === 'Active' ? 'badge-active' : 'badge-published'}">
                                        ${asg.status}
                                    </span>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `;
}

function openAssignmentWizard() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById("assignment-wizard-card")?.scrollIntoView({ behavior: 'smooth' });
}

function handleExecuteAssignment(e) {
    e.preventDefault();
    const courseSelect = document.getElementById("asg-course-select");
    const courseId = courseSelect.value;
    const courseTitle = courseSelect.options[courseSelect.selectedIndex].text.split(' (')[0];
    const targetType = document.querySelector("input[name='asg_target_type']:checked")?.value || "All Employees";
    const deadline = document.getElementById("asg-deadline-input")?.value || "2026-09-30";

    let label = "All 200 Employees (Company-Wide)";
    let count = 200;
    if (targetType === "Role") {
        label = "All Relationship Managers (Bangalore & Delhi)";
        count = 42;
    } else if (targetType === "Location") {
        label = "All Bangalore & Mumbai Branches";
        count = 75;
    } else if (targetType === "Individual Employees") {
        label = "Individual Batch (25 Employees)";
        count = 25;
    }

    window.adminStore.createAssignment({
        courseId,
        courseTitle,
        assignedToLabel: label,
        targetType,
        employeeCount: count,
        deadline
    });

    showToast(`Course successfully assigned to ${label}!`, "send");
}

// SCREEN 10: REPORTS
function renderReportsScreen(store) {
    return `
    <div class="space-y-6 fade-in">
        <!-- Page Header -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">Reports & Executive Analytics</h1>
                <p class="text-sm text-slate-500 mt-0.5">Export capability audit data, assessment metrics, and completion logs.</p>
            </div>
            <div>
                <button onclick="triggerExcelExport()" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition">
                    <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
                    <span>Export Excel (.xlsx)</span>
                </button>
            </div>
        </div>

        <!-- Filters Bar -->
        <div class="admin-card p-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                <div>
                    <label class="block text-[11px] font-semibold text-slate-500 mb-1">Course</label>
                    <select class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium">
                        <option value="">All Courses</option>
                        ${store.courses.map(c => `<option value="${c.id}">${c.title}</option>`).join('')}
                    </select>
                </div>
                <div>
                    <label class="block text-[11px] font-semibold text-slate-500 mb-1">Role</label>
                    <select class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium">
                        <option value="">All Roles</option>
                        <option>Relationship Manager</option>
                        <option>TBM</option>
                        <option>ABM</option>
                        <option>RBH</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[11px] font-semibold text-slate-500 mb-1">Location</label>
                    <select class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium">
                        <option value="">All Locations</option>
                        <option>Bangalore</option>
                        <option>Delhi</option>
                        <option>Mumbai</option>
                        <option>Hyderabad</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[11px] font-semibold text-slate-500 mb-1">Manager</label>
                    <select class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium">
                        <option value="">All Managers</option>
                        <option>Amit Kumar</option>
                        <option>Priya Sharma</option>
                        <option>Raj Kumar</option>
                    </select>
                </div>
                <div>
                    <label class="block text-[11px] font-semibold text-slate-500 mb-1">Date Range</label>
                    <select class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium">
                        <option>Last 30 Days (Aug 2026)</option>
                        <option>Q3 2026</option>
                        <option>Year to Date (2026)</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Top Metrics Row -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="admin-card p-4">
                <span class="text-xs font-semibold text-slate-500 uppercase">Assigned Total</span>
                <div class="text-2xl font-extrabold text-slate-900 mt-1">700</div>
            </div>
            <div class="admin-card p-4">
                <span class="text-xs font-semibold text-slate-500 uppercase">Started</span>
                <div class="text-2xl font-extrabold text-blue-600 mt-1">600</div>
            </div>
            <div class="admin-card p-4">
                <span class="text-xs font-semibold text-slate-500 uppercase">Completed</span>
                <div class="text-2xl font-extrabold text-emerald-600 mt-1">505</div>
            </div>
            <div class="admin-card p-4">
                <span class="text-xs font-semibold text-slate-500 uppercase">Average Score</span>
                <div class="text-2xl font-extrabold text-slate-900 mt-1">84.5%</div>
            </div>
        </div>

        <!-- COURSE PERFORMANCE REPORT TABLE -->
        <div class="admin-card p-6">
            <h2 class="text-base font-bold text-slate-900 mb-3">COURSE PERFORMANCE SUMMARY</h2>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                    <thead>
                        <tr class="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                            <th class="pb-3">Course</th>
                            <th class="pb-3 text-center">Assigned</th>
                            <th class="pb-3 text-center">Started</th>
                            <th class="pb-3 text-center">Completed</th>
                            <th class="pb-3 text-center">Completion %</th>
                            <th class="pb-3 text-right">Avg Score</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50 font-medium text-slate-700">
                        ${store.courses.map(c => `
                            <tr class="hover:bg-slate-50/70 transition">
                                <td class="py-3 font-semibold text-slate-900">${c.title}</td>
                                <td class="py-3 text-center">${c.assignedCount}</td>
                                <td class="py-3 text-center">${c.startedCount}</td>
                                <td class="py-3 text-center font-semibold text-emerald-600">${c.completedCount}</td>
                                <td class="py-3 text-center font-bold">${c.completionPercentage}%</td>
                                <td class="py-3 text-right font-bold text-slate-900">${c.avgScore ? c.avgScore + '%' : '—'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- EMPLOYEE PERFORMANCE REPORT TABLE -->
        <div class="admin-card p-6">
            <h2 class="text-base font-bold text-slate-900 mb-3">EMPLOYEE PERFORMANCE SUMMARY</h2>
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                    <thead>
                        <tr class="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                            <th class="pb-3">Employee</th>
                            <th class="pb-3 text-center">Courses</th>
                            <th class="pb-3 text-center">Completed</th>
                            <th class="pb-3 text-center">Avg Score</th>
                            <th class="pb-3 text-right">Overall Progress</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50 font-medium text-slate-700">
                        ${store.employees.map(e => `
                            <tr class="hover:bg-slate-50/70 transition">
                                <td class="py-3 font-semibold text-slate-900">${e.name} (${e.id}) - ${e.role}</td>
                                <td class="py-3 text-center">${e.coursesAssigned}</td>
                                <td class="py-3 text-center font-semibold text-emerald-600">${e.coursesCompleted}</td>
                                <td class="py-3 text-center font-bold">${e.avgScore ? e.avgScore + '%' : '—'}</td>
                                <td class="py-3 text-right font-bold text-blue-600">${e.progress}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `;
}

function triggerExcelExport() {
    showToast("Generating SkillUp_LMS_Audit_Report_2026.xlsx...", "file-spreadsheet");
    setTimeout(() => {
        showToast("Report download triggered successfully!", "download");
    }, 1200);
}

// SCREEN 11: NOTIFICATIONS
function renderNotificationsScreen(store) {
    return `
    <div class="space-y-6 fade-in max-w-4xl mx-auto">
        <!-- Page Header -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">Notifications & Escalations</h1>
                <p class="text-sm text-slate-500 mt-0.5">Automated compliance triggers, non-starter nudges, and assessment failure alerts.</p>
            </div>
            <div>
                <button onclick="showToast('Dispatched automated digest to all managers');" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition">
                    <i data-lucide="send" class="w-3.5 h-3.5"></i>
                    <span>Broadcast Manager Digest</span>
                </button>
            </div>
        </div>

        <div class="space-y-4">
            ${store.notifications.map(notif => `
                <div class="admin-card p-5 border-l-4 ${notif.severity === 'high' ? 'border-l-rose-600 bg-rose-50/20' : notif.severity === 'medium' ? 'border-l-amber-500 bg-amber-50/20' : 'border-l-blue-500'}">
                    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div class="flex items-start gap-3">
                            <div class="w-9 h-9 rounded-xl ${notif.severity === 'high' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'} flex items-center justify-center shrink-0 mt-0.5">
                                <i data-lucide="alert-triangle" class="w-5 h-5"></i>
                            </div>
                            <div>
                                <div class="flex items-center gap-2">
                                    <h2 class="text-sm font-bold text-slate-900">${notif.title}</h2>
                                    <span class="px-2 py-0.5 rounded text-[10px] font-bold uppercase ${notif.status === 'Reminders Dispatched' ? 'badge-published' : 'badge-draft'}">
                                        ${notif.status}
                                    </span>
                                </div>
                                <p class="text-xs text-slate-600 mt-1">${notif.message}</p>
                                <span class="text-[11px] text-slate-400 mt-1.5 inline-block">${notif.time}</span>
                            </div>
                        </div>

                        <div class="flex items-center gap-2 shrink-0">
                            <button onclick="alert('Viewing cohort list for: ${notif.title}');" class="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition">
                                View Cohort
                            </button>
                            <button onclick="window.adminStore.sendReminder('${notif.id}'); showToast('Automated reminders sent to ${notif.count} learners!');" class="px-3.5 py-1.5 bg-[#0A2540] hover:bg-slate-900 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5">
                                <i data-lucide="bell-ring" class="w-3.5 h-3.5"></i>
                                <span>Send Reminder</span>
                            </button>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
    `;
}

// SCREEN 12: SETTINGS
function renderSettingsScreen(store) {
    const s = store.settings;

    return `
    <div class="space-y-6 fade-in max-w-3xl mx-auto">
        <!-- Page Header -->
        <div>
            <h1 class="text-2xl font-bold text-slate-900">Settings</h1>
            <p class="text-sm text-slate-500 mt-0.5">Configure system defaults, passing thresholds, and administrator preferences.</p>
        </div>

        <!-- Admin Profile -->
        <div class="admin-card p-6">
            <h2 class="text-base font-bold text-slate-900 mb-3">Admin Profile</h2>
            <div class="flex items-center gap-4 mb-4">
                <div class="w-14 h-14 rounded-2xl bg-[#0A2540] text-white flex items-center justify-center text-lg font-bold">
                    ${store.adminUser.avatar}
                </div>
                <div>
                    <h3 class="text-base font-bold text-slate-900">${store.adminUser.name}</h3>
                    <p class="text-xs text-slate-500">${store.adminUser.role} &bull; ${store.adminUser.department}</p>
                    <span class="text-[11px] font-mono text-blue-600">${store.adminUser.email}</span>
                </div>
            </div>
        </div>

        <!-- Learning Defaults -->
        <div class="admin-card p-6">
            <h2 class="text-base font-bold text-slate-900 mb-3">Learning Defaults</h2>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Default Passing Score (%)</label>
                    <input type="number" id="settings-passing-score" value="${s.defaultPassingScore}" class="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <label class="block font-semibold text-slate-700 mb-1">Default Course Type</label>
                    <select id="settings-course-type" class="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500">
                        <option value="Mandatory" ${s.defaultCourseType === 'Mandatory' ? 'selected' : ''}>Mandatory</option>
                        <option value="Elective" ${s.defaultCourseType === 'Elective' ? 'selected' : ''}>Elective</option>
                    </select>
                </div>
            </div>
            <div class="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                <button onclick="handleSaveLearningSettings()" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs transition">
                    Save Defaults
                </button>
            </div>
        </div>

        <!-- Security -->
        <div class="admin-card p-6">
            <h2 class="text-base font-bold text-slate-900 mb-3">Security & Access</h2>
            <div class="space-y-3 text-xs">
                <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                        <span class="font-bold text-slate-900 block">Change Password</span>
                        <span class="text-slate-500 text-[11px]">Update administrator access passphrase</span>
                    </div>
                    <button onclick="alert('Password change dialog - prototype mode.');" class="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold">
                        Change
                    </button>
                </div>

                <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div>
                        <span class="font-bold text-slate-900 block">Reset Prototype Data</span>
                        <span class="text-slate-500 text-[11px]">Restore factory sample state for courses, quizzes, and employees</span>
                    </div>
                    <button onclick="if(confirm('Reset all sample data to defaults?')) { window.adminStore.resetToFactoryDefaults(); showToast('Reset to default sample data'); }" class="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold">
                        Reset Data
                    </button>
                </div>
            </div>
        </div>
    </div>
    `;
}

function handleSaveLearningSettings() {
    const score = parseInt(document.getElementById("settings-passing-score").value || 70);
    const type = document.getElementById("settings-course-type").value;
    window.adminStore.updateSettings({
        defaultPassingScore: score,
        defaultCourseType: type
    });
    showToast("Learning defaults updated successfully!", "check-circle");
}

// ----------------------------------------------------
// MAIN APP ROUTER & LAYOUT ENGINE
// ----------------------------------------------------

function renderApp() {
    const root = document.getElementById("app-root");
    if (!root) return;
    const store = window.adminStore;

    if (!store.isLoggedIn || store.currentRoute === "login") {
        root.innerHTML = renderLoginScreen();
        lucide.createIcons();
        return;
    }

    // Sidebar navigation active helper
    const activeRoute = store.currentRoute;
    const isEmpActive = activeRoute === 'employees' || activeRoute === 'employee-detail';
    const isCourseActive = activeRoute === 'courses' || activeRoute === 'course-builder' || activeRoute === 'lesson-editor' || activeRoute === 'quiz-builder';

    let mainContentHtml = "";
    switch (activeRoute) {
        case 'dashboard':
            mainContentHtml = renderDashboardScreen(store);
            break;
        case 'employees':
            mainContentHtml = renderEmployeesScreen(store);
            break;
        case 'employee-detail':
            mainContentHtml = renderEmployeeDetailScreen(store);
            break;
        case 'courses':
            mainContentHtml = renderCoursesScreen(store);
            break;
        case 'course-builder':
            mainContentHtml = renderCourseBuilderScreen(store);
            break;
        case 'lesson-editor':
            mainContentHtml = renderLessonEditorScreen(store);
            break;
        case 'quiz-builder':
            mainContentHtml = renderQuizBuilderScreen(store);
            break;
        case 'assignments':
            mainContentHtml = renderAssignmentsScreen(store);
            break;
        case 'reports':
            mainContentHtml = renderReportsScreen(store);
            break;
        case 'notifications':
            mainContentHtml = renderNotificationsScreen(store);
            break;
        case 'settings':
            mainContentHtml = renderSettingsScreen(store);
            break;
        default:
            mainContentHtml = renderDashboardScreen(store);
    }

    root.innerHTML = `
    <div class="min-h-screen flex bg-[#F8FAFC]">
        <!-- PERSISTENT LEFT SIDEBAR -->
        <aside class="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 select-none z-20">
            <div>
                <!-- Brand Header -->
                <div class="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-[#0A2540] text-white flex items-center justify-center shadow-sm">
                            <i data-lucide="graduation-cap" class="w-6 h-6 text-blue-400"></i>
                        </div>
                        <div>
                            <span class="text-lg font-black text-[#0A2540] tracking-tight">SKILLUP</span>
                            <div class="text-[10px] font-bold uppercase tracking-wider text-blue-600">Admin Portal</div>
                        </div>
                    </div>
                </div>

                <!-- Navigation Links -->
                <nav class="p-3.5 space-y-1">
                    <button onclick="window.adminStore.navigate('dashboard')" class="w-full sidebar-link ${activeRoute === 'dashboard' ? 'active' : ''}">
                        <i data-lucide="layout-dashboard" class="w-4 h-4"></i>
                        <span>Dashboard</span>
                    </button>

                    <button onclick="window.adminStore.navigate('employees')" class="w-full sidebar-link ${isEmpActive ? 'active' : ''}">
                        <i data-lucide="users" class="w-4 h-4"></i>
                        <span>Employees</span>
                    </button>

                    <button onclick="window.adminStore.navigate('courses')" class="w-full sidebar-link ${isCourseActive ? 'active' : ''}">
                        <i data-lucide="book-open" class="w-4 h-4"></i>
                        <span>Courses</span>
                    </button>

                    <button onclick="window.adminStore.navigate('assignments')" class="w-full sidebar-link ${activeRoute === 'assignments' ? 'active' : ''}">
                        <i data-lucide="send" class="w-4 h-4"></i>
                        <span>Assignments</span>
                    </button>

                    <button onclick="window.adminStore.navigate('reports')" class="w-full sidebar-link ${activeRoute === 'reports' ? 'active' : ''}">
                        <i data-lucide="bar-chart-3" class="w-4 h-4"></i>
                        <span>Reports</span>
                    </button>

                    <button onclick="window.adminStore.navigate('notifications')" class="w-full sidebar-link ${activeRoute === 'notifications' ? 'active' : ''}">
                        <div class="flex items-center justify-between w-full">
                            <div class="flex items-center gap-3">
                                <i data-lucide="bell" class="w-4 h-4"></i>
                                <span>Notifications</span>
                            </div>
                            <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                        </div>
                    </button>

                    <button onclick="window.adminStore.navigate('settings')" class="w-full sidebar-link ${activeRoute === 'settings' ? 'active' : ''}">
                        <i data-lucide="settings" class="w-4 h-4"></i>
                        <span>Settings</span>
                    </button>
                </nav>
            </div>

            <!-- Bottom of sidebar: Admin Profile & Logout -->
            <div class="p-4 border-t border-slate-100 bg-slate-50/60">
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2.5">
                        <div class="w-9 h-9 rounded-xl bg-[#0A2540] text-white flex items-center justify-center text-xs font-bold">
                            ${store.adminUser.avatar}
                        </div>
                        <div class="overflow-hidden">
                            <div class="text-xs font-bold text-slate-900 truncate">${store.adminUser.name}</div>
                            <div class="text-[10px] text-slate-500 truncate">${store.adminUser.role}</div>
                        </div>
                    </div>

                    <button onclick="window.adminStore.logout()" title="Sign Out" class="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition">
                        <i data-lucide="log-out" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        </aside>

        <!-- MAIN CONTENT AREA -->
        <main class="flex-1 flex flex-col min-w-0 overflow-y-auto">
            <!-- Top Header -->
            <header class="h-16 bg-white border-b border-slate-200/80 px-8 flex items-center justify-between shrink-0 sticky top-0 z-10">
                <div class="flex items-center gap-3">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-400">SkillUp LMS</span>
                    <span class="text-slate-300">/</span>
                    <span class="text-xs font-bold text-slate-800 uppercase tracking-wider capitalize">${activeRoute.replace('-', ' ')}</span>
                </div>

                <div class="flex items-center gap-4">
                    <div class="text-xs text-slate-500 font-medium">
                        Session: <span class="font-mono text-slate-900 font-bold">ADMIN001</span>
                    </div>
                    <div class="h-4 w-px bg-slate-200"></div>
                    <button onclick="window.adminStore.navigate('notifications')" class="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition">
                        <i data-lucide="bell" class="w-4 h-4"></i>
                        <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500"></span>
                    </button>
                </div>
            </header>

            <!-- Page Body -->
            <div class="p-8 flex-1">
                ${mainContentHtml}
            </div>
        </main>
    </div>

    <!-- MODAL 1: ADD EMPLOYEE -->
    <div id="add-employee-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl fade-in max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div>
                    <h3 class="text-base font-bold text-slate-900">Add New Employee</h3>
                    <p class="text-xs text-slate-500">Create a new employee master record with assigned learning permissions.</p>
                </div>
                <button onclick="closeAddEmployeeModal()" class="text-slate-400 hover:text-slate-600 p-1">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
            <form onsubmit="handleAddEmployeeSubmit(event)" class="space-y-3.5 text-xs">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">Employee ID <span class="text-rose-500">*</span></label>
                        <input type="text" id="new-emp-id" required placeholder="e.g. EMP009" class="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-mono font-bold text-blue-700 focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">Full Name <span class="text-rose-500">*</span></label>
                        <input type="text" id="new-emp-name" required placeholder="e.g. Rohan Verma" class="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">Email ID <span class="text-rose-500">*</span></label>
                        <input type="email" id="new-emp-email" required placeholder="rohan.verma@skillup.com" class="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">Mobile Number <span class="text-slate-400 font-normal">(Optional)</span></label>
                        <input type="tel" id="new-emp-phone" placeholder="+91 98765 00000" class="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">Designation / Role <span class="text-rose-500">*</span></label>
                        <select id="new-emp-role" class="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500">
                            <option value="Relationship Manager">Relationship Manager</option>
                            <option value="TBM">TBM (Territory Branch Mgr)</option>
                            <option value="ABM">ABM (Area Branch Mgr)</option>
                            <option value="RBH">RBH (Regional Head)</option>
                        </select>
                    </div>
                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">Operating Location <span class="text-rose-500">*</span></label>
                        <select id="new-emp-location" class="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500">
                            <option value="Bangalore">Bangalore</option>
                            <option value="Delhi">Delhi</option>
                            <option value="Mumbai">Mumbai</option>
                            <option value="Hyderabad">Hyderabad</option>
                        </select>
                    </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">Reporting Manager <span class="text-rose-500">*</span></label>
                        <select id="new-emp-manager" class="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500">
                            <option value="Amit Kumar">Amit Kumar</option>
                            <option value="Priya Sharma">Priya Sharma</option>
                            <option value="Raj Kumar">Raj Kumar</option>
                            <option value="Vikram Patel">Vikram Patel</option>
                        </select>
                    </div>
                    <div>
                        <label class="block font-semibold text-slate-700 mb-1">Employment Status <span class="text-rose-500">*</span></label>
                        <select id="new-emp-status" class="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-blue-500">
                            <option value="Active">Active Employee</option>
                            <option value="Inactive">Inactive / Separated</option>
                        </select>
                    </div>
                </div>

                <!-- SkillUp Access Toggle -->
                <div class="p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between">
                    <div>
                        <div class="font-bold text-slate-900">SkillUp Portal Access</div>
                        <div class="text-[11px] text-slate-500">Grant login rights and course curriculum participation.</div>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="new-emp-access" checked class="sr-only peer">
                        <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                </div>

                <div class="pt-3 flex justify-end gap-2 border-t border-slate-100">
                    <button type="button" onclick="closeAddEmployeeModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition">Cancel</button>
                    <button type="submit" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition">Create Employee</button>
                </div>
            </form>
        </div>
    </div>

    <!-- MODAL 2: BULK IMPORT EMPLOYEES -->
    <div id="bulk-import-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl fade-in max-h-[90vh] flex flex-col">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
                <div>
                    <h3 class="text-base font-bold text-slate-900">Bulk Import Employees</h3>
                    <p class="text-xs text-slate-500">Upload an employee roster CSV file to onboard or sync team master data.</p>
                </div>
                <button onclick="closeBulkImportModal()" class="text-slate-400 hover:text-slate-600 p-1">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>

            <!-- STEP 1: UPLOAD -->
            <div id="bulk-import-step-upload" class="space-y-4 text-xs py-2">
                <div class="border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl p-8 text-center transition bg-slate-50/50 flex flex-col items-center justify-center cursor-pointer" onclick="document.getElementById('csv-file-input').click()">
                    <div class="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                        <i data-lucide="upload-cloud" class="w-7 h-7"></i>
                    </div>
                    <h4 class="text-sm font-bold text-slate-900">Choose CSV file or drag & drop here</h4>
                    <p class="text-slate-500 text-xs mt-1">Standard SkillUp employee schema supported (.csv)</p>
                    <input type="file" id="csv-file-input" accept=".csv" class="hidden" onchange="handleCsvFileSelect(event)" />
                    <button type="button" class="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs shadow-sm transition">
                        Select CSV File
                    </button>
                </div>

                <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div>
                        <div class="font-bold text-slate-800">Need the official format?</div>
                        <div class="text-slate-500 text-[11px]">Download our pre-formatted template with all required columns and sample rows.</div>
                    </div>
                    <button type="button" onclick="downloadCsvTemplate()" class="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-xl flex items-center gap-1.5 transition">
                        <i data-lucide="download" class="w-3.5 h-3.5"></i>
                        <span>Download Template</span>
                    </button>
                </div>
            </div>

            <!-- STEP 2: VALIDATION & PREVIEW -->
            <div id="bulk-import-step-preview" class="space-y-4 text-xs flex-1 overflow-hidden flex flex-col hidden">
                <div class="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-100 shrink-0">
                    <div class="flex items-center gap-2">
                        <i data-lucide="file-spreadsheet" class="w-4 h-4 text-blue-600"></i>
                        <span id="import-file-name" class="font-bold text-slate-900">employees.csv</span>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-slate-200 text-slate-700" id="import-stat-total">0 rows</span>
                        <span class="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-emerald-100 text-emerald-800" id="import-stat-valid">0 valid</span>
                        <span class="px-2.5 py-0.5 rounded-full font-bold text-[11px] bg-rose-100 text-rose-800" id="import-stat-errors">0 errors</span>
                    </div>
                </div>

                <!-- Errors list if any -->
                <div id="import-errors-section" class="shrink-0 space-y-1.5 max-h-32 overflow-y-auto hidden">
                    <div class="text-[11px] font-bold uppercase tracking-wider text-rose-700">Rows requiring attention:</div>
                    <div id="import-errors-list" class="space-y-1"></div>
                </div>

                <!-- Preview table -->
                <div class="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
                    <table class="w-full text-left text-xs">
                        <thead class="sticky top-0 bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                            <tr>
                                <th class="py-2.5 px-3">Employee ID</th>
                                <th class="py-2.5 px-3">Name</th>
                                <th class="py-2.5 px-3">Email</th>
                                <th class="py-2.5 px-3">Role</th>
                                <th class="py-2.5 px-3">Location</th>
                                <th class="py-2.5 px-3">Employment</th>
                                <th class="py-2.5 px-3">SkillUp Access</th>
                            </tr>
                        </thead>
                        <tbody id="import-preview-tbody" class="divide-y divide-slate-100 font-medium text-slate-700"></tbody>
                    </table>
                </div>

                <div class="pt-3 flex items-center justify-between border-t border-slate-100 shrink-0">
                    <button type="button" onclick="openBulkImportModal()" class="text-slate-500 hover:text-slate-700 font-semibold flex items-center gap-1">
                        <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
                        <span>Upload Another File</span>
                    </button>
                    <div class="flex items-center gap-2">
                        <button type="button" onclick="closeBulkImportModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition">Cancel</button>
                        <button type="button" id="execute-import-btn" onclick="executeBulkImport()" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition">
                            Import Employees
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- MODAL 3: ACCESS & COURSE CONFIRMATION -->
    <div id="access-confirm-modal" class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 hidden">
        <div class="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl fade-in">
            <div class="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 class="text-base font-bold text-slate-900" id="access-modal-title">Confirm Access Action</h3>
                <button onclick="closeAccessModal()" class="text-slate-400 hover:text-slate-600 p-1">
                    <i data-lucide="x" class="w-4 h-4"></i>
                </button>
            </div>
            
            <div id="access-modal-message" class="mb-6"></div>

            <div class="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onclick="closeAccessModal()" class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition">
                    Cancel
                </button>
                <button type="button" id="access-modal-confirm-btn" onclick="confirmAccessModalAction()" class="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition">
                    Confirm
                </button>
            </div>
        </div>
    </div>
    `;

    lucide.createIcons();
}

// Subscribe to store updates
window.addEventListener("DOMContentLoaded", () => {
    window.adminStore.subscribe(() => {
        renderApp();
    });
    renderApp();
});
