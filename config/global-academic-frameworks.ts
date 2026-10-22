export type AcademicFrameworkType =
    | "QUALIFICATION"
    | "ACCREDITATION"
    | "PROFESSIONAL"
    | "SKILLS"
    | "INSTITUTIONAL";

export type AcademicFrameworkOutcomeType =
    | "PROGRAMME_OUTCOME"
    | "PROGRAMME_SPECIFIC_OUTCOME"
    | "STUDENT_OUTCOME"
    | "GRADUATE_ATTRIBUTE"
    | "LEVEL_DESCRIPTOR"
    | "COMPETENCY"
    | "INSTITUTIONAL_OUTCOME";

export type AcademicFrameworkLevel = {
    id: string;
    code: string;
    name: string;
};

export type AcademicFramework = {
    id: string;
    countryCode: string;
    countryName: string;
    region: string;
    name: string;
    shortName: string;
    frameworkType: AcademicFrameworkType;
    authority: string;
    version: string;
    levels?: AcademicFrameworkLevel[];
    outcomeTerminology: string;
    outcomeType: AcademicFrameworkOutcomeType;
};

function numberedLevels(
    prefix: string,
    from: number,
    to: number
): AcademicFrameworkLevel[] {

    return Array.from(
        {
            length:
                to - from + 1,
        },
        (_, index) => {

            const level =
                from + index;

            return {
                id:
                    `${prefix.toLowerCase()}-${level}`,

                code:
                    `${prefix} ${level}`,

                name:
                    `${prefix} Level ${level}`,
            };
        }
    );
}

/*
 * Initial global registry.
 *
 * IMPORTANT:
 * This is intentionally configuration data rather than tenant-specific UI code.
 * Add/retire/version frameworks here (or later from an API/master-data service)
 * without changing CourseWizard or the mapping component.
 *
 * "CUSTOM" is always available so an institution can use its own approved
 * programme/accreditation framework when it is not in this starter registry.
 */
export const GLOBAL_ACADEMIC_FRAMEWORKS:
    AcademicFramework[] = [

    {
        id: "india-nheqf",
        countryCode: "IN",
        countryName: "India",
        region: "Asia",
        name: "National Higher Education Qualifications Framework",
        shortName: "NHEQF",
        frameworkType: "QUALIFICATION",
        authority: "Government of India",
        version: "Current",
        levels:
            numberedLevels(
                "NHEQF",
                4.5,
                8
            ),
        outcomeTerminology:
            "Qualification / Level Outcomes",
        outcomeType:
            "LEVEL_DESCRIPTOR",
    },

    {
        id: "india-ncrf",
        countryCode: "IN",
        countryName: "India",
        region: "Asia",
        name: "National Credit Framework",
        shortName: "NCrF",
        frameworkType: "QUALIFICATION",
        authority: "Government of India",
        version: "Current",
        outcomeTerminology:
            "Learning Outcomes",
        outcomeType:
            "LEVEL_DESCRIPTOR",
    },

    {
        id: "india-nba",
        countryCode: "IN",
        countryName: "India",
        region: "Asia",
        name: "National Board of Accreditation Outcome Framework",
        shortName: "NBA",
        frameworkType: "ACCREDITATION",
        authority: "National Board of Accreditation",
        version: "Current",
        outcomeTerminology:
            "Programme Outcomes / Programme Specific Outcomes",
        outcomeType:
            "PROGRAMME_OUTCOME",
    },

    {
        id: "international-washington-accord",
        countryCode: "INTL",
        countryName: "International",
        region: "International",
        name: "Washington Accord Graduate Attributes",
        shortName: "Washington Accord",
        frameworkType: "ACCREDITATION",
        authority: "International Engineering Alliance",
        version: "Current",
        outcomeTerminology:
            "Graduate Attributes",
        outcomeType:
            "GRADUATE_ATTRIBUTE",
    },

    {
        id: "international-sydney-accord",
        countryCode: "INTL",
        countryName: "International",
        region: "International",
        name: "Sydney Accord Graduate Attributes",
        shortName: "Sydney Accord",
        frameworkType: "ACCREDITATION",
        authority: "International Engineering Alliance",
        version: "Current",
        outcomeTerminology:
            "Graduate Attributes",
        outcomeType:
            "GRADUATE_ATTRIBUTE",
    },

    {
        id: "international-dublin-accord",
        countryCode: "INTL",
        countryName: "International",
        region: "International",
        name: "Dublin Accord Graduate Attributes",
        shortName: "Dublin Accord",
        frameworkType: "ACCREDITATION",
        authority: "International Engineering Alliance",
        version: "Current",
        outcomeTerminology:
            "Graduate Attributes",
        outcomeType:
            "GRADUATE_ATTRIBUTE",
    },

    {
        id: "usa-abet-engineering",
        countryCode: "US",
        countryName: "United States",
        region: "North America",
        name: "ABET Engineering Accreditation Criteria",
        shortName: "ABET Engineering",
        frameworkType: "ACCREDITATION",
        authority: "ABET",
        version: "Current",
        outcomeTerminology:
            "Student Outcomes",
        outcomeType:
            "STUDENT_OUTCOME",
    },

    {
        id: "usa-abet-computing",
        countryCode: "US",
        countryName: "United States",
        region: "North America",
        name: "ABET Computing Accreditation Criteria",
        shortName: "ABET Computing",
        frameworkType: "ACCREDITATION",
        authority: "ABET",
        version: "Current",
        outcomeTerminology:
            "Student Outcomes",
        outcomeType:
            "STUDENT_OUTCOME",
    },

    {
        id: "eu-eqf",
        countryCode: "EU",
        countryName: "European Union",
        region: "Europe",
        name: "European Qualifications Framework",
        shortName: "EQF",
        frameworkType: "QUALIFICATION",
        authority: "European Union",
        version: "Current",
        levels:
            numberedLevels(
                "EQF",
                1,
                8
            ),
        outcomeTerminology:
            "Knowledge / Skills / Responsibility and Autonomy",
        outcomeType:
            "LEVEL_DESCRIPTOR",
    },

    {
        id: "ehea-qf",
        countryCode: "EU",
        countryName: "European Higher Education Area",
        region: "Europe",
        name: "Qualifications Framework of the European Higher Education Area",
        shortName: "QF-EHEA",
        frameworkType: "QUALIFICATION",
        authority: "European Higher Education Area",
        version: "Current",
        outcomeTerminology:
            "Cycle Descriptors",
        outcomeType:
            "LEVEL_DESCRIPTOR",
    },

    {
        id: "uk-fheq",
        countryCode: "GB",
        countryName: "United Kingdom",
        region: "Europe",
        name: "Framework for Higher Education Qualifications",
        shortName: "FHEQ",
        frameworkType: "QUALIFICATION",
        authority: "United Kingdom Higher Education",
        version: "Current",
        outcomeTerminology:
            "Qualification Descriptors",
        outcomeType:
            "LEVEL_DESCRIPTOR",
    },

    {
        id: "scotland-scqf",
        countryCode: "GB-SCT",
        countryName: "Scotland",
        region: "Europe",
        name: "Scottish Credit and Qualifications Framework",
        shortName: "SCQF",
        frameworkType: "QUALIFICATION",
        authority: "SCQF Partnership",
        version: "Current",
        levels:
            numberedLevels(
                "SCQF",
                1,
                12
            ),
        outcomeTerminology:
            "Level Descriptors",
        outcomeType:
            "LEVEL_DESCRIPTOR",
    },

    {
        id: "australia-aqf",
        countryCode: "AU",
        countryName: "Australia",
        region: "Oceania",
        name: "Australian Qualifications Framework",
        shortName: "AQF",
        frameworkType: "QUALIFICATION",
        authority: "Australian Government",
        version: "Current",
        levels:
            numberedLevels(
                "AQF",
                1,
                10
            ),
        outcomeTerminology:
            "Knowledge / Skills / Application",
        outcomeType:
            "LEVEL_DESCRIPTOR",
    },

    {
        id: "new-zealand-nzqcf",
        countryCode: "NZ",
        countryName: "New Zealand",
        region: "Oceania",
        name: "New Zealand Qualifications and Credentials Framework",
        shortName: "NZQCF",
        frameworkType: "QUALIFICATION",
        authority: "New Zealand Qualifications Authority",
        version: "Current",
        levels:
            numberedLevels(
                "NZQCF",
                1,
                10
            ),
        outcomeTerminology:
            "Level Outcomes",
        outcomeType:
            "LEVEL_DESCRIPTOR",
    },

    {
        id: "malaysia-mqf",
        countryCode: "MY",
        countryName: "Malaysia",
        region: "Asia",
        name: "Malaysian Qualifications Framework",
        shortName: "MQF",
        frameworkType: "QUALIFICATION",
        authority: "Malaysian Qualifications Agency",
        version: "Current",
        levels:
            numberedLevels(
                "MQF",
                1,
                8
            ),
        outcomeTerminology:
            "Learning Outcome Domains",
        outcomeType:
            "LEVEL_DESCRIPTOR",
    },

    {
        id: "singapore-skills-framework",
        countryCode: "SG",
        countryName: "Singapore",
        region: "Asia",
        name: "Skills Framework",
        shortName: "Skills Framework",
        frameworkType: "SKILLS",
        authority: "SkillsFuture Singapore",
        version: "Current",
        outcomeTerminology:
            "Skills / Competencies",
        outcomeType:
            "COMPETENCY",
    },

    {
        id: "hong-kong-hkqf",
        countryCode: "HK",
        countryName: "Hong Kong",
        region: "Asia",
        name: "Hong Kong Qualifications Framework",
        shortName: "HKQF",
        frameworkType: "QUALIFICATION",
        authority: "Hong Kong Qualifications Framework",
        version: "Current",
        levels:
            numberedLevels(
                "HKQF",
                1,
                7
            ),
        outcomeTerminology:
            "Generic Level Descriptors",
        outcomeType:
            "LEVEL_DESCRIPTOR",
    },

    {
        id: "ireland-nfq",
        countryCode: "IE",
        countryName: "Ireland",
        region: "Europe",
        name: "National Framework of Qualifications",
        shortName: "NFQ",
        frameworkType: "QUALIFICATION",
        authority: "Quality and Qualifications Ireland",
        version: "Current",
        levels:
            numberedLevels(
                "NFQ",
                1,
                10
            ),
        outcomeTerminology:
            "Knowledge / Know-how and Skill / Competence",
        outcomeType:
            "LEVEL_DESCRIPTOR",
    },

    {
        id: "south-africa-nqf",
        countryCode: "ZA",
        countryName: "South Africa",
        region: "Africa",
        name: "National Qualifications Framework",
        shortName: "NQF",
        frameworkType: "QUALIFICATION",
        authority: "South African Qualifications Authority",
        version: "Current",
        levels:
            numberedLevels(
                "NQF",
                1,
                10
            ),
        outcomeTerminology:
            "Level Descriptors",
        outcomeType:
            "LEVEL_DESCRIPTOR",
    },

    {
        id: "uae-qf",
        countryCode: "AE",
        countryName: "United Arab Emirates",
        region: "Middle East",
        name: "UAE National Qualifications Framework",
        shortName: "UAE QF",
        frameworkType: "QUALIFICATION",
        authority: "United Arab Emirates",
        version: "Current",
        outcomeTerminology:
            "Level Descriptors",
        outcomeType:
            "LEVEL_DESCRIPTOR",
    },

    {
        id: "canada-degree-framework",
        countryCode: "CA",
        countryName: "Canada",
        region: "North America",
        name: "Canadian Degree Qualifications / Provincial Framework",
        shortName: "Canada Degree Framework",
        frameworkType: "QUALIFICATION",
        authority: "Provincial / Territorial Authorities",
        version: "Current",
        outcomeTerminology:
            "Degree-Level Expectations",
        outcomeType:
            "LEVEL_DESCRIPTOR",
    },

    {
        id: "custom-institutional",
        countryCode: "CUSTOM",
        countryName: "Other / Institution Specific",
        region: "Custom",
        name: "Custom Institutional / Accreditation Framework",
        shortName: "Custom Framework",
        frameworkType: "INSTITUTIONAL",
        authority: "Institution",
        version: "Institution Defined",
        outcomeTerminology:
            "Programme / Institutional Outcomes",
        outcomeType:
            "INSTITUTIONAL_OUTCOME",
    },
];

export const GLOBAL_ACADEMIC_COUNTRIES =
    Array.from(
        new Map(
            GLOBAL_ACADEMIC_FRAMEWORKS.map(
                (framework) => [
                    framework.countryCode,
                    {
                        code:
                            framework.countryCode,

                        name:
                            framework.countryName,
                    },
                ]
            )
        ).values()
    ).sort(
        (a, b) =>
            a.name.localeCompare(
                b.name
            )
    );
