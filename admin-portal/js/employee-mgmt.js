// SkillUp Enterprise Admin Portal - Employee Management Module
// Refined Milestone 2 Implementation: Master Data, CSV Bulk Import & Validation,
// Dual Status/Access Toggling, Course-Level Access Revocation & Audit Logs.

// ----------------------------------------------------
// 1. CSV TEMPLATE DOWNLOAD & PARSING LOGIC
// ----------------------------------------------------

function downloadCsvTemplate() {
    const csvContent = [
        "Employee ID,Full Name,Email ID,Mobile Number,Designation / Role,Operating Location,Reporting Manager,Employment Status,SkillUp Access",
        "EMP009,Rohan Verma,rohan.verma@skillup.com,+91 98765 43220,Relationship Manager,Bangalore,Amit Kumar,Active,Enabled",
        "EMP010,Kavita Nair,kavita.nair@skillup.com,+91 98765 43221,TBM,Mumbai,Raj Kumar,Active,Enabled",
        "EMP011,Manish Gupta,manish.gupta@skillup.com,+91 98765 43222,Relationship Manager,Delhi,Priya Sharma,Active,Enabled",
        "EMP012,Deepa Iyer,deepa.iyer@skillup.com,,Relationship Manager,Hyderabad,Vikram Patel,Active,Enabled"
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "SkillUp_Employee_Import_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded Employee CSV Template", "download");
}

let pendingImportData = null;

function parseAndValidateCSV(text) {
    const lines = text.split(/\r\n|\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length <= 1) {
        return {
            totalRows: 0,
            validRows: [],
            errors: [{ row: 0, id: "-", error: "The uploaded CSV file is empty or missing data rows." }]
        };
    }

    const headers = lines[0].split(",").map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows = lines.slice(1);

    const validRows = [];
    const errors = [];
    const seenIdsInCsv = new Set();
    const existingEmployeeIds = new Set(
        (window.adminStore.employees || []).map(e => (e.id || e.employeeId || "").toUpperCase())
    );

    rows.forEach((line, idx) => {
        const rowNum = idx + 2; // header is row 1
        // Parse CSV row respecting commas
        const cols = line.split(",").map(c => c.trim().replace(/^["']|["']$/g, ''));
        
        const empId = cols[0] || "";
        const fullName = cols[1] || "";
        const email = cols[2] || "";
        const mobile = cols[3] || "";
        const role = cols[4] || "";
        const location = cols[5] || "";
        const manager = cols[6] || "";
        const employmentStatus = cols[7] || "Active";
        const skillupAccess = cols[8] || "Enabled";

        const cleanId = empId.toUpperCase();
        const rowErrors = [];

        // Required field validation
        if (!empId) rowErrors.push("Missing Employee ID");
        if (!fullName) rowErrors.push("Missing Full Name");
        if (!email) rowErrors.push("Missing Email ID");
        if (!role) rowErrors.push("Missing Designation / Role");
        if (!location) rowErrors.push("Missing Operating Location");
        if (!manager) rowErrors.push("Missing Reporting Manager");

        // Email basic format check
        if (email && !/\S+@\S+\.\S+/.test(email)) {
            rowErrors.push("Invalid Email format");
        }

        // Employee ID Uniqueness checks
        if (cleanId) {
            if (seenIdsInCsv.has(cleanId)) {
                rowErrors.push(`Duplicate Employee ID "${cleanId}" within CSV`);
            } else if (existingEmployeeIds.has(cleanId)) {
                rowErrors.push(`Employee ID "${cleanId}" already exists in system`);
            } else {
                seenIdsInCsv.add(cleanId);
            }
        }

        // Employment Status check
        const normalizedEmpStatus = employmentStatus.toLowerCase() === "inactive" ? "Inactive" : "Active";
        const normalizedAccess = skillupAccess.toLowerCase() === "disabled" ? false : true;

        if (rowErrors.length > 0) {
            errors.push({
                row: rowNum,
                id: empId || "—",
                name: fullName || "—",
                error: rowErrors.join(", ")
            });
        } else {
            validRows.push({
                employeeId: cleanId,
                fullName: fullName,
                email: email,
                mobileNumber: mobile,
                role: role,
                location: location,
                manager: manager,
                employmentStatus: normalizedEmpStatus,
                skillupAccessEnabled: normalizedAccess
            });
        }
    });

    return {
        totalRows: rows.length,
        validRows,
        errors
    };
}

// ----------------------------------------------------
// 2. MODAL CONTROLS & EVENT HANDLERS
// ----------------------------------------------------

function openBulkImportModal() {
    pendingImportData = null;
    const modal = document.getElementById("bulk-import-modal");
    if (!modal) return;
    
    // Reset modal UI to upload step
    document.getElementById("bulk-import-step-upload").classList.remove("hidden");
    document.getElementById("bulk-import-step-preview").classList.add("hidden");
    const fileInput = document.getElementById("csv-file-input");
    if (fileInput) fileInput.value = "";
    
    modal.classList.remove("hidden");
    lucide.createIcons();
}

function closeBulkImportModal() {
    const modal = document.getElementById("bulk-import-modal");
    if (modal) modal.classList.add("hidden");
    pendingImportData = null;
}

function handleCsvFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        const result = parseAndValidateCSV(text);
        pendingImportData = result;
        showBulkImportPreview(result, file.name);
    };
    reader.readAsText(file);
}

function showBulkImportPreview(result, fileName) {
    document.getElementById("bulk-import-step-upload").classList.add("hidden");
    const previewContainer = document.getElementById("bulk-import-step-preview");
    previewContainer.classList.remove("hidden");

    // Populate Stats
    document.getElementById("import-file-name").textContent = fileName;
    document.getElementById("import-stat-total").textContent = `${result.totalRows} rows`;
    document.getElementById("import-stat-valid").textContent = `${result.validRows.length} valid`;
    document.getElementById("import-stat-errors").textContent = `${result.errors.length} errors`;

    const importBtn = document.getElementById("execute-import-btn");
    importBtn.disabled = result.validRows.length === 0;
    importBtn.textContent = `Import ${result.validRows.length} Valid Employee${result.validRows.length === 1 ? '' : 's'}`;

    // Populate Error summary if any
    const errorSection = document.getElementById("import-errors-section");
    const errorList = document.getElementById("import-errors-list");
    if (result.errors.length > 0) {
        errorSection.classList.remove("hidden");
        errorList.innerHTML = result.errors.map(err => `
            <div class="flex items-start gap-2 py-1.5 px-3 bg-rose-50 border border-rose-100 rounded-lg text-[11px] text-rose-800">
                <span class="font-bold text-rose-900 shrink-0">Row ${err.row} [${err.id}]:</span>
                <span class="flex-1">${err.error}</span>
            </div>
        `).join('');
    } else {
        errorSection.classList.add("hidden");
        errorList.innerHTML = "";
    }

    // Populate Valid rows preview table
    const tbody = document.getElementById("import-preview-tbody");
    if (result.validRows.length > 0) {
        tbody.innerHTML = result.validRows.slice(0, 10).map(r => `
            <tr class="hover:bg-slate-50 transition">
                <td class="py-2.5 px-3 font-mono font-bold text-blue-600">${r.employeeId}</td>
                <td class="py-2.5 px-3 font-semibold text-slate-900">${r.fullName}</td>
                <td class="py-2.5 px-3 text-slate-600">${r.email}</td>
                <td class="py-2.5 px-3 text-slate-600">${r.role}</td>
                <td class="py-2.5 px-3 text-slate-600">${r.location}</td>
                <td class="py-2.5 px-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${r.employmentStatus === 'Active' ? 'badge-active' : 'badge-inactive'}">
                        ${r.employmentStatus.toUpperCase()}
                    </span>
                </td>
                <td class="py-2.5 px-3">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${r.skillupAccessEnabled ? 'badge-enabled' : 'badge-disabled'}">
                        ${r.skillupAccessEnabled ? 'ENABLED' : 'DISABLED'}
                    </span>
                </td>
            </tr>
        `).join('');
        if (result.validRows.length > 10) {
            tbody.innerHTML += `
                <tr>
                    <td colspan="7" class="py-2.5 px-3 text-center text-xs text-slate-400 italic bg-slate-50">
                        ... and ${result.validRows.length - 10} more valid employees
                    </td>
                </tr>
            `;
        }
    } else {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="py-6 text-center text-xs text-rose-500 font-semibold">
                    No valid rows found to import. Please check errors above and revise CSV.
                </td>
            </tr>
        `;
    }

    lucide.createIcons();
}

function executeBulkImport() {
    if (!pendingImportData || !pendingImportData.validRows || pendingImportData.validRows.length === 0) return;
    const count = window.adminStore.bulkImportEmployees(pendingImportData.validRows);
    closeBulkImportModal();
    showToast(`${count} employees imported successfully into SkillUp directory.`, "check-circle");
}

// ----------------------------------------------------
// 3. ACCESS TOGGLE & COURSE ACCESS MODAL HANDLERS
// ----------------------------------------------------

let activeAccessAction = null; // { type: 'single'|'bulk'|'course', id, targetEnabled, courseId }

function openSingleAccessModal(employeeId, enableAccess) {
    const emp = window.adminStore.getEmployeeById(employeeId);
    if (!emp) return;

    activeAccessAction = {
        type: 'single',
        employeeId: employeeId,
        enableAccess: enableAccess
    };

    const modal = document.getElementById("access-confirm-modal");
    const titleEl = document.getElementById("access-modal-title");
    const msgEl = document.getElementById("access-modal-message");
    const confirmBtn = document.getElementById("access-modal-confirm-btn");

    if (enableAccess) {
        titleEl.textContent = `Enable SkillUp Access for ${emp.fullName}?`;
        msgEl.innerHTML = `
            <p class="text-slate-600 text-xs leading-relaxed">
                This employee will regain access to SkillUp using their existing account. Their previous course assignments, completion certificates, and learning history will remain available.
            </p>
        `;
        confirmBtn.className = "px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition";
        confirmBtn.textContent = "Enable Access";
    } else {
        titleEl.textContent = `Disable SkillUp Access for ${emp.fullName}?`;
        msgEl.innerHTML = `
            <p class="text-slate-600 text-xs leading-relaxed">
                This employee will no longer be able to log in or access SkillUp learning content. 
            </p>
            <div class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-medium flex items-center gap-2">
                <i data-lucide="shield-check" class="w-4 h-4 text-amber-600 shrink-0"></i>
                <span>Data Retention Guarantee: All employee records, progress, quiz results, and learning history will be safely retained.</span>
            </div>
        `;
        confirmBtn.className = "px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition";
        confirmBtn.textContent = "Disable Access";
    }

    modal.classList.remove("hidden");
    lucide.createIcons();
}

function openBulkAccessModal(enableAccess) {
    const selectedIds = Array.from(window.adminStore.selectedEmployeeIds);
    if (selectedIds.length === 0) return;

    activeAccessAction = {
        type: 'bulk',
        employeeIds: selectedIds,
        enableAccess: enableAccess
    };

    const modal = document.getElementById("access-confirm-modal");
    const titleEl = document.getElementById("access-modal-title");
    const msgEl = document.getElementById("access-modal-message");
    const confirmBtn = document.getElementById("access-modal-confirm-btn");

    if (enableAccess) {
        titleEl.textContent = `Enable SkillUp Access for ${selectedIds.length} Employees?`;
        msgEl.innerHTML = `
            <p class="text-slate-600 text-xs leading-relaxed">
                The selected ${selectedIds.length} employees will regain portal access. All historic learning tracks will remain intact.
            </p>
        `;
        confirmBtn.className = "px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition";
        confirmBtn.textContent = `Enable Access (${selectedIds.length})`;
    } else {
        titleEl.textContent = `Disable SkillUp Access for ${selectedIds.length} Employees?`;
        msgEl.innerHTML = `
            <p class="text-slate-600 text-xs leading-relaxed">
                The selected ${selectedIds.length} employees will no longer be able to log in to SkillUp.
            </p>
            <div class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-medium flex items-center gap-2">
                <i data-lucide="shield-check" class="w-4 h-4 text-amber-600 shrink-0"></i>
                <span>Data Retention Guarantee: Employee records and all progress history are preserved.</span>
            </div>
        `;
        confirmBtn.className = "px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition";
        confirmBtn.textContent = `Disable Access (${selectedIds.length})`;
    }

    modal.classList.remove("hidden");
    lucide.createIcons();
}

function openCourseAccessModal(employeeId, courseId, revoke) {
    const emp = window.adminStore.getEmployeeById(employeeId);
    const cp = emp && emp.courseProgress ? emp.courseProgress.find(c => c.courseId === courseId) : null;
    const courseTitle = cp ? cp.title : "this course";

    activeAccessAction = {
        type: 'course',
        employeeId: employeeId,
        courseId: courseId,
        revoke: revoke
    };

    const modal = document.getElementById("access-confirm-modal");
    const titleEl = document.getElementById("access-modal-title");
    const msgEl = document.getElementById("access-modal-message");
    const confirmBtn = document.getElementById("access-modal-confirm-btn");

    if (revoke) {
        titleEl.textContent = `Revoke Access to "${courseTitle}"?`;
        msgEl.innerHTML = `
            <p class="text-slate-600 text-xs leading-relaxed">
                ${emp.fullName} will no longer be able to continue this course curriculum. 
            </p>
            <div class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-medium flex items-center gap-2">
                <i data-lucide="shield-check" class="w-4 h-4 text-amber-600 shrink-0"></i>
                <span>Their current progress (${cp ? cp.progress : 0}%), quiz scores, and completion history will be retained.</span>
            </div>
        `;
        confirmBtn.className = "px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition";
        confirmBtn.textContent = "Revoke Course Access";
    } else {
        titleEl.textContent = `Restore Access to "${courseTitle}"?`;
        msgEl.innerHTML = `
            <p class="text-slate-600 text-xs leading-relaxed">
                ${emp.fullName} will regain access to this course and can continue learning from their previous progress of <strong>${cp ? cp.progress : 0}%</strong>.
            </p>
        `;
        confirmBtn.className = "px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition";
        confirmBtn.textContent = "Restore Course Access";
    }

    modal.classList.remove("hidden");
    lucide.createIcons();
}

function closeAccessModal() {
    const modal = document.getElementById("access-confirm-modal");
    if (modal) modal.classList.add("hidden");
    activeAccessAction = null;
}

function confirmAccessModalAction() {
    if (!activeAccessAction) return;

    if (activeAccessAction.type === 'single') {
        window.adminStore.setEmployeeSkillUpAccess(activeAccessAction.employeeId, activeAccessAction.enableAccess);
        showToast(activeAccessAction.enableAccess ? "SkillUp access enabled." : "SkillUp access disabled.", activeAccessAction.enableAccess ? "shield-check" : "shield-alert");
    } else if (activeAccessAction.type === 'bulk') {
        window.adminStore.bulkSetSkillUpAccess(activeAccessAction.employeeIds, activeAccessAction.enableAccess);
        showToast(activeAccessAction.enableAccess ? "SkillUp access enabled for selected employees." : "SkillUp access disabled for selected employees.", "check-circle");
    } else if (activeAccessAction.type === 'course') {
        if (activeAccessAction.revoke) {
            window.adminStore.revokeCourseAccess(activeAccessAction.employeeId, activeAccessAction.courseId);
            showToast("Course access revoked. Historic progress preserved.", "slash");
        } else {
            window.adminStore.restoreCourseAccess(activeAccessAction.employeeId, activeAccessAction.courseId);
            showToast("Course access restored.", "refresh-cw");
        }
    }

    closeAccessModal();
}

// ----------------------------------------------------
// 4. SCREEN 3: EMPLOYEES DIRECTORY
// ----------------------------------------------------

function renderEmployeesScreen(store) {
    const selectedCount = store.selectedEmployeeIds.size;
    const allIds = store.employees.map(e => e.id);
    const isAllSelected = allIds.length > 0 && selectedCount === allIds.length;

    return `
    <div class="space-y-6 fade-in">
        <!-- Page Header & Action Bar -->
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">Employees</h1>
                <p class="text-sm text-slate-500 mt-0.5">Enterprise directory, capability progress, and learning access management.</p>
            </div>
            <div class="flex items-center gap-2.5 flex-wrap">
                <!-- 1. Download CSV Template -->
                <button onclick="downloadCsvTemplate()" class="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition">
                    <i data-lucide="download" class="w-4 h-4 text-slate-500"></i>
                    <span>Download CSV Template</span>
                </button>

                <!-- 2. Bulk Import -->
                <button onclick="openBulkImportModal()" class="px-3.5 py-2.5 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition">
                    <i data-lucide="upload-cloud" class="w-4 h-4 text-blue-600"></i>
                    <span>Bulk Import</span>
                </button>

                <!-- 3. Add Employee -->
                <button onclick="openAddEmployeeModal()" class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition">
                    <i data-lucide="user-plus" class="w-4 h-4"></i>
                    <span>+ Add Employee</span>
                </button>
            </div>
        </div>

        <!-- Filter & Search Toolbar -->
        <div class="admin-card p-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div class="lg:col-span-2 relative">
                    <i data-lucide="search" class="w-4 h-4 text-slate-400 absolute left-3.5 top-3"></i>
                    <input type="text" id="employee-search-input" onkeyup="filterEmployeesTable()"
                        placeholder="Search by Employee ID, Name, or Email..."
                        class="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition font-medium" />
                </div>

                <div>
                    <select id="employee-filter-role" onchange="filterEmployeesTable()" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">All Roles</option>
                        <option value="Relationship Manager">Relationship Manager</option>
                        <option value="TBM">TBM</option>
                        <option value="ABM">ABM</option>
                        <option value="RBH">RBH</option>
                    </select>
                </div>

                <div>
                    <select id="employee-filter-location" onchange="filterEmployeesTable()" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">All Locations</option>
                        <option value="Bangalore">Bangalore</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Mumbai">Mumbai</option>
                        <option value="Hyderabad">Hyderabad</option>
                    </select>
                </div>

                <div>
                    <select id="employee-filter-emp-status" onchange="filterEmployeesTable()" class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">All Employment Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Bulk Selection Action Bar -->
        ${selectedCount > 0 ? `
            <div class="bg-[#0A2540] text-white p-3.5 px-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md fade-in">
                <div class="flex items-center gap-3">
                    <span class="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">${selectedCount}</span>
                    <span class="text-xs font-semibold tracking-wide">${selectedCount} employee${selectedCount === 1 ? '' : 's'} selected</span>
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                    <button onclick="openBulkAccessModal(true)" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition">
                        <i data-lucide="shield-check" class="w-3.5 h-3.5"></i>
                        <span>Enable Access</span>
                    </button>
                    <button onclick="openBulkAccessModal(false)" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition">
                        <i data-lucide="shield-alert" class="w-3.5 h-3.5"></i>
                        <span>Disable Access</span>
                    </button>
                    <button onclick="window.adminStore.clearEmployeeSelection()" class="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-medium rounded-lg transition">
                        Deselect All
                    </button>
                </div>
            </div>
        ` : ''}

        <!-- Employee Table -->
        <div class="admin-card overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs" id="employees-table">
                    <thead>
                        <tr class="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                            <th class="py-3.5 px-4 w-10">
                                <input type="checkbox" ${isAllSelected ? 'checked' : ''} onchange="window.adminStore.selectAllEmployees(${JSON.stringify(allIds)})" class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" />
                            </th>
                            <th class="py-3.5 px-4">Employee ID</th>
                            <th class="py-3.5 px-4">Employee</th>
                            <th class="py-3.5 px-4">Role</th>
                            <th class="py-3.5 px-4">Location</th>
                            <th class="py-3.5 px-4">Manager</th>
                            <th class="py-3.5 px-4">Progress</th>
                            <th class="py-3.5 px-4 text-center">Courses</th>
                            <th class="py-3.5 px-4">Employment</th>
                            <th class="py-3.5 px-4">SkillUp Access</th>
                            <th class="py-3.5 px-4 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100 font-medium text-slate-700" id="employees-tbody">
                        ${store.employees.map(emp => {
                            const isSelected = store.selectedEmployeeIds.has(emp.id);
                            return `
                            <tr class="hover:bg-slate-50/70 transition cursor-pointer ${isSelected ? 'bg-blue-50/40' : ''}" onclick="handleEmployeeRowClick(event, '${emp.id}')">
                                <td class="py-3.5 px-4" onclick="event.stopPropagation()">
                                    <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="window.adminStore.toggleSelectEmployee('${emp.id}')" class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" />
                                </td>
                                <td class="py-3.5 px-4 font-mono font-bold text-blue-600">${emp.employeeId || emp.id}</td>
                                <td class="py-3.5 px-4 font-semibold text-slate-900">
                                    <div class="flex items-center gap-2.5">
                                        <div class="w-8 h-8 rounded-full ${emp.avatarBg || 'bg-blue-600'} text-white flex items-center justify-center text-xs font-bold shrink-0">
                                            ${(emp.fullName || emp.name).split(' ').map(n=>n[0]).join('')}
                                        </div>
                                        <div>
                                            <div class="text-slate-900">${emp.fullName || emp.name}</div>
                                            <div class="text-[11px] text-slate-400 font-normal">${emp.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td class="py-3.5 px-4 text-slate-600">${emp.role}</td>
                                <td class="py-3.5 px-4 text-slate-600">${emp.location}</td>
                                <td class="py-3.5 px-4 text-slate-600">${emp.manager}</td>
                                <td class="py-3.5 px-4 w-32">
                                    <div class="flex items-center gap-2">
                                        <div class="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                            <div class="bg-blue-600 h-1.5 rounded-full" style="width: ${emp.progress}%"></div>
                                        </div>
                                        <span class="text-[11px] font-bold text-slate-700">${emp.progress}%</span>
                                    </div>
                                </td>
                                <td class="py-3.5 px-4 text-center font-bold text-slate-900">${emp.coursesAssigned}</td>
                                <td class="py-3.5 px-4">
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${emp.employmentStatus === 'Active' ? 'badge-active' : 'badge-inactive'}">
                                        ${emp.employmentStatus || 'Active'}
                                    </span>
                                </td>
                                <td class="py-3.5 px-4">
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${emp.skillupAccessEnabled ? 'badge-enabled' : 'badge-disabled'}">
                                        ${emp.skillupAccessEnabled ? 'ENABLED' : 'DISABLED'}
                                    </span>
                                </td>
                                <td class="py-3.5 px-4 text-right" onclick="event.stopPropagation()">
                                    <button onclick="window.adminStore.navigate('employee-detail', { employeeId: '${emp.id}' })" class="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-lg text-xs font-semibold transition">
                                        View
                                    </button>
                                </td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    `;
}

function handleEmployeeRowClick(event, empId) {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'BUTTON') return;
    window.adminStore.navigate('employee-detail', { employeeId: empId });
}

function filterEmployeesTable() {
    const q = (document.getElementById("employee-search-input")?.value || "").toLowerCase();
    const role = (document.getElementById("employee-filter-role")?.value || "").toLowerCase();
    const location = (document.getElementById("employee-filter-location")?.value || "").toLowerCase();
    const empStatus = (document.getElementById("employee-filter-emp-status")?.value || "").toLowerCase();

    const rows = document.querySelectorAll("#employees-tbody tr");
    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        const matchesQ = !q || text.includes(q);
        const matchesRole = !role || text.includes(role);
        const matchesLoc = !location || text.includes(location);
        const matchesStatus = !empStatus || text.includes(empStatus);

        row.style.display = (matchesQ && matchesRole && matchesLoc && matchesStatus) ? "" : "none";
    });
}

// ----------------------------------------------------
// 5. SCREEN 4: EMPLOYEE DETAIL WITH AUDIT LOG & REVOKE
// ----------------------------------------------------

function renderEmployeeDetailScreen(store) {
    const emp = store.getEmployeeById(store.selectedEmployeeId);
    const auditLogs = store.getAuditLogsForEmployee(emp.employeeId || emp.id);

    return `
    <div class="space-y-6 fade-in">
        <!-- Back Navigation & Breadcrumb -->
        <div class="flex items-center gap-2 text-xs text-slate-500">
            <button onclick="window.adminStore.goBack()" class="hover:text-slate-900 font-semibold flex items-center gap-1">
                <i data-lucide="arrow-left" class="w-3.5 h-3.5"></i>
                <span>Employees</span>
            </button>
            <span>/</span>
            <span class="text-slate-900 font-bold">${emp.fullName || emp.name} (${emp.employeeId || emp.id})</span>
        </div>

        <!-- Header Profile Identity Card -->
        <div class="admin-card p-6">
            <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                <div class="flex items-start sm:items-center gap-4">
                    <div class="w-16 h-16 rounded-2xl ${emp.avatarBg || 'bg-blue-600'} text-white flex items-center justify-center text-xl font-bold shadow-sm shrink-0">
                        ${(emp.fullName || emp.name).split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div>
                        <div class="flex items-center gap-2.5 flex-wrap">
                            <h1 class="text-2xl font-bold text-slate-900">${emp.fullName || emp.name}</h1>
                            <span class="font-mono text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">${emp.employeeId || emp.id}</span>
                            
                            <!-- Dual Status Badges -->
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${emp.employmentStatus === 'Active' ? 'badge-active' : 'badge-inactive'}">
                                ${emp.employmentStatus || 'Active'}
                            </span>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${emp.skillupAccessEnabled ? 'badge-enabled' : 'badge-disabled'}">
                                SkillUp: ${emp.skillupAccessEnabled ? 'ENABLED' : 'DISABLED'}
                            </span>
                        </div>
                        <div class="text-xs text-slate-500 mt-1.5 flex items-center gap-2 flex-wrap">
                            <span>${emp.role}</span>
                            <span>&bull;</span>
                            <span>${emp.location}</span>
                            <span>&bull;</span>
                            <span>Manager: <strong class="text-slate-700">${emp.manager}</strong></span>
                            <span>&bull;</span>
                            <span>Email: <strong class="text-slate-700">${emp.email}</strong></span>
                            ${emp.mobileNumber ? `<span>&bull;</span><span>Mobile: <strong class="text-slate-700">${emp.mobileNumber}</strong></span>` : ''}
                        </div>
                    </div>
                </div>

                <!-- Access Management Controls -->
                <div class="flex items-center gap-2.5 flex-wrap">
                    ${emp.skillupAccessEnabled ? `
                        <button onclick="openSingleAccessModal('${emp.id}', false)" class="px-3.5 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition">
                            <i data-lucide="shield-alert" class="w-4 h-4 text-rose-600"></i>
                            <span>Disable SkillUp Access</span>
                        </button>
                    ` : `
                        <button onclick="openSingleAccessModal('${emp.id}', true)" class="px-3.5 py-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition">
                            <i data-lucide="shield-check" class="w-4 h-4 text-emerald-600"></i>
                            <span>Enable SkillUp Access</span>
                        </button>
                    `}

                    <button onclick="window.adminStore.navigate('assignments')" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-2 shadow-sm transition">
                        <i data-lucide="plus-circle" class="w-4 h-4"></i>
                        <span>Assign Course</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- 4 KPI Metrics -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="admin-card p-4">
                <span class="text-xs font-semibold text-slate-500 uppercase">Courses Assigned</span>
                <div class="text-2xl font-extrabold text-slate-900 mt-1">${emp.coursesAssigned}</div>
            </div>
            <div class="admin-card p-4">
                <span class="text-xs font-semibold text-slate-500 uppercase">Completed</span>
                <div class="text-2xl font-extrabold text-emerald-600 mt-1">${emp.coursesCompleted}</div>
            </div>
            <div class="admin-card p-4">
                <span class="text-xs font-semibold text-slate-500 uppercase">In Progress</span>
                <div class="text-2xl font-extrabold text-blue-600 mt-1">${emp.coursesInProgress}</div>
            </div>
            <div class="admin-card p-4">
                <span class="text-xs font-semibold text-slate-500 uppercase">Average Score</span>
                <div class="text-2xl font-extrabold text-slate-900 mt-1">${emp.avgScore ? emp.avgScore + '%' : '—'}</div>
            </div>
        </div>

        <!-- COURSE ASSIGNMENTS & PROGRESS TABLE WITH ACCESS REVOCATION -->
        <div class="admin-card p-6">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-base font-bold text-slate-900">COURSE ENROLLMENTS & ASSIGNMENTS</h2>
                    <p class="text-xs text-slate-500">Track assignment progress, quiz records, or revoke course-level access while retaining historic progress.</p>
                </div>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                    <thead>
                        <tr class="border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-wider">
                            <th class="pb-3">Course Title</th>
                            <th class="pb-3">Status</th>
                            <th class="pb-3">Progress</th>
                            <th class="pb-3 text-center">Score</th>
                            <th class="pb-3">Last Activity</th>
                            <th class="pb-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50 font-medium text-slate-700">
                        ${(emp.courseProgress && emp.courseProgress.length > 0 ? emp.courseProgress : [
                            { courseId: "C001", title: "Gold Loan Product Knowledge", status: "IN PROGRESS", progress: 65, score: null, lastActivity: "24 Aug 2026" },
                            { courseId: "C002", title: "Sales Excellence", status: "ASSIGNED", progress: 0, score: null, lastActivity: "—" },
                            { courseId: "C003", title: "Customer Handling Excellence", status: "COMPLETED", progress: 100, score: 88, lastActivity: "20 Aug 2026" }
                        ]).map(cp => {
                            const isRevoked = cp.status === "REVOKED" || cp.status === "Revoked";
                            let statusBadgeClass = "badge-assigned";
                            if (cp.status === "COMPLETED" || cp.status === "Completed") statusBadgeClass = "badge-completed";
                            else if (cp.status === "IN PROGRESS" || cp.status === "In Progress") statusBadgeClass = "badge-inprogress";
                            else if (isRevoked) statusBadgeClass = "badge-revoked";

                            return `
                            <tr class="hover:bg-slate-50/70 transition">
                                <td class="py-3.5 pr-4 font-semibold text-slate-900 flex items-center gap-2">
                                    <i data-lucide="book-open" class="w-4 h-4 text-blue-500 shrink-0"></i>
                                    <div>
                                        <span>${cp.title}</span>
                                        ${isRevoked && cp.revokedAt ? `<div class="text-[10px] text-rose-500 font-normal">Access revoked on ${cp.revokedAt} (History preserved)</div>` : ''}
                                    </div>
                                </td>
                                <td class="py-3.5 pr-4">
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusBadgeClass}">
                                        ${cp.status}
                                    </span>
                                </td>
                                <td class="py-3.5 pr-4 w-36">
                                    <div class="flex items-center gap-2">
                                        <div class="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                            <div class="${isRevoked ? 'bg-rose-400' : 'bg-blue-600'} h-1.5 rounded-full" style="width: ${cp.progress}%"></div>
                                        </div>
                                        <span class="text-[11px] font-bold text-slate-700">${cp.progress}%</span>
                                    </div>
                                </td>
                                <td class="py-3.5 text-center font-bold text-slate-900">${cp.score ? cp.score + '%' : '—'}</td>
                                <td class="py-3.5 text-slate-500">${cp.lastActivity || '—'}</td>
                                <td class="py-3.5 text-right">
                                    ${isRevoked ? `
                                        <button onclick="openCourseAccessModal('${emp.id}', '${cp.courseId}', false)" class="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold rounded-lg transition">
                                            Restore Access
                                        </button>
                                    ` : `
                                        <button onclick="openCourseAccessModal('${emp.id}', '${cp.courseId}', true)" class="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-[11px] font-semibold rounded-lg transition">
                                            Revoke Access
                                        </button>
                                    `}
                                </td>
                            </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- EMPLOYEE AUDIT TRAIL / ACCESS LOG -->
        <div class="admin-card p-6">
            <div class="flex items-center justify-between mb-4">
                <div>
                    <h2 class="text-base font-bold text-slate-900">AUDIT LOG & ACCESS HISTORY</h2>
                    <p class="text-xs text-slate-500">Chronological history of admin actions, status changes, and course access changes.</p>
                </div>
            </div>

            <div class="space-y-3">
                ${auditLogs.length > 0 ? auditLogs.map(log => `
                    <div class="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl flex items-start justify-between gap-4 text-xs">
                        <div class="flex items-start gap-3">
                            <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                                <i data-lucide="shield" class="w-4 h-4"></i>
                            </div>
                            <div>
                                <div class="font-bold text-slate-900">${log.action}</div>
                                <div class="text-slate-600 mt-0.5">${log.details || 'System audit logged'}</div>
                                <div class="text-[11px] text-slate-400 mt-1">Admin: <strong class="text-slate-600">${log.adminId}</strong> &bull; ${log.timestamp}</div>
                            </div>
                        </div>
                    </div>
                `).join('') : `
                    <div class="py-6 text-center text-xs text-slate-400">
                        No audit events recorded for this employee yet.
                    </div>
                `}
            </div>
        </div>
    </div>
    `;
}

// ----------------------------------------------------
// 6. ADD EMPLOYEE MODAL HANDLER
// ----------------------------------------------------

function openAddEmployeeModal() {
    const modal = document.getElementById("add-employee-modal");
    if (modal) {
        modal.classList.remove("hidden");
        lucide.createIcons();
    }
}

function closeAddEmployeeModal() {
    const modal = document.getElementById("add-employee-modal");
    if (modal) modal.classList.add("hidden");
}

function handleAddEmployeeSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("new-emp-id").value.trim().toUpperCase();
    const name = document.getElementById("new-emp-name").value.trim();
    const email = document.getElementById("new-emp-email").value.trim();
    const phone = document.getElementById("new-emp-phone").value.trim();
    const role = document.getElementById("new-emp-role").value;
    const location = document.getElementById("new-emp-location").value;
    const manager = document.getElementById("new-emp-manager").value;
    const employmentStatus = document.getElementById("new-emp-status").value;
    const skillupAccess = document.getElementById("new-emp-access").checked;

    try {
        const newEmp = window.adminStore.addEmployee({
            employeeId: id,
            fullName: name,
            email: email,
            mobileNumber: phone,
            role: role,
            location: location,
            manager: manager,
            employmentStatus: employmentStatus,
            skillupAccessEnabled: skillupAccess
        });
        closeAddEmployeeModal();
        showToast(`Employee ${newEmp.fullName} (${newEmp.employeeId}) created successfully!`, "user-plus");
    } catch (err) {
        alert(err.message || "Failed to add employee");
    }
}
