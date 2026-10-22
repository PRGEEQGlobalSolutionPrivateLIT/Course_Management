import {
    universityInstituteAdmin
} from "./dashboard-config/university/institute-admin";


import {
    universityCoordinator
} from "./dashboard-config/university/coordinator";


import {
    universityFaculty
} from "./dashboard-config/university/faculty";


import {
    universityStudent
} from "./dashboard-config/university/student";



import {
    corporateAdmin
} from "./dashboard-config/corporate/corporate-admin";


import {
    corporateManager
} from "./dashboard-config/corporate/manager";


import {
    corporateTrainer
} from "./dashboard-config/corporate/trainer";


import {
    corporateEmployee
} from "./dashboard-config/corporate/employee";



import {
    skillAcademyAdmin
} from "./dashboard-config/skill-academy/academy-admin";


import {
    skillAcademyTrainer
} from "./dashboard-config/skill-academy/trainer";


import {
    skillAcademyLearner
} from "./dashboard-config/skill-academy/learner";



import {
    bootcampAdmin
} from "./dashboard-config/bootcamp/bootcamp-admin";


import {
    bootcampMentor
} from "./dashboard-config/bootcamp/mentor";


import {
    bootcampLearner
} from "./dashboard-config/bootcamp/learner";



import {
    ngoAdmin
} from "./dashboard-config/ngo/ngo-admin";


import {
    ngoTrainer
} from "./dashboard-config/ngo/trainer";


import {
    ngoBeneficiary
} from "./dashboard-config/ngo/beneficiary";



import {
    governmentAdmin
} from "./dashboard-config/government/department-admin";


import {
    governmentTrainer
} from "./dashboard-config/government/trainer";


import {
    governmentCitizen
} from "./dashboard-config/government/citizen";




const dashboards:any = {


    "university_institute_admin":
    universityInstituteAdmin,


    "university_coordinator":
    universityCoordinator,


    "university_faculty":
    universityFaculty,


    "university_student":
    universityStudent,



    "corporate_corporate_admin":
    corporateAdmin,


    "corporate_manager":
    corporateManager,


    "corporate_trainer":
    corporateTrainer,


    "corporate_employee":
    corporateEmployee,



    "skill_academy_academy_admin":
    skillAcademyAdmin,


    "skill_academy_trainer":
    skillAcademyTrainer,


    "skill_academy_learner":
    skillAcademyLearner,



    "bootcamp_bootcamp_admin":
    bootcampAdmin,


    "bootcamp_mentor":
    bootcampMentor,


    "bootcamp_learner":
    bootcampLearner,



    "ngo_ngo_admin":
    ngoAdmin,


    "ngo_trainer":
    ngoTrainer,


    "ngo_beneficiary":
    ngoBeneficiary,



    "government_department_admin":
    governmentAdmin,


    "government_trainer":
    governmentTrainer,


    "government_citizen":
    governmentCitizen


};




export function getDashboardConfig(
    tenant:string,
    role:string
){


    const key = `${tenant}_${role}`;


    return dashboards[key];


}