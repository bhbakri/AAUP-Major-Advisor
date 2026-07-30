import {
  randomBytes,
  scryptSync,
  timingSafeEqual
} from "node:crypto";

import { degreePlans } from "../data/courseData.js";
import { mockStudents } from "../data/mockStudents.js";
import { mockGroups } from "../data/mockGroups.js";

function cleanText(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function createId(prefix) {
  return (
    `${prefix}-${Date.now()}-` +
    randomBytes(4).toString("hex")
  );
}

function createPasswordRecord(password) {
  const salt =
    randomBytes(16).toString("hex");

  const hash =
    scryptSync(
      password,
      salt,
      64
    ).toString("hex");

  return {
    salt,
    hash
  };
}

function passwordMatches(
  password,
  record
) {
  if (!record?.salt || !record?.hash) {
    return false;
  }

  const calculated =
    scryptSync(
      password,
      record.salt,
      64
    );

  const stored =
    Buffer.from(
      record.hash,
      "hex"
    );

  return (
    calculated.length === stored.length &&
    timingSafeEqual(calculated, stored)
  );
}

// const users = [
//   {
//     id: "ADMIN-001",
//     studentId: "1",
//     email: "Admin",
//     name: "Admin",
//     major: "All",
//     role: "admin",

//     password:
//       createPasswordRecord("123456"),

//     completedCourses: [],
//     groupIds: []
//   },

//   {
//     id: "USER-001",
//     studentId: "2026001",
//     email: "lina@demo.edu",
//     name: "Lina Hassan",

//     major:
//       "Artificial Intelligence and Robotics",

//     role: "student",

//     password:
//       createPasswordRecord("demo123"),

//     completedCourses: [
//       "100411010",
//       "290311110",
//       "290311210"
//     ],

//     groupIds: [
//       "GROUP-AI-1",
//       "GROUP-AI-2"
//     ]
//   },

//   {
//     id: "USER-002",
//     studentId: "2026002",
//     email: "omar@demo.edu",
//     name: "Omar Khalil",

//     major:
//       "Artificial Intelligence and Robotics",

//     role: "student",

//     password:
//       createPasswordRecord("demo123"),

//     completedCourses: [
//       "100411010",
//       "290311110"
//     ],

//     groupIds: [
//       "GROUP-AI-1"
//     ]
//   }
// ];

const users = [
  {
    id: "ADMIN-001",
    studentId: "1",
    email: "Admin",
    name: "Admin",
    major: "All",
    role: "admin",

    password:
      createPasswordRecord("123456"),

    completedCourses: [],
    groupIds: []
  },

  ...mockStudents.map((student) => {
    return {
      ...student,

      password:
        createPasswordRecord(
          "demo123"
        )
    };
  })
];

const groups =
  mockGroups.map((group) => {
    return {
      id: group.id,
      name: group.name,
      major: group.major,

      creatorUserId:
        group.creatorUserId,

      password:
        group.password
          ? createPasswordRecord(
              group.password
            )
          : null
    };
  });
const sessions = new Map();

function isAdmin(user) {
  return user?.role === "admin";
}

function getMajorCourses(major) {
  return degreePlans[major] ?? [];
}

function getCompletedCreditHours(user) {
  if (isAdmin(user)) {
    return 0;
  }

  const courseMap =
    new Map(
      getMajorCourses(user.major).map(
        (course) => {
          return [
            course.code,
            course
          ];
        }
      )
    );

  const uniqueCompletedCourses =
    [...new Set(user.completedCourses)];

  return uniqueCompletedCourses.reduce(
    (total, courseCode) => {
      const course =
        courseMap.get(courseCode);

      return (
        total +
        Number(course?.credits ?? 0)
      );
    },
    0
  );
}

function publicUser(user) {
  return {
    id: user.id,
    studentId: user.studentId,
    email: user.email,
    name: user.name,
    major: user.major,

    role:
      user.role ?? "student",

    isAdmin:
      isAdmin(user),

    creditHoursCompleted:
      getCompletedCreditHours(user),

    completedCourses: [
      ...user.completedCourses
    ],

    groupIds: [
      ...user.groupIds
    ]
  };
}

function getUserByIdentifier(
  identifier
) {
  const normalized =
    cleanText(identifier).toLowerCase();

  return users.find((user) => {
    return (
      user.studentId.toLowerCase() ===
        normalized ||

      user.email.toLowerCase() ===
        normalized
    );
  });
}

function getGroupMembers(groupId) {
  return users.filter((user) => {
    return user.groupIds.includes(
      groupId
    );
  });
}

function getGroupCreator(group) {
  return users.find((user) => {
    return (
      user.id ===
      group.creatorUserId
    );
  });
}

function publicGroup(
  group,
  currentUser
) {
  const creator =
    getGroupCreator(group);

  return {
    id: group.id,
    name: group.name,
    major: group.major,

    memberCount:
      getGroupMembers(
        group.id
      ).length,

    locked:
      Boolean(group.password),

    creatorName:
      creator?.name ?? "Unknown",

    isCreator:
      group.creatorUserId ===
      currentUser.id,

    isMember:
      currentUser.groupIds.includes(
        group.id
      )
  };
}

function getRemainingCourses(user) {
  return getMajorCourses(
    user.major
  ).filter((course) => {
    return (
      !user.completedCourses.includes(
        course.code
      )
    );
  });
}

function analyzeGroup(
  groupId,
  currentUser
) {
  const group =
    groups.find((item) => {
      return item.id === groupId;
    });

  if (!group) {
    throw new Error(
      "Group not found."
    );
  }

  if (
    !isAdmin(currentUser) &&
    group.major !==
      currentUser.major
  ) {
    throw new Error(
      "This group belongs to a different major."
    );
  }

  const members =
    getGroupMembers(groupId);

  const requiredCourses =
    getMajorCourses(group.major);

  const needCounts = {};

  for (const member of members) {
    const remainingCourses =
      getRemainingCourses(member);

    for (
      const course
      of remainingCourses
    ) {
      needCounts[course.code] =
        (needCounts[course.code] ?? 0) +
        1;
    }
  }

  const sharedCourses =
    members.length === 0
      ? []
      : requiredCourses.filter(
          (course) => {
            return (
              needCounts[course.code] ===
              members.length
            );
          }
        );

  const mostNeededCourses =
    requiredCourses
      .filter((course) => {
        const count =
          needCounts[course.code] ?? 0;

        return (
          count > members.length / 2 &&
          count < members.length
        );
      })

      .map((course) => ({
        ...course,

        studentCount:
          needCounts[course.code]
      }))

      .sort((first, second) => {
        return (
          second.studentCount -
          first.studentCount
        );
      });

  return {
    group:
      publicGroup(
        group,
        currentUser
      ),

    members:
      members.map((member) => ({
        id: member.id,
        studentId: member.studentId,
        name: member.name,

        remainingCourseCount:
          getRemainingCourses(
            member
          ).length
      })),

    sharedCourses,
    mostNeededCourses
  };
}
export function getAllSharedCourseData() {
  /*
    Use an administrator account as the internal
    viewer so every group can be analyzed.
  */
  const adminViewer =
    users.find((user) => {
      return isAdmin(user);
    }) ?? {
      id: "SYSTEM",
      role: "admin",
      groupIds: []
    };

  const accounts =
    users.map((user) => {
      return {
        id: user.id,
        name: user.name,
        studentId: user.studentId,
        email: user.email,
        major: user.major,

        role:
          user.role ?? "student",

        isAdmin:
          isAdmin(user),

        creditHoursCompleted:
          getCompletedCreditHours(user),

        completedCourses: [
          ...user.completedCourses
        ],

        groupIds: [
          ...user.groupIds
        ]
      };
    });

  const majors =
    Object.entries(degreePlans).map(
      ([majorName, courses]) => {
        return {
          name: majorName,

          courses:
            courses.map((course) => ({
              ...course
            }))
        };
      }
    );

  const allGroups =
    groups.map((group) => {
      const creator =
        getGroupCreator(group);

      const analysis =
        analyzeGroup(
          group.id,
          adminViewer
        );

      return {
        id: group.id,
        name: group.name,
        major: group.major,

        creatorUserId:
          group.creatorUserId,

        creatorName:
          creator?.name ?? "Unknown",

        locked:
          Boolean(group.password),

        memberCount:
          analysis.members.length,

        members:
          analysis.members.map(
            (member) => ({
              id: member.id,
              name: member.name,
              studentId:
                member.studentId,

              remainingCourseCount:
                member.remainingCourseCount
            })
          ),

        sharedCourses:
          analysis.sharedCourses.map(
            (course) => ({
              ...course
            })
          ),

        mostNeededCourses:
          analysis.mostNeededCourses.map(
            (course) => ({
              ...course
            })
          )
      };
    });

  return {
    generatedAt:
      new Date().toISOString(),

    summary: {
      accountCount:
        accounts.length,

      studentCount:
        accounts.filter(
          (account) => {
            return !account.isAdmin;
          }
        ).length,

      adminCount:
        accounts.filter(
          (account) => {
            return account.isAdmin;
          }
        ).length,

      majorCount:
        majors.length,

      courseCount:
        majors.reduce(
          (total, major) => {
            return (
              total +
              major.courses.length
            );
          },
          0
        ),

      groupCount:
        allGroups.length
    },

    accounts,
    majors,
    groups: allGroups
  };
}
function createSession(userId) {
  const token =
    randomBytes(32).toString("hex");

  sessions.set(token, {
    userId,
    createdAt: Date.now()
  });

  return token;
}

function getBearerToken(req) {
  const authorization =
    cleanText(
      req.headers.authorization
    );

  if (
    !authorization
      .toLowerCase()
      .startsWith("bearer ")
  ) {
    return "";
  }

  return authorization
    .slice(7)
    .trim();
}

function requireAuthentication(
  req,
  res,
  next
) {
  const token =
    getBearerToken(req);

  const session =
    sessions.get(token);

  const user =
    session
      ? users.find((item) => {
          return (
            item.id ===
            session.userId
          );
        })
      : null;

  if (!token || !session || !user) {
    res.status(401).json({
      error:
        "Please sign in to continue."
    });

    return;
  }

  req.authToken = token;
  req.user = user;

  next();
}

function requireAdmin(
  req,
  res,
  next
) {
  if (!isAdmin(req.user)) {
    res.status(403).json({
      error:
        "Administrator access is required."
    });

    return;
  }

  next();
}

export function registerSharedCourseRoutes(
  app
) {
  app.get(
    "/api/shared-courses/majors",

    (req, res) => {
      res.json(
        Object.keys(degreePlans)
      );
    }
  );

  app.post(
    "/api/shared-courses/auth/register",

    (req, res) => {
      const name =
        cleanText(req.body?.name);

      const studentId =
        cleanText(
          req.body?.studentId
        );

      const email =
        cleanText(
          req.body?.email
        ).toLowerCase();

      const major =
        cleanText(req.body?.major);

      const password =
        cleanText(
          req.body?.password
        );

      if (
        !name ||
        !studentId ||
        !email ||
        !major ||
        !password
      ) {
        res.status(400).json({
          error:
            "Name, student ID, email, major, and password are required."
        });

        return;
      }

      if (!email.includes("@")) {
        res.status(400).json({
          error:
            "Enter a valid email address."
        });

        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          error:
            "The password must contain at least 6 characters."
        });

        return;
      }

      if (!degreePlans[major]) {
        res.status(400).json({
          error:
            "The selected major does not exist."
        });

        return;
      }

      const duplicate =
        users.find((user) => {
          return (
            user.studentId
              .toLowerCase() ===
              studentId.toLowerCase() ||

            user.email.toLowerCase() ===
              email
          );
        });

      if (duplicate) {
        res.status(409).json({
          error:
            "That student ID or email is already registered."
        });

        return;
      }

      const user = {
        id: createId("USER"),
        studentId,
        email,
        name,
        major,
        role: "student",

        password:
          createPasswordRecord(
            password
          ),

        completedCourses: [],
        groupIds: []
      };

      users.push(user);

      const token =
        createSession(user.id);

      res.status(201).json({
        token,
        user: publicUser(user)
      });
    }
  );

  app.post(
    "/api/shared-courses/auth/login",

    (req, res) => {
      const identifier =
        cleanText(
          req.body?.identifier
        );

      const password =
        cleanText(
          req.body?.password
        );

      const user =
        getUserByIdentifier(
          identifier
        );

      if (
        !identifier ||
        !password ||
        !user ||
        !passwordMatches(
          password,
          user.password
        )
      ) {
        res.status(401).json({
          error:
            "The student ID/email or password is incorrect."
        });

        return;
      }

      const token =
        createSession(user.id);

      res.json({
        token,
        user: publicUser(user)
      });
    }
  );

  app.get(
    "/api/shared-courses/auth/me",
    requireAuthentication,

    (req, res) => {
      res.json({
        user:
          publicUser(req.user)
      });
    }
  );

  app.get(
    "/api/shared-courses/admin/dashboard",
    requireAuthentication,
    requireAdmin,

    (req, res) => {
      const students =
        users
          .filter((user) => {
            return !isAdmin(user);
          })

          .map((user) => ({
            id: user.id,
            name: user.name,
            studentId: user.studentId,
            email: user.email,
            major: user.major,

            creditHoursCompleted:
              getCompletedCreditHours(
                user
              ),

            completedCourseCount:
              user.completedCourses.length,

            groupCount:
              user.groupIds.length
          }));

      const groupAnalyses =
        groups.map((group) => {
          return analyzeGroup(
            group.id,
            req.user
          );
        });

      res.json({
        students,
        groups: groupAnalyses
      });
    }
  );

  app.post(
    "/api/shared-courses/auth/logout",
    requireAuthentication,

    (req, res) => {
      sessions.delete(
        req.authToken
      );

      res.json({
        message: "Signed out."
      });
    }
  );

  app.get(
    "/api/shared-courses/courses",
    requireAuthentication,

    (req, res) => {
      res.json(
        getMajorCourses(
          req.user.major
        )
      );
    }
  );

  app.put(
    "/api/shared-courses/me/completed-courses",
    requireAuthentication,

    (req, res) => {
      const completedCourses =
        Array.isArray(
          req.body?.completedCourses
        )
          ? req.body.completedCourses
          : null;

      if (!completedCourses) {
        res.status(400).json({
          error:
            "completedCourses must be an array."
        });

        return;
      }

      const validCodes =
        getMajorCourses(
          req.user.major
        ).map((course) => {
          return course.code;
        });

      const invalidCode =
        completedCourses.find(
          (courseCode) => {
            return (
              !validCodes.includes(
                courseCode
              )
            );
          }
        );

      if (invalidCode) {
        res.status(400).json({
          error:
            `${invalidCode} is not part of this student's major.`
        });

        return;
      }

      req.user.completedCourses = [
        ...new Set(
          completedCourses
        )
      ];

      res.json({
        user:
          publicUser(req.user)
      });
    }
  );

  app.get(
    "/api/shared-courses/groups",
    requireAuthentication,

    (req, res) => {
      const matchingGroups =
        groups
          .filter((group) => {
            return (
              isAdmin(req.user) ||
              group.major ===
                req.user.major
            );
          })

          .map((group) => {
            return publicGroup(
              group,
              req.user
            );
          });

      res.json(matchingGroups);
    }
  );

  app.post(
    "/api/shared-courses/groups",
    requireAuthentication,

    (req, res) => {
      const name =
        cleanText(req.body?.name);

      const password =
        cleanText(
          req.body?.password
        );

      const requestedMajor =
        cleanText(
          req.body?.major
        );

      const groupMajor =
        isAdmin(req.user)
          ? requestedMajor
          : req.user.major;

      if (!name) {
        res.status(400).json({
          error:
            "Group name is required."
        });

        return;
      }

      if (
        !groupMajor ||
        !degreePlans[groupMajor]
      ) {
        res.status(400).json({
          error:
            "Select a valid major for the group."
        });

        return;
      }

      const duplicate =
        groups.find((group) => {
          return (
            group.major ===
              groupMajor &&

            group.name
              .toLowerCase() ===
              name.toLowerCase()
          );
        });

      if (duplicate) {
        res.status(409).json({
          error:
            "A group with that name already exists for this major."
        });

        return;
      }

      const group = {
        id: createId("GROUP"),
        name,
        major: groupMajor,

        creatorUserId:
          req.user.id,

        password:
          password
            ? createPasswordRecord(
                password
              )
            : null
      };

      groups.push(group);

      /*
        Student creators become members.
        Admin creators do not count as students.
      */
      if (!isAdmin(req.user)) {
        req.user.groupIds.push(
          group.id
        );
      }

      res.status(201).json(
        publicGroup(
          group,
          req.user
        )
      );
    }
  );

  app.post(
    "/api/shared-courses/groups/:groupId/join",
    requireAuthentication,

    (req, res) => {
      const group =
        groups.find((item) => {
          return (
            item.id ===
            req.params.groupId
          );
        });

      if (!group) {
        res.status(404).json({
          error:
            "Group not found."
        });

        return;
      }

      if (isAdmin(req.user)) {
        res.status(400).json({
          error:
            "Administrators can view groups without joining them."
        });

        return;
      }

      if (
        group.major !==
        req.user.major
      ) {
        res.status(403).json({
          error:
            "Students can only join groups for their major."
        });

        return;
      }

      if (
        req.user.groupIds.includes(
          group.id
        )
      ) {
        res.json({
          message:
            "The student is already in this group.",

          group:
            publicGroup(
              group,
              req.user
            )
        });

        return;
      }

      if (group.password) {
        const password =
          cleanText(
            req.body?.password
          );

        if (
          !passwordMatches(
            password,
            group.password
          )
        ) {
          res.status(403).json({
            error:
              "Incorrect group password."
          });

          return;
        }
      }

      req.user.groupIds.push(
        group.id
      );

      res.json({
        message: "Group joined.",

        group:
          publicGroup(
            group,
            req.user
          )
      });
    }
  );

  app.post(
    "/api/shared-courses/groups/:groupId/leave",
    requireAuthentication,

    (req, res) => {
      const group =
        groups.find((item) => {
          return (
            item.id ===
            req.params.groupId
          );
        });

      if (!group) {
        res.status(404).json({
          error:
            "Group not found."
        });

        return;
      }

      if (
        group.creatorUserId ===
        req.user.id
      ) {
        res.status(400).json({
          error:
            "The creator must delete the group instead of leaving it."
        });

        return;
      }

      req.user.groupIds =
        req.user.groupIds.filter(
          (groupId) => {
            return (
              groupId !== group.id
            );
          }
        );

      res.json({
        message: "Group left."
      });
    }
  );

  app.delete(
    "/api/shared-courses/groups/:groupId",
    requireAuthentication,

    (req, res) => {
      const groupIndex =
        groups.findIndex((item) => {
          return (
            item.id ===
            req.params.groupId
          );
        });

      if (groupIndex === -1) {
        res.status(404).json({
          error:
            "Group not found."
        });

        return;
      }

      const group =
        groups[groupIndex];

      if (
        group.creatorUserId !==
        req.user.id
      ) {
        res.status(403).json({
          error:
            "Only the group creator can delete this group."
        });

        return;
      }

      groups.splice(
        groupIndex,
        1
      );

      for (const user of users) {
        user.groupIds =
          user.groupIds.filter(
            (groupId) => {
              return (
                groupId !==
                group.id
              );
            }
          );
      }

      res.json({
        message:
          "Group deleted."
      });
    }
  );

  app.get(
    "/api/shared-courses/groups/:groupId/analysis",
    requireAuthentication,

    (req, res) => {
      try {
        const result =
          analyzeGroup(
            req.params.groupId,
            req.user
          );

        res.json(result);
      } catch (error) {
        res.status(404).json({
          error: error.message
        });
      }
    }
  );
}