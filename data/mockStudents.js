import { mockGroups } from "./mockGroups.js";

const MAJOR =
  "Artificial Intelligence and Robotics";

const FIRST_YEAR_FIRST_SEMESTER = [
  "100411010",
  "100413750",
  "290311110",
  "010610014",
  "240111000",
  "040111001"
];

const FIRST_YEAR_SECOND_SEMESTER = [
  "100411020",
  "250111040",
  "290311210",
  "010610025",
  "010610026",
  "040511011"
];

const SECOND_YEAR_FIRST_SEMESTER = [
  "250223010",
  "290312110",
  "290312120",
  "290312130",
  "290312140",
  "010610035",
  "010610036"
];

const SECOND_YEAR_SECOND_SEMESTER = [
  "290312210",
  "290312220",
  "290313130",
  "290312240",
  "250223040"
];

const THIRD_YEAR_FIRST_SEMESTER = [
  "290312230",
  "290314110",
  "290313110",
  "040521301"
];

const THIRD_YEAR_SECOND_SEMESTER = [
  "290313210",
  "290313220",
  "290313240",
  "290313120"
];

const THIRD_YEAR_SUMMER = [
  "290313250"
];

const FOURTH_YEAR_FIRST_SEMESTER = [
  "290313230",
  "290314120",
  "290314130"
];

const FOURTH_YEAR_SECOND_SEMESTER = [
  "290314210"
];

const FIRST_YEAR = [
  ...FIRST_YEAR_FIRST_SEMESTER,
  ...FIRST_YEAR_SECOND_SEMESTER
];

const SECOND_YEAR = [
  ...SECOND_YEAR_FIRST_SEMESTER,
  ...SECOND_YEAR_SECOND_SEMESTER
];

const THIRD_YEAR = [
  ...THIRD_YEAR_FIRST_SEMESTER,
  ...THIRD_YEAR_SECOND_SEMESTER,
  ...THIRD_YEAR_SUMMER
];

const studentNames = [
  "Lina Hassan",
  "Omar Khalil",
  "Yara Nasser",
  "Ahmad Hamdan",
  "Mariam Saleh",
  "Khaled Mansour",
  "Noor Darwish",
  "Sami Qasim",
  "Hala Odeh",
  "Tareq Barakat",
  "Rawan Shalabi",
  "Zaid Abu Rumman",

  "Aya Saadeh",
  "Mohammad Jaber",
  "Dana Masri",
  "Laith Awad",
  "Rana Khatib",
  "Yousef Hammad",
  "Salma Zahran",
  "Mahmoud Naji",
  "Reem Sabbagh",
  "Anas Qattan",
  "Dima Farah",
  "Basil Nazzal",
  "Nour Abu Laila",

  "Jana Qudsi",
  "Amir Haddad",
  "Layan Assaf",
  "Fadi Shukri",
  "Rasha Taha",
  "Ibrahim Zayed",
  "Malak Harb",
  "Adel Sbeih",
  "Sahar Ghannam",
  "Majd Khoury",
  "Tasneem Rabi",
  "Ali Dweikat",
  "Farah Shami",

  "Kareem Abed",
  "Rim Husseini",
  "Nidal Salameh",
  "Leen Arafat",
  "Hamza Bader",
  "Maya Najjar",
  "Osama Tamimi",
  "Ruba Samara",
  "Jad Alami",
  "Sana Issa",
  "Bilal Daoud",
  "Aseel Hamad"
];

function getYearLevel(index) {
  if (index < 12) {
    return 1;
  }

  if (index < 25) {
    return 2;
  }

  if (index < 38) {
    return 3;
  }

  return 4;
}

function getPositionWithinYear(
  index,
  yearLevel
) {
  if (yearLevel === 1) {
    return index;
  }

  if (yearLevel === 2) {
    return index - 12;
  }

  if (yearLevel === 3) {
    return index - 25;
  }

  return index - 38;
}

function buildCompletedCourses(
  yearLevel,
  position
) {
  /*
    First-year students have completed
    between zero and six courses.
  */
  if (yearLevel === 1) {
    const completedCount =
      position %
      (
        FIRST_YEAR_FIRST_SEMESTER.length +
        1
      );

    return FIRST_YEAR_FIRST_SEMESTER.slice(
      0,
      completedCount
    );
  }

  /*
    Second-year students completed first year
    and part of second year.
  */
  if (yearLevel === 2) {
    const currentYearCount =
      (position * 2) %
      (
        SECOND_YEAR_FIRST_SEMESTER.length +
        1
      );

    return [
      ...FIRST_YEAR,

      ...SECOND_YEAR_FIRST_SEMESTER.slice(
        0,
        currentYearCount
      )
    ];
  }

  /*
    Third-year students completed the first
    two years and part of third year.
  */
  if (yearLevel === 3) {
    const currentYearCount =
      position %
      (
        THIRD_YEAR_FIRST_SEMESTER.length +
        1
      );

    return [
      ...FIRST_YEAR,
      ...SECOND_YEAR,

      ...THIRD_YEAR_FIRST_SEMESTER.slice(
        0,
        currentYearCount
      )
    ];
  }

  /*
    Fourth-year students completed the first
    three years and part of fourth year.
  */
  const fourthYearCount =
    position %
    (
      FOURTH_YEAR_FIRST_SEMESTER.length +
      1
    );

  const completedCourses = [
    ...FIRST_YEAR,
    ...SECOND_YEAR,
    ...THIRD_YEAR,

    ...FOURTH_YEAR_FIRST_SEMESTER.slice(
      0,
      fourthYearCount
    )
  ];

  /*
    A few final-year students have completed
    the final capstone course.
  */
  if (position >= 9) {
    completedCourses.push(
      ...FOURTH_YEAR_SECOND_SEMESTER
    );
  }

  return completedCourses;
}

function getGroupIds(userId) {
  return mockGroups
    .filter((group) => {
      return group.memberIds.includes(
        userId
      );
    })

    .map((group) => {
      return group.id;
    });
}

function getStudentId(
  yearLevel,
  position
) {
  const cohortYear =
    2027 - yearLevel;

  return (
    `${cohortYear}` +
    `${String(position + 1).padStart(
      3,
      "0"
    )}`
  );
}

function getEmail(studentNumber) {
  if (studentNumber === 1) {
    return "lina@demo.edu";
  }

  if (studentNumber === 2) {
    return "omar@demo.edu";
  }

  return (
    `student` +
    `${String(studentNumber).padStart(
      2,
      "0"
    )}` +
    `@demo.edu`
  );
}

export const mockStudents =
  studentNames.map(
    (name, index) => {
      const studentNumber =
        index + 1;

      const yearLevel =
        getYearLevel(index);

      const position =
        getPositionWithinYear(
          index,
          yearLevel
        );

      const studentId =
        getStudentId(
          yearLevel,
          position
        );

      const userId =
        `USER-` +
        `${String(studentNumber).padStart(
          3,
          "0"
        )}`;

      return {
        id: userId,

        studentId,

        email:
          getEmail(studentNumber),

        name,

        major: MAJOR,

        role: "student",

        yearLevel,

        completedCourses:
          buildCompletedCourses(
            yearLevel,
            position
          ),

        groupIds:
          getGroupIds(userId)
      };
    }
  );