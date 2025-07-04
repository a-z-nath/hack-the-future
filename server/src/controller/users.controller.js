import { eq } from "drizzle-orm";
import { ilike, or } from "drizzle-orm";
import { db } from "../db/db.config.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import { asyncHandler } from "../utils/async-handler.js";
import { uploadBufferToCloudinary } from "../utils/cloudinary.js";
import { usersTable } from "../db/schema/users.js";
import logger from "../logger/winston.logger.js";

const uploadProfileImage = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  if (!req.file) {
    throw new ApiError(400, "No file uploaded");
  }
  // Upload to Cloudinary using the utility
  let result;
  try {
    result = await uploadBufferToCloudinary(req.file.buffer, {
      folder: "profile_images",
      resource_type: "image",
      public_id: `user_${userId}_${Date.now()}`,
      overwrite: true,
    });
  } catch (error) {
    throw new ApiError(500, "Cloudinary upload failed");
  }
  // Update user in DB
  await db
    .update(usersTable)
    .set({ avatarUrl: result.secure_url })
    .where(eq(usersTable.id, userId));
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { avatarUrl: result.secure_url },
        "Profile image updated"
      )
    );
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const {
    firstName,
    lastName,
    userName,
    location,
    bio,
    skills,
    socialLinks,
    interests,
  } = req.body;

  const updatedUser = await db
    .update(usersTable)
    .set({
      fullName: `${firstName} ${lastName}`,
      userName,
      bio,
      skills,
      interests,
      socialLinks,
      location,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, userId))
    .returning({
      fullName: usersTable.fullName,
      userName: usersTable.userName,
      bio: usersTable.bio,
      location: usersTable.location,
      socialLinks: usersTable.socialLinks,
      skills: usersTable.skills,
      interests: usersTable.interests,
    });

  if (updatedUser.length === 0) {
    throw new ApiError(404, "User not found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { user: updatedUser[0] },
        "Profile updated successfully"
      )
    );
});

const getUserProfileByUsername = asyncHandler(async (req, res) => {
  const username = req.query.userName;
  if (!username) {
    throw new ApiError(400, "Username query parameter is required");
  }
  const user = await db
    .select({
      id: usersTable.id,
      fullName: usersTable.fullName,
      userName: usersTable.userName,
      bio: usersTable.bio,
      location: usersTable.location,
      avatarUrl: usersTable.avatarUrl,
      socialLinks: usersTable.socialLinks,
      skills: usersTable.skills,
      interests: usersTable.interests,
    })
    .from(usersTable)
    .where(eq(usersTable.userName, username))
    .limit(1)
    .then((rows) => (rows && rows.length > 0 ? rows[0] : null));

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User profile retrieved successfully"));
});

const getUserProfile = asyncHandler(async (req, res) => {
  const userId = req.params.userId;
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }
  const user = await db
    .select({
      id: usersTable.id,
      fullName: usersTable.fullName,
      userName: usersTable.userName,
      bio: usersTable.bio,
      location: usersTable.location,
      avatarUrl: usersTable.avatarUrl,
      socialsLinks: usersTable.socialsLinks,
      skills: usersTable.skills,
      interests: usersTable.interests,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User profile retrieved successfully"));
});

// this end points update user roles to req.body.role value.
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const userId = req.user.id;

  const updatedUser = await db
    .update(usersTable)
    .set({ role, updatedAt: new Date() })
    .where(eq(usersTable.id, userId))
    .returning({
      id: usersTable.id,
      fullName: usersTable.fullName,
      userName: usersTable.userName,
      role: usersTable.role,
    });

  if (updatedUser.length === 0) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedUser[0], "User role updated successfully")
    );
});

// Search users by name, username, or email
const searchUsers = asyncHandler(async (req, res) => {
  const { q, limit = 10 } = req.query;

  if (!q || q.trim().length < 2) {
    throw new ApiError(400, "Search query must be at least 2 characters");
  }

  const searchTerm = q.trim();

  const users = await db
    .select({
      id: usersTable.id,
      fullName: usersTable.fullName,
      username: usersTable.userName,
      email: usersTable.email,
      avatarUrl: usersTable.avatarUrl,
      bio: usersTable.bio,
    })
    .from(usersTable)
    .where(
      or(
        ilike(usersTable.fullName, `%${searchTerm}%`),
        ilike(usersTable.userName, `%${searchTerm}%`),
        ilike(usersTable.email, `%${searchTerm}%`)
      )
    )
    .limit(parseInt(limit))
    .orderBy(usersTable.fullName);

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users found successfully"));
});

export {
  uploadProfileImage,
  updateUserProfile,
  getUserProfileByUsername,
  getUserProfile,
  updateUserRole,
  searchUsers,
};
