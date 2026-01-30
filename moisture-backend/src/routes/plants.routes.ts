import { Router } from 'express';
import * as ctrl from '../controllers/plants.controller';
import { deletePlant } from '../controllers/plants.controller';
import { authRequired } from '../middleware/auth';
const r = Router();

r.use(authRequired);

/**
 * @openapi
 * components:
 *   schemas:
 *     Device:
 *       type: object
 *       required: [id, status, battery, watering, moisture, created_at, updated_at]
 *       properties:
 *         id:
 *           type: integer
 *           example: 101
 *         status:
 *           type: string
 *           enum: [ok, fault, offline]
 *           example: ok
 *         battery:
 *           type: integer
 *           minimum: 0
 *           maximum: 100
 *           example: 92
 *         watering:
 *           type: boolean
 *           example: false
 *         moisture:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 100
 *           example: 47.5
 *         created_at:
 *           type: string
 *           format: date-time
 *           example: "2025-01-15T09:30:00Z"
 *         updated_at:
 *           type: string
 *           format: date-time
 *           example: "2025-01-20T12:05:22Z"
 *
 *     Plant:
 *       type: object
 *       required: [id, name, species, device]
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: string
 *           example: "Monstera - Office"
 *         species:
 *           type: string
 *           example: "monstera"
 *         location:
 *           type: string
 *           nullable: true
 *           example: "Office"
 *         notes:
 *           type: string
 *           nullable: true
 *           example: "Needs bright indirect light"
 *         device:
 *           $ref: "#/components/schemas/Device"
 *
 *     ErrorResponse:
 *       type: object
 *       required: [error]
 *       properties:
 *         error:
 *           type: string
 *           example: "Plant not found"
 */

/**
 * @openapi
 * /api/plants:
 *   get:
 *     summary: List all plants
 *     responses:
 *       200:
 *         description: Array of plants
 */
r.get('/', ctrl.getAll);

/**
 * @openapi
 * /api/plants/{id}:
 *   get:
 *     summary: Get a plant by id
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     responses:
 *       200: { description: Plant }
 *       404: { description: Not found }
 */
r.get('/:id', ctrl.getOne);

/**
 * @openapi
 * /api/plants/{id}/water:
 *   post:
 *     summary: Toggle watering (or set on/off)
 *     parameters:
 *       - in: path
 *         name: id
 *         schema: { type: integer }
 *         required: true
 *     requestBody:
 *       required: false
 *     responses:
 *       200: { description: Updated plant }
 *       404: { description: Not found }
 */
r.post('/:id/water', ctrl.toggleWater);

/**
 * @openapi
 * /api/plants:
 *   post:
 *     tags: [Plants]
 *     summary: Create a new plant
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, species]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Monstera - Office"
 *               species:
 *                 type: string
 *                 example: "monstera"
 *               location:
 *                 type: string
 *                 nullable: true
 *                 example: "Office"
 *               notes:
 *                 type: string
 *                 nullable: true
 *                 example: "Needs bright indirect light"
 *               device:
 *                 type: object
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum: [ok, fault, offline]
 *                   battery:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 100
 *                   watering:
 *                     type: boolean
 *                   moisture:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 100
 *     responses:
 *       201:
 *         description: Plant created
 *       400:
 *         description: Invalid request body
 *       500:
 *         description: Internal server error
 */
r.post('/', ctrl.createPlant);

/**
 * @openapi
 * /api/plants/{id}:
 *   delete:
 *     operationId: deletePlant
 *     tags: [Plants]
 *     summary: Delete a plant
 *     description: Deletes a plant by numeric ID. The associated device is removed by ON DELETE CASCADE.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Numeric ID of the plant to delete.
 *         schema:
 *           type: integer
 *           minimum: 1
 *     responses:
 *       204:
 *         description: Plant deleted successfully.
 *       400:
 *         description: Invalid path parameter.
 *       404:
 *         description: Plant not found.
 *       500:
 *         description: Unexpected server error.
 */
r.delete('/:id', deletePlant);

export default r;
