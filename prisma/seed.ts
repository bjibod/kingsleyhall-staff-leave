import { PrismaClient, EmploymentType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const passwordHash = bcrypt.hashSync("Demo-Change-Me-2026!", 12);

const people: Array<[string, string, string, string, EmploymentType, number[]]> = [
  ["KH0001", "Alex", "Admin", "SUPER_ADMIN", "FULL_TIME", [8,8,8,8,8,0,0]],
  ["KH0002", "Harper", "Hughes", "HR_ADMIN", "FULL_TIME", [7,7,7,7,7,0,0]],
  ["KH0003", "Morgan", "Evans", "HR_ADMIN", "PART_TIME", [8,8,8,0,0,0,0]],
  ["KH0010", "Jordan", "Taylor", "MANAGER", "FULL_TIME", [8,8,8,8,8,0,0]],
  ["KH0011", "Casey", "Brown", "MANAGER", "TERM_TIME", [7,7,7,7,7,0,0]],
  ["KH0012", "Riley", "Wilson", "MANAGER", "FULL_TIME", [8,6,0,8,6,0,0]],
  ["KH0101", "Avery", "Davies", "EMPLOYEE", "FULL_TIME", [8,8,8,8,8,0,0]],
  ["KH0102", "Jamie", "Thomas", "EMPLOYEE", "PART_TIME", [8,8,8,0,0,0,0]],
  ["KH0103", "Sam", "Roberts", "EMPLOYEE", "FULL_TIME", [7,7,7,7,7,0,0]],
  ["KH0104", "Drew", "Johnson", "EMPLOYEE", "TERM_TIME", [6,6,6,6,6,0,0]],
  ["KH0105", "Robin", "Lewis", "EMPLOYEE", "FIXED_TERM", [8,6,0,8,6,0,0]],
  ["KH0106", "Cameron", "Walker", "EMPLOYEE", "OTHER", [0,8,8,8,0,0,0]],
  ["KH0107", "Quinn", "Hall", "EMPLOYEE", "FULL_TIME", [8,8,8,8,8,0,0]],
  ["KH0108", "Skyler", "Young", "EMPLOYEE", "PART_TIME", [5,5,5,5,5,0,0]],
  ["KH0109", "Reese", "King", "EMPLOYEE", "FULL_TIME", [8,8,8,8,8,0,0]]
];

async function main() {
  const organisation = await prisma.organisation.upsert({ where: { id: "kingsley-hall-demo" }, update: {}, create: { id: "kingsley-hall-demo", name: "Kingsley Hall", legalName: "Kingsley Hall" } });
  const roles = new Map<string, string>();
  for (const name of ["EMPLOYEE", "MANAGER", "HR_ADMIN", "SUPER_ADMIN"]) {
    const role = await prisma.role.upsert({ where: { name }, update: {}, create: { name, description: `${name} access` } }); roles.set(name, role.id);
  }
  const locationNames = ["Kingsley Hall", "Kinder Kapers Too – Parsloes", "Village Preschool", "Kinder Kapers Too – Ashurst Drive"];
  const departmentNames = ["Childcare", "Finance", "Administration", "Community Services", "Facilities", "Management"];
  const locations = await Promise.all(locationNames.map(name => prisma.location.upsert({ where: { organisationId_name: { organisationId: organisation.id, name } }, update: {}, create: { organisationId: organisation.id, name } })));
  const departments = await Promise.all(departmentNames.map(name => prisma.department.upsert({ where: { organisationId_name: { organisationId: organisation.id, name } }, update: {}, create: { organisationId: organisation.id, name } })));
  const leaveYear = await prisma.leaveYear.upsert({ where: { organisationId_name: { organisationId: organisation.id, name: "2026/27" } }, update: {}, create: { organisationId: organisation.id, name: "2026/27", startDate: new Date("2026-04-01"), endDate: new Date("2027-03-31"), status: "ACTIVE" } });
  const leaveType = await prisma.leaveType.upsert({ where: { organisationId_code: { organisationId: organisation.id, code: "ANNUAL_LEAVE" } }, update: {}, create: { organisationId: organisation.id, name: "Annual Leave", code: "ANNUAL_LEAVE" } });
  const employeeIds = new Map<string, string>();
  for (let index = 0; index < people.length; index++) {
    const [number, firstName, lastName, role, employmentType, hours] = people[index];
    const email = `${firstName}.${lastName}@kingsleyhall.test`.toLowerCase();
    const employee = await prisma.employee.upsert({ where: { organisationId_employeeNumber: { organisationId: organisation.id, employeeNumber: number } }, update: {}, create: { organisationId: organisation.id, employeeNumber: number, firstName, lastName, workEmail: email, jobTitle: role === "EMPLOYEE" ? "Team Member" : role.replace("_", " "), employmentType, startDate: new Date("2024-01-01"), locationId: locations[index % locations.length].id, departmentId: departments[index % 4].id } });
    employeeIds.set(number, employee.id);
    const user = await prisma.user.upsert({ where: { email }, update: { passwordHash }, create: { email, passwordHash, status: "ACTIVE", employeeId: employee.id } });
    await prisma.userRole.upsert({ where: { userId_roleId: { userId: user.id, roleId: roles.get(role)! } }, update: {}, create: { userId: user.id, roleId: roles.get(role)! } });
    if ((await prisma.workingPattern.count({ where: { employeeId: employee.id } })) === 0) await prisma.workingPattern.create({ data: { employeeId: employee.id, mondayHours: hours[0], tuesdayHours: hours[1], wednesdayHours: hours[2], thursdayHours: hours[3], fridayHours: hours[4], saturdayHours: hours[5], sundayHours: hours[6], effectiveFrom: new Date("2024-01-01") } });
    await prisma.leaveEntitlement.upsert({ where: { employeeId_leaveYearId: { employeeId: employee.id, leaveYearId: leaveYear.id } }, update: {}, create: { employeeId: employee.id, leaveYearId: leaveYear.id, entitlementHours: number === "KH0101" ? 80 : 200 } });
  }
  for (const number of people.filter(p => p[3] === "EMPLOYEE").map(p => p[0])) await prisma.employee.update({ where: { id: employeeIds.get(number)! }, data: { managerId: employeeIds.get("KH0010") } });
  const demoEmployee = employeeIds.get("KH0102")!;
  if ((await prisma.leaveRequest.count({ where: { employeeId: demoEmployee } })) === 0) {
    await prisma.leaveRequest.createMany({ data: [
      { employeeId: demoEmployee, leaveTypeId: leaveType.id, startDate: new Date("2026-09-01"), endDate: new Date("2026-09-02"), requestedHours: 16, status: "APPROVED", submittedAt: new Date(), reviewedAt: new Date() },
      { employeeId: demoEmployee, leaveTypeId: leaveType.id, startDate: new Date("2026-10-05"), endDate: new Date("2026-10-06"), requestedHours: 16, status: "PENDING", submittedAt: new Date() },
      { employeeId: demoEmployee, leaveTypeId: leaveType.id, startDate: new Date("2026-06-01"), endDate: new Date("2026-06-01"), requestedHours: 8, status: "REJECTED", submittedAt: new Date(), reviewedAt: new Date(), managerComment: "Coverage unavailable" }
    ] });
  }
}

main().finally(() => prisma.$disconnect());
