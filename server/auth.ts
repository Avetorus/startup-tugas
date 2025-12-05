import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import type {
  User,
  Company,
  Role,
  JWTAccessTokenPayload,
  JWTRefreshTokenPayload,
  AuthContext,
  LoginResponse,
  RefreshResponse,
  CompanyLevel,
  InsertRefreshToken,
  InsertAuthAuditLog,
} from "@shared/schema";
import { COMPANY_LEVELS, AUTH_EVENTS } from "@shared/schema";

// ============================================================================
// AUTH CONFIGURATION
// ============================================================================

const JWT_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET || "unanza-jwt-secret-change-in-production";
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET + "-refresh";

const ACCESS_TOKEN_EXPIRES_IN = 15 * 60; // 15 minutes in seconds
const REFRESH_TOKEN_EXPIRES_IN = 7 * 24 * 60 * 60; // 7 days in seconds

const SALT_ROUNDS = 12;

// ============================================================================
// PASSWORD UTILITIES
// ============================================================================

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ============================================================================
// JWT TOKEN UTILITIES
// ============================================================================

export function generateAccessToken(payload: Omit<JWTAccessTokenPayload, "iat" | "exp" | "jti">): string {
  const jti = crypto.randomUUID();
  return jwt.sign(
    { ...payload, jti },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
}

export function generateRefreshToken(payload: Omit<JWTRefreshTokenPayload, "iat" | "exp">): string {
  return jwt.sign(
    payload,
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
  );
}

export function verifyAccessToken(token: string): JWTAccessTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTAccessTokenPayload;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): JWTRefreshTokenPayload | null {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as JWTRefreshTokenPayload;
  } catch (error) {
    return null;
  }
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// ============================================================================
// HIERARCHY-BASED ACCESS CALCULATION
// ============================================================================

/**
 * Calculate allowed company IDs based on user's position in the hierarchy
 * - Branch (level 3): Can only access its own data
 * - Subsidiary (level 2): Can access its own data + all child Branches
 * - Holding (level 1): Can access all Subsidiaries and their Branches
 */
export async function calculateAllowedCompanyIds(
  activeCompanyId: string,
  allCompanies?: Company[]
): Promise<{ allowedCompanyIds: string[]; companyLevel: CompanyLevel; canConsolidate: boolean }> {
  const companies = allCompanies || await storage.getAllCompanies();
  const activeCompany = companies.find(c => c.id === activeCompanyId);
  
  if (!activeCompany) {
    return { 
      allowedCompanyIds: [], 
      companyLevel: COMPANY_LEVELS.BRANCH, 
      canConsolidate: false 
    };
  }

  const companyLevel = activeCompany.level as CompanyLevel;
  let allowedCompanyIds: string[] = [];
  let canConsolidate = false;

  switch (companyLevel) {
    case COMPANY_LEVELS.HOLDING:
      // Holding can see all companies in its hierarchy (path starts with this company's path)
      allowedCompanyIds = companies
        .filter(c => c.path.startsWith(activeCompany.path))
        .map(c => c.id);
      canConsolidate = true;
      break;

    case COMPANY_LEVELS.SUBSIDIARY:
      // Subsidiary can see itself + all its Branches
      allowedCompanyIds = companies
        .filter(c => c.path.startsWith(activeCompany.path))
        .map(c => c.id);
      canConsolidate = true; // Can consolidate its branches
      break;

    case COMPANY_LEVELS.BRANCH:
      // Branch can only see itself
      allowedCompanyIds = [activeCompanyId];
      canConsolidate = false;
      break;
  }

  return { allowedCompanyIds, companyLevel, canConsolidate };
}

// ============================================================================
// AUTH SERVICE
// ============================================================================

export interface AuthResult {
  success: boolean;
  error?: string;
  loginResponse?: LoginResponse;
  refreshToken?: string;
}

export async function authenticateUser(
  username: string,
  password: string,
  requestedCompanyId?: string,
  ipAddress?: string,
  deviceInfo?: string
): Promise<AuthResult> {
  // Find user
  const user = await storage.getUserByUsername(username);
  if (!user) {
    await logAuthEvent({
      userId: null,
      eventType: AUTH_EVENTS.LOGIN_FAILED,
      companyId: null,
      ipAddress: ipAddress || null,
      deviceInfo: deviceInfo || null,
      success: false,
      failureReason: "User not found",
    });
    return { success: false, error: "Invalid username or password" };
  }

  // Verify password
  const isValidPassword = await verifyPassword(password, user.password);
  if (!isValidPassword) {
    await logAuthEvent({
      userId: user.id,
      eventType: AUTH_EVENTS.LOGIN_FAILED,
      companyId: null,
      ipAddress: ipAddress || null,
      deviceInfo: deviceInfo || null,
      success: false,
      failureReason: "Invalid password",
    });
    return { success: false, error: "Invalid username or password" };
  }

  // Check if user is active
  if (!user.isActive) {
    await logAuthEvent({
      userId: user.id,
      eventType: AUTH_EVENTS.LOGIN_FAILED,
      companyId: null,
      ipAddress: ipAddress || null,
      deviceInfo: deviceInfo || null,
      success: false,
      failureReason: "User account is disabled",
    });
    return { success: false, error: "Account is disabled" };
  }

  // Get user's company assignments
  const userCompanies = await storage.getUserCompanies(user.id);
  if (userCompanies.length === 0) {
    await logAuthEvent({
      userId: user.id,
      eventType: AUTH_EVENTS.LOGIN_FAILED,
      companyId: null,
      ipAddress: ipAddress || null,
      deviceInfo: deviceInfo || null,
      success: false,
      failureReason: "No company assignments",
    });
    return { success: false, error: "User has no company assignments" };
  }

  // Determine active company
  let activeCompanyId: string;
  if (requestedCompanyId) {
    // Check if user has access to requested company
    const hasAccess = userCompanies.some(c => c.id === requestedCompanyId);
    if (!hasAccess) {
      return { success: false, error: "User does not have access to the requested company" };
    }
    activeCompanyId = requestedCompanyId;
  } else {
    // Use default company or first assigned company
    activeCompanyId = user.defaultCompanyId || userCompanies[0].id;
  }

  const activeCompany = userCompanies.find(c => c.id === activeCompanyId) || userCompanies[0];

  // Get user's role for the active company
  const roleAssignment = await storage.getUserCompanyRole(user.id, activeCompanyId);
  const role = roleAssignment ? await storage.getRole(roleAssignment.roleId) : null;
  const permissions = role ? (role.permissions as string[]) : [];

  // Calculate allowed company IDs based on hierarchy
  const allCompanies = await storage.getAllCompanies();
  const { allowedCompanyIds, companyLevel, canConsolidate } = await calculateAllowedCompanyIds(
    activeCompanyId,
    allCompanies
  );

  // Generate access token
  const accessToken = generateAccessToken({
    userId: user.id,
    username: user.username,
    activeCompanyId,
    roleId: role?.id || null,
    allowedCompanyIds,
    companyLevel,
    permissions,
  });

  // Create refresh token
  const refreshTokenId = crypto.randomUUID();
  const refreshToken = generateRefreshToken({
    userId: user.id,
    tokenId: refreshTokenId,
    tokenVersion: 1,
  });

  // Store refresh token in database
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN * 1000);
  await storage.createRefreshToken({
    userId: user.id,
    tokenHash: hashToken(refreshToken),
    activeCompanyId,
    deviceInfo: deviceInfo || null,
    ipAddress: ipAddress || null,
    expiresAt,
    tokenVersion: 1,
  });

  // Update user's last login
  await storage.updateUser(user.id, { lastLoginAt: new Date() });

  // Log successful login
  await logAuthEvent({
    userId: user.id,
    eventType: AUTH_EVENTS.LOGIN,
    companyId: activeCompanyId,
    ipAddress: ipAddress || null,
    deviceInfo: deviceInfo || null,
    success: true,
  });

  const loginResponse: LoginResponse = {
    accessToken,
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
    },
    activeCompany: {
      id: activeCompany.id,
      code: activeCompany.code,
      name: activeCompany.name,
      companyType: activeCompany.companyType,
      level: activeCompany.level,
    },
    role: role ? {
      id: role.id,
      name: role.name,
      permissions: permissions,
    } : null,
    allowedCompanyIds,
    companyLevel,
    canConsolidate,
  };

  return {
    success: true,
    loginResponse,
    refreshToken,
  };
}

export async function refreshAccessToken(
  refreshToken: string,
  ipAddress?: string,
  deviceInfo?: string
): Promise<{ success: boolean; error?: string; response?: RefreshResponse; newRefreshToken?: string }> {
  // Verify refresh token
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    return { success: false, error: "Invalid or expired refresh token" };
  }

  // Check if refresh token exists in database and is not revoked
  const tokenHash = hashToken(refreshToken);
  const storedToken = await storage.getRefreshTokenByHash(tokenHash);
  if (!storedToken || storedToken.revokedAt) {
    await logAuthEvent({
      userId: payload.userId,
      eventType: AUTH_EVENTS.REFRESH_FAILED,
      companyId: null,
      ipAddress: ipAddress || null,
      deviceInfo: deviceInfo || null,
      success: false,
      failureReason: storedToken?.revokedAt ? "Token revoked" : "Token not found",
    });
    return { success: false, error: "Refresh token is invalid or has been revoked" };
  }

  // Check if token has expired
  if (new Date(storedToken.expiresAt) < new Date()) {
    return { success: false, error: "Refresh token has expired" };
  }

  // Get user
  const user = await storage.getUser(payload.userId);
  if (!user || !user.isActive) {
    return { success: false, error: "User not found or account disabled" };
  }

  // Get active company from stored token
  const activeCompanyId = storedToken.activeCompanyId || user.defaultCompanyId;
  if (!activeCompanyId) {
    return { success: false, error: "No active company" };
  }

  const activeCompany = await storage.getCompany(activeCompanyId);
  if (!activeCompany) {
    return { success: false, error: "Company not found" };
  }

  // Get role for the company
  const roleAssignment = await storage.getUserCompanyRole(user.id, activeCompanyId);
  const role = roleAssignment ? await storage.getRole(roleAssignment.roleId) : null;
  const permissions = role ? (role.permissions as string[]) : [];

  // Recalculate allowed company IDs
  const { allowedCompanyIds, companyLevel } = await calculateAllowedCompanyIds(activeCompanyId);

  // Revoke old refresh token (token rotation)
  await storage.revokeRefreshToken(storedToken.id, "rotation");

  // Create new refresh token
  const newRefreshTokenId = crypto.randomUUID();
  const newRefreshToken = generateRefreshToken({
    userId: user.id,
    tokenId: newRefreshTokenId,
    tokenVersion: (storedToken.tokenVersion || 1) + 1,
  });

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN * 1000);
  await storage.createRefreshToken({
    userId: user.id,
    tokenHash: hashToken(newRefreshToken),
    activeCompanyId,
    deviceInfo: deviceInfo || storedToken.deviceInfo || null,
    ipAddress: ipAddress || storedToken.ipAddress || null,
    expiresAt,
    tokenVersion: (storedToken.tokenVersion || 1) + 1,
  });

  // Generate new access token
  const accessToken = generateAccessToken({
    userId: user.id,
    username: user.username,
    activeCompanyId,
    roleId: role?.id || null,
    allowedCompanyIds,
    companyLevel,
    permissions,
  });

  // Log refresh event
  await logAuthEvent({
    userId: user.id,
    eventType: AUTH_EVENTS.REFRESH,
    companyId: activeCompanyId,
    ipAddress: ipAddress || null,
    deviceInfo: deviceInfo || null,
    success: true,
  });

  return {
    success: true,
    response: {
      accessToken,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    },
    newRefreshToken,
  };
}

export async function logout(
  refreshToken: string,
  ipAddress?: string,
  deviceInfo?: string
): Promise<{ success: boolean }> {
  const tokenHash = hashToken(refreshToken);
  const storedToken = await storage.getRefreshTokenByHash(tokenHash);
  
  if (storedToken) {
    await storage.revokeRefreshToken(storedToken.id, "logout");
    
    await logAuthEvent({
      userId: storedToken.userId,
      eventType: AUTH_EVENTS.LOGOUT,
      companyId: storedToken.activeCompanyId || null,
      ipAddress: ipAddress || null,
      deviceInfo: deviceInfo || null,
      success: true,
    });
  }

  return { success: true };
}

export async function logoutAllDevices(userId: string): Promise<void> {
  await storage.revokeAllUserRefreshTokens(userId, "logout_all_devices");
}

// ============================================================================
// COMPANY SWITCHING
// ============================================================================

export async function switchCompany(
  userId: string,
  newCompanyId: string,
  currentRefreshToken: string,
  ipAddress?: string,
  deviceInfo?: string
): Promise<{ success: boolean; error?: string; loginResponse?: LoginResponse; refreshToken?: string }> {
  // Verify user has access to new company
  const userCompanies = await storage.getUserCompanies(userId);
  const hasAccess = userCompanies.some(c => c.id === newCompanyId);
  
  if (!hasAccess) {
    return { success: false, error: "User does not have access to this company" };
  }

  const user = await storage.getUser(userId);
  if (!user) {
    return { success: false, error: "User not found" };
  }

  const newCompany = await storage.getCompany(newCompanyId);
  if (!newCompany) {
    return { success: false, error: "Company not found" };
  }

  // Get role for new company
  const roleAssignment = await storage.getUserCompanyRole(userId, newCompanyId);
  const role = roleAssignment ? await storage.getRole(roleAssignment.roleId) : null;
  const permissions = role ? (role.permissions as string[]) : [];

  // Calculate allowed companies for new context
  const allCompanies = await storage.getAllCompanies();
  const { allowedCompanyIds, companyLevel, canConsolidate } = await calculateAllowedCompanyIds(
    newCompanyId,
    allCompanies
  );

  // Revoke old refresh token
  const tokenHash = hashToken(currentRefreshToken);
  const storedToken = await storage.getRefreshTokenByHash(tokenHash);
  if (storedToken) {
    await storage.revokeRefreshToken(storedToken.id, "company_switch");
  }

  // Generate new tokens for new company context
  const accessToken = generateAccessToken({
    userId: user.id,
    username: user.username,
    activeCompanyId: newCompanyId,
    roleId: role?.id || null,
    allowedCompanyIds,
    companyLevel,
    permissions,
  });

  const refreshTokenId = crypto.randomUUID();
  const newRefreshToken = generateRefreshToken({
    userId: user.id,
    tokenId: refreshTokenId,
    tokenVersion: 1,
  });

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN * 1000);
  await storage.createRefreshToken({
    userId: user.id,
    tokenHash: hashToken(newRefreshToken),
    activeCompanyId: newCompanyId,
    deviceInfo: deviceInfo || null,
    ipAddress: ipAddress || null,
    expiresAt,
    tokenVersion: 1,
  });

  // Log company switch
  await logAuthEvent({
    userId: user.id,
    eventType: AUTH_EVENTS.COMPANY_SWITCHED,
    companyId: newCompanyId,
    ipAddress: ipAddress || null,
    deviceInfo: deviceInfo || null,
    success: true,
    metadata: { previousCompanyId: storedToken?.activeCompanyId },
  });

  const loginResponse: LoginResponse = {
    accessToken,
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
    },
    activeCompany: {
      id: newCompany.id,
      code: newCompany.code,
      name: newCompany.name,
      companyType: newCompany.companyType,
      level: newCompany.level,
    },
    role: role ? {
      id: role.id,
      name: role.name,
      permissions: permissions,
    } : null,
    allowedCompanyIds,
    companyLevel,
    canConsolidate,
  };

  return {
    success: true,
    loginResponse,
    refreshToken: newRefreshToken,
  };
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

async function logAuthEvent(event: Omit<InsertAuthAuditLog, "createdAt">): Promise<void> {
  try {
    await storage.createAuthAuditLog(event);
  } catch (error) {
    console.error("Failed to log auth event:", error);
  }
}

// ============================================================================
// EXPRESS MIDDLEWARE
// ============================================================================

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext;
    }
  }
}

/**
 * Authentication middleware that validates JWT access tokens
 * and attaches auth context to the request
 */
export function authenticateJWT(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "No access token provided" });
    return;
  }

  const token = authHeader.substring(7);
  const payload = verifyAccessToken(token);
  
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired access token" });
    return;
  }

  // Attach minimal auth context from token
  // Full context will be loaded by loadAuthContext middleware if needed
  (req as any).tokenPayload = payload;
  next();
}

/**
 * Middleware that loads full auth context from database
 * Use after authenticateJWT when you need the full user/company objects
 */
export async function loadAuthContext(req: Request, res: Response, next: NextFunction): Promise<void> {
  const payload = (req as any).tokenPayload as JWTAccessTokenPayload;
  
  if (!payload) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  try {
    const [user, activeCompany, roleResult] = await Promise.all([
      storage.getUser(payload.userId),
      storage.getCompany(payload.activeCompanyId),
      payload.roleId ? storage.getRole(payload.roleId) : Promise.resolve(null),
    ]);

    if (!user || !activeCompany) {
      res.status(401).json({ error: "User or company not found" });
      return;
    }

    req.auth = {
      user,
      role: roleResult ?? null,
      activeCompanyId: payload.activeCompanyId,
      activeCompany,
      allowedCompanyIds: payload.allowedCompanyIds,
      companyLevel: payload.companyLevel,
      permissions: payload.permissions,
      canConsolidate: payload.companyLevel !== COMPANY_LEVELS.BRANCH,
      isAuthenticated: true,
    };

    next();
  } catch (error) {
    console.error("Failed to load auth context:", error);
    res.status(500).json({ error: "Failed to load authentication context" });
  }
}

/**
 * Middleware that verifies the user can access a specific company
 * Use after loadAuthContext for company-scoped routes
 */
export function verifyCompanyAccess(paramName: string = "companyId") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = req.auth;
    if (!auth) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const targetCompanyId = req.params[paramName] || req.body?.companyId;
    if (!targetCompanyId) {
      next();
      return;
    }

    if (!auth.allowedCompanyIds.includes(targetCompanyId)) {
      res.status(403).json({ 
        error: "Access denied: You do not have permission to access this company's data",
        companyLevel: auth.companyLevel,
        allowedCompanies: auth.allowedCompanyIds,
      });
      return;
    }

    next();
  };
}

/**
 * Optional authentication - attaches auth context if token is present
 * but doesn't fail if no token is provided
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    next();
    return;
  }

  const token = authHeader.substring(7);
  const payload = verifyAccessToken(token);
  
  if (!payload) {
    next();
    return;
  }

  try {
    const [user, activeCompany, roleResult] = await Promise.all([
      storage.getUser(payload.userId),
      storage.getCompany(payload.activeCompanyId),
      payload.roleId ? storage.getRole(payload.roleId) : Promise.resolve(null),
    ]);

    if (user && activeCompany) {
      req.auth = {
        user,
        role: roleResult ?? null,
        activeCompanyId: payload.activeCompanyId,
        activeCompany,
        allowedCompanyIds: payload.allowedCompanyIds,
        companyLevel: payload.companyLevel,
        permissions: payload.permissions,
        canConsolidate: payload.companyLevel !== COMPANY_LEVELS.BRANCH,
        isAuthenticated: true,
      };
    }
  } catch (error) {
    // Silent fail for optional auth
  }

  next();
}

// Export constants for use in routes
export const AUTH_CONFIG = {
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_COOKIE_NAME: "unanza_refresh_token",
};
