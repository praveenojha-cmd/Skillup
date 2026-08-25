// SkillUp Enterprise Admin Portal - Local Sample Data Repository
// Milestone 2 Prototype Data Models & Realistic Local Store
// Future Backend Compatible Structure

const INITIAL_ADMIN_USER = {
    id: "ADMIN001",
    name: "Praveen Ojha",
    email: "praveen.ojha@rupeek.com",
    role: "Head of L&D",
    department: "Human Resources & Talent Development",
    avatar: "PO",
    lastLogin: "Today at 09:30 AM"
};

const INITIAL_EMPLOYEES = [
    {
        id: "EMP001",
        employeeId: "EMP001",
        name: "Rahul Sharma",
        fullName: "Rahul Sharma",
        role: "Relationship Manager",
        department: "Sales & Distribution",
        location: "Bangalore",
        manager: "Amit Kumar",
        email: "rahul.sharma@skillup.com",
        phone: "+91 98765 43210",
        mobileNumber: "+91 98765 43210",
        joiningDate: "12 Jan 2024",
        employmentStatus: "Active",
        status: "Active",
        skillupAccessEnabled: true,
        progress: 78,
        coursesAssigned: 8,
        coursesCompleted: 5,
        coursesInProgress: 2,
        avgScore: 84,
        avatarBg: "bg-blue-600",
        courseProgress: [
            { courseId: "C001", title: "Gold Loan Product Knowledge", status: "IN PROGRESS", progress: 65, score: null, lastActivity: "24 Aug 2026", deadline: "30 Sep 2026", assignedAt: "10 Aug 2026", assignedBy: "ADMIN001" },
            { courseId: "C002", title: "Sales Excellence", status: "REVOKED", progress: 30, score: 72, lastActivity: "20 Aug 2026", deadline: "15 Oct 2026", assignedAt: "10 Aug 2026", assignedBy: "ADMIN001", revokedAt: "22 Aug 2026", revokedBy: "ADMIN001" },
            { courseId: "C003", title: "Customer Handling Excellence", status: "COMPLETED", progress: 100, score: 88, lastActivity: "20 Aug 2026", deadline: "10 Aug 2026", assignedAt: "01 Aug 2026", assignedBy: "ADMIN001" },
            { courseId: "C004", title: "Collections & Retention", status: "IN PROGRESS", progress: 30, score: 72, lastActivity: "22 Aug 2026", deadline: "25 Sep 2026", assignedAt: "15 Aug 2026", assignedBy: "ADMIN001" },
            { courseId: "C005", title: "Anti-Money Laundering & KYC", status: "COMPLETED", progress: 100, score: 92, lastActivity: "15 Aug 2026", deadline: "15 Aug 2026", assignedAt: "01 Aug 2026", assignedBy: "ADMIN001" },
            { courseId: "C006", title: "Information Security & RBI Compliance", status: "COMPLETED", progress: 100, score: 85, lastActivity: "05 Aug 2026", deadline: "10 Aug 2026", assignedAt: "01 Aug 2026", assignedBy: "ADMIN001" },
            { courseId: "C007", title: "Appraisal & Safe Custody Protocols", status: "COMPLETED", progress: 100, score: 80, lastActivity: "01 Aug 2026", deadline: "05 Aug 2026", assignedAt: "15 Jul 2026", assignedBy: "ADMIN001" },
            { courseId: "C008", title: "Workplace Ethics & POSH", status: "COMPLETED", progress: 100, score: 90, lastActivity: "28 Jul 2026", deadline: "30 Jul 2026", assignedAt: "10 Jul 2026", assignedBy: "ADMIN001" }
        ]
    },
    {
        id: "EMP002",
        employeeId: "EMP002",
        name: "Amit Kumar",
        fullName: "Amit Kumar",
        role: "Relationship Manager",
        department: "Sales & Distribution",
        location: "Delhi",
        manager: "Priya Sharma",
        email: "amit.kumar@skillup.com",
        phone: "+91 98765 43211",
        mobileNumber: "+91 98765 43211",
        joiningDate: "05 Mar 2024",
        employmentStatus: "Active",
        status: "Active",
        skillupAccessEnabled: true,
        progress: 64,
        coursesAssigned: 6,
        coursesCompleted: 3,
        coursesInProgress: 2,
        avgScore: 79,
        avatarBg: "bg-emerald-600",
        courseProgress: [
            { courseId: "C001", title: "Gold Loan Product Knowledge", status: "COMPLETED", progress: 100, score: 82, lastActivity: "18 Aug 2026", deadline: "20 Aug 2026", assignedAt: "05 Aug 2026", assignedBy: "ADMIN001" },
            { courseId: "C002", title: "Sales Excellence", status: "IN PROGRESS", progress: 45, score: null, lastActivity: "23 Aug 2026", deadline: "15 Sep 2026", assignedAt: "10 Aug 2026", assignedBy: "ADMIN001" },
            { courseId: "C003", title: "Customer Handling Excellence", status: "IN PROGRESS", progress: 50, score: null, lastActivity: "21 Aug 2026", deadline: "30 Sep 2026", assignedAt: "12 Aug 2026", assignedBy: "ADMIN001" },
            { courseId: "C004", title: "Collections & Retention", status: "ASSIGNED", progress: 0, score: null, lastActivity: "—", deadline: "20 Oct 2026", assignedAt: "18 Aug 2026", assignedBy: "ADMIN001" }
        ]
    },
    {
        id: "EMP003",
        employeeId: "EMP003",
        name: "Neha Singh",
        fullName: "Neha Singh",
        role: "TBM",
        department: "Branch Operations",
        location: "Mumbai",
        manager: "Raj Kumar",
        email: "neha.singh@skillup.com",
        phone: "+91 98765 43212",
        mobileNumber: "+91 98765 43212",
        joiningDate: "18 Nov 2023",
        employmentStatus: "Active",
        status: "Active",
        skillupAccessEnabled: true,
        progress: 91,
        coursesAssigned: 10,
        coursesCompleted: 9,
        coursesInProgress: 1,
        avgScore: 92,
        avatarBg: "bg-purple-600",
        courseProgress: [
            { courseId: "C001", title: "Gold Loan Product Knowledge", status: "COMPLETED", progress: 100, score: 94, lastActivity: "14 Aug 2026", deadline: "15 Aug 2026", assignedAt: "01 Aug 2026", assignedBy: "ADMIN001" },
            { courseId: "C002", title: "Sales Excellence", status: "COMPLETED", progress: 100, score: 90, lastActivity: "19 Aug 2026", deadline: "20 Aug 2026", assignedAt: "01 Aug 2026", assignedBy: "ADMIN001" },
            { courseId: "C003", title: "Customer Handling Excellence", status: "COMPLETED", progress: 100, score: 96, lastActivity: "21 Aug 2026", deadline: "22 Aug 2026", assignedAt: "01 Aug 2026", assignedBy: "ADMIN001" },
            { courseId: "C004", title: "Collections & Retention", status: "IN PROGRESS", progress: 80, score: null, lastActivity: "24 Aug 2026", deadline: "01 Sep 2026", assignedAt: "10 Aug 2026", assignedBy: "ADMIN001" }
        ]
    },
    {
        id: "EMP004",
        employeeId: "EMP004",
        name: "Priya Sharma",
        fullName: "Priya Sharma",
        role: "ABM",
        department: "Branch Operations",
        location: "Delhi",
        manager: "Raj Kumar",
        email: "priya.sharma@skillup.com",
        phone: "+91 98765 43213",
        mobileNumber: "+91 98765 43213",
        joiningDate: "10 Feb 2023",
        employmentStatus: "Active",
        status: "Active",
        skillupAccessEnabled: true,
        progress: 88,
        coursesAssigned: 8,
        coursesCompleted: 7,
        coursesInProgress: 1,
        avgScore: 89,
        avatarBg: "bg-pink-600",
        courseProgress: [
            { courseId: "C001", title: "Gold Loan Product Knowledge", status: "COMPLETED", progress: 100, score: 91, lastActivity: "10 Aug 2026", deadline: "15 Aug 2026", assignedAt: "01 Aug 2026", assignedBy: "ADMIN001" }
        ]
    },
    {
        id: "EMP005",
        employeeId: "EMP005",
        name: "Raj Kumar",
        fullName: "Raj Kumar",
        role: "RBH",
        department: "Regional Leadership",
        location: "Mumbai",
        manager: "Executive Board",
        email: "raj.kumar@skillup.com",
        phone: "+91 98765 43214",
        mobileNumber: "+91 98765 43214",
        joiningDate: "15 Jan 2022",
        employmentStatus: "Active",
        status: "Active",
        skillupAccessEnabled: true,
        progress: 95,
        coursesAssigned: 12,
        coursesCompleted: 11,
        coursesInProgress: 1,
        avgScore: 94,
        avatarBg: "bg-indigo-600",
        courseProgress: [
            { courseId: "C001", title: "Gold Loan Product Knowledge", status: "COMPLETED", progress: 100, score: 98, lastActivity: "08 Aug 2026", deadline: "10 Aug 2026", assignedAt: "01 Aug 2026", assignedBy: "ADMIN001" }
        ]
    },
    {
        id: "EMP006",
        employeeId: "EMP006",
        name: "Sneha Reddy",
        fullName: "Sneha Reddy",
        role: "Relationship Manager",
        department: "Sales & Distribution",
        location: "Hyderabad",
        manager: "Vikram Patel",
        email: "sneha.reddy@skillup.com",
        phone: "+91 98765 43215",
        mobileNumber: "+91 98765 43215",
        joiningDate: "01 Jun 2024",
        employmentStatus: "Active",
        status: "Active",
        skillupAccessEnabled: true,
        progress: 52,
        coursesAssigned: 6,
        coursesCompleted: 2,
        coursesInProgress: 3,
        avgScore: 76,
        avatarBg: "bg-amber-600",
        courseProgress: [
            { courseId: "C001", title: "Gold Loan Product Knowledge", status: "IN PROGRESS", progress: 70, score: null, lastActivity: "22 Aug 2026", deadline: "15 Sep 2026", assignedAt: "10 Aug 2026", assignedBy: "ADMIN001" }
        ]
    },
    {
        id: "EMP007",
        employeeId: "EMP007",
        name: "Vikram Patel",
        fullName: "Vikram Patel",
        role: "TBM",
        department: "Branch Operations",
        location: "Hyderabad",
        manager: "Raj Kumar",
        email: "vikram.patel@skillup.com",
        phone: "+91 98765 43216",
        mobileNumber: "+91 98765 43216",
        joiningDate: "20 Sep 2023",
        employmentStatus: "Active",
        status: "Active",
        skillupAccessEnabled: true,
        progress: 83,
        coursesAssigned: 9,
        coursesCompleted: 7,
        coursesInProgress: 1,
        avgScore: 85,
        avatarBg: "bg-teal-600",
        courseProgress: [
            { courseId: "C001", title: "Gold Loan Product Knowledge", status: "COMPLETED", progress: 100, score: 87, lastActivity: "12 Aug 2026", deadline: "15 Aug 2026", assignedAt: "01 Aug 2026", assignedBy: "ADMIN001" }
        ]
    },
    {
        id: "EMP008",
        employeeId: "EMP008",
        name: "Ananya Roy",
        fullName: "Ananya Roy",
        role: "Relationship Manager",
        department: "Sales & Distribution",
        location: "Bangalore",
        manager: "Amit Kumar",
        email: "ananya.roy@skillup.com",
        phone: "+91 98765 43217",
        mobileNumber: "+91 98765 43217",
        joiningDate: "14 Jul 2024",
        employmentStatus: "Inactive",
        status: "Inactive",
        skillupAccessEnabled: false,
        progress: 35,
        coursesAssigned: 5,
        coursesCompleted: 1,
        coursesInProgress: 2,
        avgScore: 68,
        avatarBg: "bg-slate-600",
        courseProgress: [
            { courseId: "C001", title: "Gold Loan Product Knowledge", status: "IN PROGRESS", progress: 40, score: null, lastActivity: "10 Aug 2026", deadline: "15 Aug 2026", assignedAt: "01 Aug 2026", assignedBy: "ADMIN001" }
        ]
    }
];

const INITIAL_COURSES = [
    {
        id: "C001",
        title: "Gold Loan Product Knowledge",
        category: "PRODUCT KNOWLEDGE",
        type: "MANDATORY",
        difficulty: "Intermediate",
        durationMinutes: 45,
        assignedCount: 180,
        startedCount: 165,
        completedCount: 142,
        avgScore: 86,
        completionPercentage: 79,
        status: "Published",
        thumbnail: "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&auto=format&fit=crop&q=80",
        description: "Master gold loan valuation, purity assessment, loan-to-value calculations, and regulatory compliance standards.",
        modules: [
            {
                id: "M101",
                title: "Product Basics & Loan Mechanics",
                description: "Understand basic concepts, LTV ratios, and tenure guidelines.",
                lessons: [
                    { id: "L101", title: "Introduction to Gold Loans", type: "VIDEO", duration: "6 min", file: "intro_gold_loans.mp4", objectives: ["Understand basic value proposition", "Identify target customer segment"], takeaways: ["Gold loans are asset-backed instant credit solutions", "High security and flexible tenures"] },
                    { id: "L102", title: "Product Overview & Tenures", type: "PDF", duration: "8 min", file: "product_overview_v2.pdf", objectives: ["Review product variants", "Understand repayment options"], takeaways: ["Bullet and monthly interest repayment models available"] },
                    { id: "L103", title: "Key Benefits & Competitor Edge", type: "TEXT", duration: "5 min", file: "content_article.txt", objectives: ["Compare with unsecured loans"], takeaways: ["Lower interest rates and zero foreclosure charges"] },
                    { id: "L104", title: "Module 1 Assessment", type: "QUIZ", quizId: "Q101", duration: "10 min" }
                ]
            },
            {
                id: "M102",
                title: "Eligibility Criteria & Documentation",
                description: "KYC protocols, address proofs, and ownership verification.",
                lessons: [
                    { id: "L105", title: "Eligibility Guidelines", type: "VIDEO", duration: "7 min", file: "eligibility_rules.mp4", objectives: ["Know age and residency criteria"], takeaways: ["Minimum age 18 years with valid Indian citizenship"] },
                    { id: "L106", title: "Mandatory KYC Documentation", type: "PDF", duration: "6 min", file: "kyc_checklist_2026.pdf", objectives: ["Review officially valid documents"], takeaways: ["Aadhaar, PAN, Voter ID accepted"] },
                    { id: "L107", title: "Policy Compliance Checklist", type: "TEXT", duration: "4 min", file: "policy_doc.txt", objectives: ["Execute zero-tolerance AML checks"], takeaways: ["Report suspicious transactions exceeding 2 lakhs"] },
                    { id: "L108", title: "Eligibility Quiz", type: "QUIZ", quizId: "Q102", duration: "8 min" }
                ]
            },
            {
                id: "M103",
                title: "Gold Valuation & Karat Purity Assessment",
                description: "Touchstone testing, density balance, and deductions.",
                lessons: [
                    { id: "L109", title: "Valuation Basics & Hallmarking", type: "VIDEO", duration: "9 min", file: "valuation_basics.mp4", objectives: ["Identify BIS hallmark symbols"], takeaways: ["Recognize 916 (22K) and 750 (18K) standards"] },
                    { id: "L110", title: "Purity Testing Procedures", type: "PDF", duration: "10 min", file: "acid_touchstone_manual.pdf", objectives: ["Perform nitric acid touchstone verification"], takeaways: ["Never appraise gold below 18 Karat"] },
                    { id: "L111", title: "Weight Deduction for Stones & Enamel", type: "TEXT", duration: "5 min", file: "stone_deduction_formula.txt", objectives: ["Calculate net gold weight accurately"], takeaways: ["Deduct 100% of bead/stone/wax weights"] },
                    { id: "L112", title: "Valuation Practical Scenarios", type: "VIDEO", duration: "8 min", file: "case_studies_valuation.mp4", objectives: ["Handle complex ornament appraisals"], takeaways: ["Always verify soldering joints"] },
                    { id: "L113", title: "Comprehensive Valuation Quiz", type: "QUIZ", quizId: "Q103", duration: "12 min" }
                ]
            }
        ]
    },
    {
        id: "C002",
        title: "Sales Excellence & Objection Handling",
        category: "SALES & GROWTH",
        type: "MANDATORY",
        difficulty: "Intermediate",
        durationMinutes: 40,
        assignedCount: 150,
        startedCount: 120,
        completedCount: 98,
        avgScore: 81,
        completionPercentage: 65,
        status: "Published",
        thumbnail: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80",
        description: "Master high-conversion lead engagement, trust building, rate objection handling, and cross-selling techniques.",
        modules: [
            {
                id: "M201",
                title: "Pitching & First Impression",
                description: "Engaging prospects in 30 seconds.",
                lessons: [
                    { id: "L201", title: "The 30-Second Elevator Pitch", type: "VIDEO", duration: "6 min", file: "pitch_mastery.mp4" },
                    { id: "L202", title: "Customer Persona Mapping", type: "PDF", duration: "8 min", file: "customer_personas.pdf" },
                    { id: "L203", title: "Pitch Assessment", type: "QUIZ", quizId: "Q201", duration: "6 min" }
                ]
            },
            {
                id: "M202",
                title: "Overcoming Rate Objections",
                description: "Reframing interest rate into value and monthly convenience.",
                lessons: [
                    { id: "L204", title: "Interest Rate Comparison Framework", type: "VIDEO", duration: "7 min", file: "rate_framework.mp4" },
                    { id: "L205", title: "Handling Hesitant Borrowers", type: "TEXT", duration: "5 min", file: "objection_scripts.txt" },
                    { id: "L206", title: "Sales Objection Quiz", type: "QUIZ", quizId: "Q202", duration: "8 min" }
                ]
            }
        ]
    },
    {
        id: "C003",
        title: "Customer Handling Excellence",
        category: "CUSTOMER EXPERIENCE",
        type: "ELECTIVE",
        difficulty: "Beginner",
        durationMinutes: 35,
        assignedCount: 200,
        startedCount: 185,
        completedCount: 160,
        avgScore: 88,
        completionPercentage: 80,
        status: "Published",
        thumbnail: "https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&auto=format&fit=crop&q=80",
        description: "Deliver empathetic, transparent, and seamless customer experiences across doorstep and branch interactions.",
        modules: [
            {
                id: "M301",
                title: "Customer Centricity & Empathy",
                description: "Understanding emotional attachment to gold ornaments.",
                lessons: [
                    { id: "L301", title: "Respecting Customer Sentiments", type: "VIDEO", duration: "8 min", file: "empathy_training.mp4" },
                    { id: "L302", title: "Service Etiquette Guidelines", type: "PDF", duration: "6 min", file: "etiquette_manual.pdf" }
                ]
            },
            {
                id: "M302",
                title: "De-escalation & Grievance Redressal",
                description: "Resolving customer disputes calmly.",
                lessons: [
                    { id: "L303", title: "Conflict Resolution Playbook", type: "TEXT", duration: "6 min", file: "deescalation.txt" },
                    { id: "L304", title: "Customer Experience Quiz", type: "QUIZ", quizId: "Q301", duration: "10 min" }
                ]
            }
        ]
    },
    {
        id: "C004",
        title: "Collections & Retention Strategy",
        category: "OPERATIONS & RISK",
        type: "MANDATORY",
        difficulty: "Advanced",
        durationMinutes: 50,
        assignedCount: 170,
        startedCount: 130,
        completedCount: 105,
        avgScore: 79,
        completionPercentage: 62,
        status: "Published",
        thumbnail: "https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80",
        description: "Equitable debt recovery, proactive renewal management, auction notice protocols, and customer retention.",
        modules: [
            {
                id: "M401",
                title: "Early Warning Indicators",
                description: "Identifying payment default triggers.",
                lessons: [
                    { id: "L401", title: "Early Warning Signals", type: "VIDEO", duration: "10 min", file: "early_warning.mp4" },
                    { id: "L402", title: "Renewal Drive Workflows", type: "PDF", duration: "8 min", file: "renewal_workflows.pdf" }
                ]
            }
        ]
    },
    {
        id: "C005",
        title: "Information Security & RBI Compliance",
        category: "COMPLIANCE",
        type: "MANDATORY",
        difficulty: "Intermediate",
        durationMinutes: 30,
        assignedCount: 200,
        startedCount: 190,
        completedCount: 182,
        avgScore: 92,
        completionPercentage: 91,
        status: "Published",
        thumbnail: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=80",
        description: "Protecting customer financial data, device security, phishing defense, and strict RBI cybersecurity compliance.",
        modules: []
    },
    {
        id: "C006",
        title: "Appraisal & Safe Custody Protocols",
        category: "BRANCH OPERATIONS",
        type: "MANDATORY",
        difficulty: "Advanced",
        durationMinutes: 45,
        assignedCount: 120,
        startedCount: 95,
        completedCount: 88,
        avgScore: 89,
        completionPercentage: 73,
        status: "Published",
        thumbnail: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&auto=format&fit=crop&q=80",
        description: "Dual custody vault operations, tamper-proof security packet management, and auditing.",
        modules: []
    }
];

const INITIAL_QUIZZES = [
    {
        id: "Q101",
        title: "Gold Loan Basics Quiz",
        passingScore: 70,
        attemptsAllowed: "Unlimited",
        courseId: "C001",
        moduleId: "M101",
        questions: [
            {
                id: "QG01",
                text: "What does LTV represent in lending?",
                options: [
                    "Loan-to-Value",
                    "Loan-to-Volume",
                    "Lending-to-Value",
                    "Loan-to-Verification"
                ],
                correctAnswerIndex: 0,
                explanation: "LTV represents Loan-to-Value, which is the ratio of the loan amount disbursed relative to the appraised market value of the pledged collateral."
            },
            {
                id: "QG02",
                text: "What is the maximum permissible regulatory LTV for gold loans as mandated by RBI?",
                options: [
                    "50%",
                    "65%",
                    "75%",
                    "90%"
                ],
                correctAnswerIndex: 2,
                explanation: "The Reserve Bank of India (RBI) mandates a maximum cap of 75% LTV on retail gold loans to maintain safety margins against gold price volatility."
            },
            {
                id: "QG03",
                text: "Which of the following is an advantage of gold loans compared to personal unsecured loans?",
                options: [
                    "Higher interest rates",
                    "Immediate disbursal with lower interest rates and flexible repayments",
                    "Lengthy 3-week verification process",
                    "No requirement of KYC"
                ],
                correctAnswerIndex: 1,
                explanation: "Gold loans offer lower risk to lenders, translating into lower interest rates, faster disbursal, and flexible repayment schemes for borrowers."
            },
            {
                id: "QG04",
                text: "Which repayment model allows the borrower to pay the entire principal and accumulated interest only at the end of the loan tenure?",
                options: [
                    "Equated Monthly Installment (EMI)",
                    "Bullet Repayment Scheme",
                    "Daily Debit Scheme",
                    "Advance Interest Deducted"
                ],
                correctAnswerIndex: 1,
                explanation: "In a Bullet Repayment Scheme, the borrower pays both the principal and interest together upon maturity of the loan."
            }
        ]
    },
    {
        id: "Q102",
        title: "Eligibility & Documentation Assessment",
        passingScore: 70,
        attemptsAllowed: "Unlimited",
        courseId: "C001",
        moduleId: "M102",
        questions: [
            {
                id: "QG05",
                text: "What is the minimum age requirement for an applicant to avail a gold loan?",
                options: [
                    "16 Years",
                    "18 Years",
                    "21 Years",
                    "25 Years"
                ],
                correctAnswerIndex: 1,
                explanation: "The applicant must be a major (at least 18 years of age) under Indian contract laws."
            },
            {
                id: "QG06",
                text: "Which document is NOT classified as an Officially Valid Document (OVD) for KYC proof of identity?",
                options: [
                    "Passport",
                    "Aadhaar Card",
                    "Gym Membership Card",
                    "Voter Identity Card"
                ],
                correctAnswerIndex: 2,
                explanation: "Only government-issued identity documents such as Passport, Aadhaar, Voter ID, or Driving License qualify as OVDs."
            }
        ]
    }
];

const INITIAL_ASSIGNMENTS = [
    {
        id: "ASG-001",
        courseId: "C001",
        courseTitle: "Gold Loan Product Knowledge",
        assignedToLabel: "All Relationship Managers (Bangalore & Delhi)",
        targetType: "Role & Location",
        employeeCount: 42,
        assignedDate: "10 Aug 2026",
        deadline: "30 Sep 2026",
        status: "Active",
        completedCount: 33
    },
    {
        id: "ASG-002",
        courseId: "C002",
        courseTitle: "Sales Excellence",
        assignedToLabel: "All Sales & Distribution Teams",
        targetType: "Role",
        employeeCount: 65,
        assignedDate: "15 Aug 2026",
        deadline: "15 Oct 2026",
        status: "Active",
        completedCount: 28
    },
    {
        id: "ASG-003",
        courseId: "C004",
        courseTitle: "Collections & Retention",
        assignedToLabel: "25 Employees in Operations",
        targetType: "Individual Selection",
        employeeCount: 25,
        assignedDate: "20 Aug 2026",
        deadline: "25 Sep 2026",
        status: "Active",
        completedCount: 11
    },
    {
        id: "ASG-004",
        courseId: "C005",
        courseTitle: "Information Security & RBI Compliance",
        assignedToLabel: "All 200 Employees (Company-Wide)",
        targetType: "All Employees",
        employeeCount: 200,
        assignedDate: "01 Aug 2026",
        deadline: "15 Aug 2026",
        status: "Completed",
        completedCount: 182
    }
];

const INITIAL_NOTIFICATIONS = [
    {
        id: "NOTIF-001",
        title: "27 employees overdue on mandatory compliance",
        message: "Employees in Sales & Distribution have crossed the August 15 deadline for Information Security.",
        type: "overdue",
        severity: "high",
        count: 27,
        time: "2 hours ago",
        status: "Pending Action"
    },
    {
        id: "NOTIF-002",
        title: "18 employees haven't started assigned courses",
        message: "18 learners have not initiated the Sales Excellence module assigned 10 days ago.",
        type: "not_started",
        severity: "medium",
        count: 18,
        time: "5 hours ago",
        status: "Pending Action"
    },
    {
        id: "NOTIF-003",
        title: "9 employees failed assessment",
        message: "9 candidates scored below the 70% passing threshold in Gold Valuation Practical Exam.",
        type: "failed_quiz",
        severity: "warning",
        count: 9,
        time: "1 day ago",
        status: "Review Required"
    }
];

const INITIAL_ACTIVITIES = [
    { id: "ACT-01", text: "Rahul Sharma completed Gold Loan Product Knowledge", time: "10 mins ago", type: "completion", icon: "check-circle", color: "text-emerald-500" },
    { id: "ACT-02", text: "Amit Kumar started Sales Excellence module 2", time: "35 mins ago", type: "progress", icon: "play", color: "text-blue-500" },
    { id: "ACT-03", text: "Neha Singh completed Customer Handling Excellence (Score 96%)", time: "1 hour ago", type: "completion", icon: "award", color: "text-emerald-500" },
    { id: "ACT-04", text: "Admin assigned Collections & Retention to 25 employees", time: "3 hours ago", type: "assignment", icon: "send", color: "text-indigo-500" },
    { id: "ACT-05", text: "Sneha Reddy scored 88% on Valuation Karat Assessment", time: "4 hours ago", type: "quiz", icon: "file-text", color: "text-amber-500" }
];

const INITIAL_AUDIT_LOGS = [
    {
        id: "AUD-01",
        date: "24 Aug 2026",
        timestamp: "24 Aug 2026, 04:15 PM",
        adminId: "ADMIN001",
        employeeId: "EMP001",
        employeeName: "Rahul Sharma",
        action: "SkillUp Access Enabled",
        details: "Confirmed active employee portal login rights"
    },
    {
        id: "AUD-02",
        date: "22 Aug 2026",
        timestamp: "22 Aug 2026, 11:40 AM",
        adminId: "ADMIN001",
        employeeId: "EMP001",
        employeeName: "Rahul Sharma",
        action: "Sales Excellence Access Revoked",
        details: "Course curriculum access suspended; historic progress preserved at 30%"
    },
    {
        id: "AUD-03",
        date: "15 Aug 2026",
        timestamp: "15 Aug 2026, 09:20 AM",
        adminId: "ADMIN001",
        employeeId: "EMP008",
        employeeName: "Ananya Roy",
        action: "SkillUp Access Disabled",
        details: "Employee separated/inactive; all learning records and quiz scores retained"
    }
];
