import { Router } from 'express';
import { PropertyController } from '../controllers/propertyController';
import { authenticateToken, requireRole } from '../middleware/auth';

/**
 * @swagger
 * components:
 *   schemas:
 *     Property:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         development_name:
 *           type: string
 *         property_code:
 *           type: string
 *         floor:
 *           type: string
 *         available_units:
 *           type: number
 *         sale_type:
 *           type: string
 *           enum: [House, Apartment, Land]
 *         price:
 *           type: number
 *         area:
 *           type: number
 *         bedrooms:
 *           type: number
 *         bathrooms:
 *           type: number
 *         garage:
 *           type: number
 *         kitchen:
 *           type: number
 *         location:
 *           type: object
 *           properties:
 *             address:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             country:
 *               type: string
 *             latitude:
 *               type: number
 *             longitude:
 *               type: number
 *         description:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         status:
 *           type: string
 *           enum: [Available, Sold, Under Construction]
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Location:
 *       type: object
 *       properties:
 *         address:
 *           type: string
 *         city:
 *           type: string
 *         state:
 *           type: string
 *         country:
 *           type: string
 *         latitude:
 *           type: number
 *         longitude:
 *           type: number
 */

const router = Router();

/**
 * @swagger
 * /properties:
 *   post:
 *     summary: Create a new property
 *     tags: [Properties]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - development_name
 *               - property_code
 *               - available_units
 *               - sale_type
 *               - price
 *               - bedrooms
 *               - bathrooms
 *               - garage
 *               - kitchen
 *               - location
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *                 example: "1 Bedroom Apartment"
 *               development_name:
 *                 type: string
 *                 example: "Mshel Palm Residence"
 *               property_code:
 *                 type: string
 *                 example: "Left Wing C01A"
 *               floor:
 *                 type: string
 *                 example: "Ground Floor"
 *               available_units:
 *                 type: number
 *                 example: 9
 *               sale_type:
 *                 type: string
 *                 enum: [House, Apartment, Land]
 *                 example: "Apartment"
 *               price:
 *                 type: number
 *                 example: 7650000
 *               area:
 *                 type: number
 *                 example: 0
 *               bedrooms:
 *                 type: number
 *                 example: 1
 *               bathrooms:
 *                 type: number
 *                 example: 1
 *               garage:
 *                 type: number
 *                 example: 1
 *               kitchen:
 *                 type: number
 *                 example: 1
 *               location:
 *                 type: object
 *                 required:
 *                   - address
 *                   - city
 *                   - state
 *                   - country
 *                 properties:
 *                   address:
 *                     type: string
 *                     example: "Saminu Yerima Street"
 *                   city:
 *                     type: string
 *                     example: "Abuja"
 *                   state:
 *                     type: string
 *                     example: "FCT"
 *                   country:
 *                     type: string
 *                     example: "Nigeria"
 *                   latitude:
 *                     type: number
 *                     example: 9.0765
 *                   longitude:
 *                     type: number
 *                     example: 8.6753
 *               description:
 *                 type: string
 *                 example: "Modern 1-bedroom apartment…"
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["https://example.com/image1.jpg"]
 *               status:
 *                 type: string
 *                 enum: [Available, Sold, Under Construction]
 *                 example: "Available"
 *     responses:
 *       201:
 *         description: Property created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 property:
 *                   $ref: '#/components/schemas/Property'
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Unauthorized
 *       409:
 *         description: Property code already exists
 */
router.post('/', authenticateToken, requireRole(['organization']), PropertyController.createProperty);

/**
 * @swagger
 * /properties:
 *   get:
 *     summary: Get all properties for organization
 *     tags: [Properties]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of properties
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 properties:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Property'
 *       403:
 *         description: Unauthorized
 */
router.get('/', authenticateToken, requireRole(['organization']), PropertyController.getOrganizationProperties);

/**
 * @swagger
 * /properties/available:
 *   get:
 *     summary: Get available properties for organization
 *     tags: [Properties]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of available properties
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 properties:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Property'
 *       403:
 *         description: Unauthorized
 */
router.get('/available', authenticateToken, requireRole(['organization']), PropertyController.getAvailableProperties);

/**
 * @swagger
 * /properties/{propertyId}:
 *   get:
 *     summary: Get a specific property
 *     tags: [Properties]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 property:
 *                   $ref: '#/components/schemas/Property'
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Property not found
 */
router.get('/:propertyId', authenticateToken, requireRole(['organization']), PropertyController.getProperty);

/**
 * @swagger
 * /properties/{propertyId}:
 *   put:
 *     summary: Update a property
 *     tags: [Properties]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               development_name:
 *                 type: string
 *               property_code:
 *                 type: string
 *               floor:
 *                 type: string
 *               available_units:
 *                 type: number
 *               sale_type:
 *                 type: string
 *                 enum: [House, Apartment, Land]
 *               price:
 *                 type: number
 *               area:
 *                 type: number
 *               bedrooms:
 *                 type: number
 *               bathrooms:
 *                 type: number
 *               garage:
 *                 type: number
 *               kitchen:
 *                 type: number
 *               location:
 *                 $ref: '#/components/schemas/Location'
 *               description:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: string
 *                 enum: [Available, Sold, Under Construction]
 *     responses:
 *       200:
 *         description: Property updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 property:
 *                   $ref: '#/components/schemas/Property'
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Property not found
 *       409:
 *         description: Property code already exists
 */
router.put('/:propertyId', authenticateToken, requireRole(['organization']), PropertyController.updateProperty);

/**
 * @swagger
 * /properties/{propertyId}:
 *   delete:
 *     summary: Delete a property
 *     tags: [Properties]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Property deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Property not found
 */
router.delete('/:propertyId', authenticateToken, requireRole(['organization']), PropertyController.deleteProperty);

/**
 * @swagger
 * /properties/search:
 *   get:
 *     summary: Search properties with filters
 *     tags: [Properties]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *       - in: query
 *         name: sale_type
 *         schema:
 *           type: string
 *           enum: [House, Apartment, Land]
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: bedrooms
 *         schema:
 *           type: number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [Available, Sold, Under Construction]
 *       - in: query
 *         name: organizationId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Filtered list of properties
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 properties:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Property'
 *       403:
 *         description: Unauthorized
 */
router.get('/search', authenticateToken, requireRole(['organization']), PropertyController.searchProperties);

/**
 * @swagger
 * /properties/{propertyId}/payment-plans:
 *   post:
 *     summary: Add a payment plan to a property
 *     tags: [Properties]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - name
 *               - schedule
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [outright, installment, mortgage, rent_to_own]
 *               name:
 *                 type: string
 *                 example: "6-Month Installment"
 *               description:
 *                 type: string
 *               schedule:
 *                 type: object
 *                 properties:
 *                   deposit_amount:
 *                     type: number
 *                   monthly_payment:
 *                     type: number
 *                   duration_months:
 *                     type: number
 *                   interest_rate:
 *                     type: number
 *                   total_amount:
 *                     type: number
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Payment plan added successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Property not found
 */
router.post('/:propertyId/payment-plans', authenticateToken, requireRole(['organization']), PropertyController.addPaymentPlan);

/**
 * @swagger
 * /properties/{propertyId}/payment-plans/{planIndex}:
 *   put:
 *     summary: Update a payment plan
 *     tags: [Properties]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: planIndex
 *         required: true
 *         schema:
 *           type: number
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [outright, installment, mortgage, rent_to_own]
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               schedule:
 *                 type: object
 *                 properties:
 *                   deposit_amount:
 *                     type: number
 *                   monthly_payment:
 *                     type: number
 *                   duration_months:
 *                     type: number
 *                   interest_rate:
 *                     type: number
 *                   total_amount:
 *                     type: number
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Payment plan updated successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Property or payment plan not found
 */
router.put('/:propertyId/payment-plans/:planIndex', authenticateToken, requireRole(['organization']), PropertyController.updatePaymentPlan);

/**
 * @swagger
 * /properties/{propertyId}/payment-plans/{planIndex}:
 *   delete:
 *     summary: Remove a payment plan
 *     tags: [Properties]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: planIndex
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Payment plan removed successfully
 *       403:
 *         description: Unauthorized
 *       404:
 *         description: Property or payment plan not found
 */
router.delete('/:propertyId/payment-plans/:planIndex', authenticateToken, requireRole(['organization']), PropertyController.deletePaymentPlan);

export default router;
