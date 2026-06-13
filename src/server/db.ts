import fs from "fs";
import path from "path";
import { User, MedicalReport, AnalysisResult } from "../types";

const DB_FILE = path.join(process.cwd(), "database.json");

interface DatabaseSchema {
  users: User[];
  reports: MedicalReport[];
}

// Ensure the JSON database file exists with initial structure
function initializeDb(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial: DatabaseSchema = { users: [], reports: [] };
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf8");
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(content) as DatabaseSchema;
  } catch (error) {
    console.error("Error initializing JSON Database:", error);
    return { users: [], reports: [] };
  }
}

function saveDb(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    console.error("Error writing JSON Database:", error);
  }
}

export const db = {
  // --- USER OPERATIONS ---
  getUsers(): User[] {
    const data = initializeDb();
    return data.users;
  },

  findUserByEmail(email: string): User | undefined {
    const users = this.getUsers();
    return users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  findUserById(id: string): User | undefined {
    const users = this.getUsers();
    return users.find((u) => u.id === id);
  },

  createUser(user: Omit<User, "id" | "createdAt"> & { password?: string }): User {
    const data = initializeDb();
    const newUser: User = {
      ...user,
      id: "usr_" + Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
    };
    
    data.users.push(newUser);
    saveDb(data);
    
    // Hide password before returning
    const { password, ...safeUser } = newUser;
    return safeUser as User;
  },

  verifyUser(email: string, passwordHash: string): User | null {
    const data = initializeDb();
    const found = data.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === passwordHash
    );
    if (!found) return null;
    const { password, ...safeUser } = found;
    return safeUser as User;
  },

  // --- REPORT OPERATIONS ---
  getReports(userId: string): MedicalReport[] {
    const data = initializeDb();
    return data.reports
      .filter((r) => r.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createReport(report: Omit<MedicalReport, "id" | "createdAt">): MedicalReport {
    const data = initializeDb();
    const newReport: MedicalReport = {
      ...report,
      id: "rep_" + Math.random().toString(36).substring(2, 11),
      createdAt: new Date().toISOString(),
    };

    data.reports.push(newReport);
    saveDb(data);
    return newReport;
  },

  deleteReport(reportId: string, userId: string): boolean {
    const data = initializeDb();
    const index = data.reports.findIndex((r) => r.id === reportId && r.userId === userId);
    if (index === -1) return false;
    data.reports.splice(index, 1);
    saveDb(data);
    return true;
  }
};
