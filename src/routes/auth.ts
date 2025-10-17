import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateToken, requireRole } from '../middleware/auth';

/**
 * @swagger
 * components:
 *   schemas:
 *     Organization:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         size:
 *           type: string
 *           enum: [1-10, 11-50, 51-200, 200+]
 *         category:
 *           type: string
 *           enum: [Property Development, Property Management]
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         username:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *           enum: [admin, agent, staff]
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 */

const router = Router();

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Send OTP for email verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - purpose
 *             properties:
 *               email:
 *                 type: string
 *               purpose:
 *                 type: string
 *                 enum: [registration, invite]
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/send-otp', AuthController.sendOtp);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - purpose
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *               purpose:
 *                 type: string
 *                 enum: [registration, invite]
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/verify-otp', AuthController.verifyOtp);

/**
 * @swagger
 * /auth/register-organization:
 *   post:
 *     summary: Register a new organization
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - size
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               size:
 *                 type: string
 *                 enum: [1-10, 11-50, 51-200, 200+]
 *               category:
 *                 type: string
 *                 enum: [Property Development, Property Management]
 *     responses:
 *       201:
 *         description: Organization registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 organization:
 *                   $ref: '#/components/schemas/Organization'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Organization already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register-organization', AuthController.registerOrganization);

/**
 * @swagger
 * /auth/login-organization:
 *   post:
 *     summary: Login organization
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 organization:
 *                   $ref: '#/components/schemas/Organization'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login-organization', AuthController.loginOrganization);

/**
 * @swagger
 * /auth/add-user:
 *   post:
 *     summary: Add a sub-user to organization
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *               - role
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, agent, staff]
 *     responses:
 *       201:
 *         description: User added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/add-user', authenticateToken, requireRole(['organization']), AuthController.addUser);

/**
 * @swagger
 * /auth/users:
 *   get:
 *     summary: Get all users in organization
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       403:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/users', authenticateToken, requireRole(['organization']), AuthController.getUsers);

/**
 * @swagger
 * /auth/login-user:
 *   post:
 *     summary: Login sub-user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login-user', AuthController.loginUser);

/**
 * @swagger
 * /auth/update-user-profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profile:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   bio:
 *                     type: string
 *                   skills:
 *                     type: array
 *                     items:
 *                       type: string
 *                   avatar:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   location:
 *                     type: string
 *                   experience:
 *                     type: number
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/update-user-profile', authenticateToken, AuthController.updateUserProfile);

/**
 * @swagger
 * /auth/update-organization-profile:
 *   put:
 *     summary: Update organization profile
 *     tags: [Organizations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profile:
 *                 type: object
 *                 properties:
 *                   fullAddress:
 *                     type: object
 *                     properties:
 *                       street:
 *                         type: string
 *                       city:
 *                         type: string
 *                       state:
 *                         type: string
 *                       zip:
 *                         type: string
 *                       country:
 *                         type: string
 *                   website:
 *                     type: string
 *                   description:
 *                     type: string
 *                   logo:
 *                     type: string
 *                   foundedYear:
 *                     type: number
 *                   specialties:
 *                     type: array
 *                     items:
 *                       type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       403:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Organization not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put(
  '/update-organization-profile',
  authenticateToken,
  requireRole(['organization']),
  AuthController.updateOrganizationProfile
);

/**
 * @swagger
 * /auth/generate-invite:
 *   post:
 *     summary: Generate invite link for a user
 *     tags: [Invites]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, agent, staff]
 *               sendEmail:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Invite link generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 inviteLink:
 *                   type: string
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post(
  '/generate-invite',
  authenticateToken,
  requireRole(['organization']),
  AuthController.generateInvite
);

/**
 * @swagger
 * /auth/validate-invite/{token}:
 *   get:
 *     summary: Validate invite link
 *     tags: [Invites]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Valid invite link
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 valid:
 *                   type: boolean
 *                 email:
 *                   type: string
 *                 organizationId:
 *                   type: string
 *                 role:
 *                   type: string
 *       400:
 *         description: Invalid or expired invite link
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/validate-invite/:token', AuthController.validateInvite);

/**
 * @swagger
 * /auth/register-user:
 *   post:
 *     summary: Register user via invite link
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - username
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid or expired invite link
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/register-user', AuthController.registerUser);

export default router;
