import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { AuthRequest } from '../middleware/auth';
import { SaleType, PropertyStatus } from '../models/Property';

export class PropertyController {
  // Create a new property
  static async createProperty(req: AuthRequest, res: Response) {
    try {
      const {
        title,
        development_name,
        property_code,
        floor,
        available_units,
        sale_type,
        price,
        area,
        bedrooms,
        bathrooms,
        garage,
        kitchen,
        location,
        description,
        images,
        status
      } = req.body;

      // Validation
      if (!title || !development_name || !property_code || !available_units ||
          !sale_type || !price || !bedrooms || !bathrooms || !garage || !kitchen ||
          !location || !description) {
        return res.status(400).json({
          error: 'Missing required fields: title, development_name, property_code, available_units, sale_type, price, bedrooms, bathrooms, garage, kitchen, location, description'
        });
      }

      if (!location.address || !location.city || !location.state || !location.country) {
        return res.status(400).json({
          error: 'Location must include address, city, state, and country'
        });
      }

      if (!['House', 'Apartment', 'Land'].includes(sale_type)) {
        return res.status(400).json({
          error: 'sale_type must be one of: House, Apartment, Land'
        });
      }

      if (!['Available', 'Sold', 'Under Construction'].includes(status || 'Available')) {
        return res.status(400).json({
          error: 'status must be one of: Available, Sold, Under Construction'
        });
      }

      const property = await AuthService.createProperty({
        organizationId: req.user!.organizationId!,
        title,
        development_name,
        property_code,
        floor,
        available_units,
        sale_type: sale_type as SaleType,
        price,
        area,
        bedrooms,
        bathrooms,
        garage,
        kitchen,
        location,
        description,
        images,
        status: status as PropertyStatus || 'Available'
      });

      res.status(201).json({
        message: 'Property created successfully',
        property: {
          id: property.id,
          title: property.title,
          development_name: property.development_name,
          property_code: property.property_code,
          available_units: property.available_units,
          sale_type: property.sale_type,
          price: property.price,
          status: property.status,
          createdAt: property.createdAt
        }
      });
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(409).json({ error: 'Property code already exists' });
      } else {
        res.status(400).json({ error: error.message });
      }
    }
  }

  // Get all properties for an organization
  static async getOrganizationProperties(req: AuthRequest, res: Response) {
    try {
      const properties = await AuthService.getOrganizationProperties(req.user!.organizationId!);

      const formattedProperties = properties.map(property => ({
        id: property.id,
        title: property.title,
        development_name: property.development_name,
        property_code: property.property_code,
        available_units: property.available_units,
        sale_type: property.sale_type,
        price: property.price,
        area: property.area,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        garage: property.garage,
        kitchen: property.kitchen,
        location: property.location,
        status: property.status,
        images: property.images,
        description: property.description,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt
      }));

      res.json({ properties: formattedProperties });
    } catch (error: any) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get available properties for an organization
  static async getAvailableProperties(req: AuthRequest, res: Response) {
    try {
      const properties = await AuthService.getAvailableProperties(req.user!.organizationId!);

      const formattedProperties = properties.map(property => ({
        id: property.id,
        title: property.title,
        development_name: property.development_name,
        property_code: property.property_code,
        available_units: property.available_units,
        sale_type: property.sale_type,
        price: property.price,
        area: property.area,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        garage: property.garage,
        kitchen: property.kitchen,
        location: property.location,
        status: property.status,
        images: property.images,
        description: property.description,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt
      }));

      res.json({ properties: formattedProperties });
    } catch (error: any) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get a specific property
  static async getProperty(req: AuthRequest, res: Response) {
    try {
      const { propertyId } = req.params;

      const property = await AuthService.getPropertyById(propertyId, req.user!.organizationId!);

      res.json({
        property: {
          id: property.id,
          title: property.title,
          development_name: property.development_name,
          property_code: property.property_code,
          floor: property.floor,
          available_units: property.available_units,
          sale_type: property.sale_type,
          price: property.price,
          area: property.area,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          garage: property.garage,
          kitchen: property.kitchen,
          location: property.location,
          description: property.description,
          images: property.images,
          status: property.status,
          createdAt: property.createdAt,
          updatedAt: property.updatedAt
        }
      });
    } catch (error: any) {
      if (error.message === 'Property not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  // Update a property
  static async updateProperty(req: AuthRequest, res: Response) {
    try {
      const { propertyId } = req.params;
      const updateData = req.body;

      // Validate status if provided
      if (updateData.status && !['Available', 'Sold', 'Under Construction'].includes(updateData.status)) {
        return res.status(400).json({
          error: 'status must be one of: Available, Sold, Under Construction'
        });
      }

      // Validate sale_type if provided
      if (updateData.sale_type && !['House', 'Apartment', 'Land'].includes(updateData.sale_type)) {
        return res.status(400).json({
          error: 'sale_type must be one of: House, Apartment, Land'
        });
      }

      const property = await AuthService.updateProperty(propertyId, req.user!.organizationId!, updateData);

      res.json({
        message: 'Property updated successfully',
        property: {
          id: property.id,
          title: property.title,
          development_name: property.development_name,
          property_code: property.property_code,
          floor: property.floor,
          available_units: property.available_units,
          sale_type: property.sale_type,
          price: property.price,
          area: property.area,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
          garage: property.garage,
          kitchen: property.kitchen,
          location: property.location,
          description: property.description,
          images: property.images,
          status: property.status,
          updatedAt: property.updatedAt
        }
      });
    } catch (error: any) {
      if (error.message === 'Property not found') {
        res.status(404).json({ error: error.message });
      } else if (error.code === 11000) {
        res.status(409).json({ error: 'Property code already exists' });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  // Delete a property
  static async deleteProperty(req: AuthRequest, res: Response) {
    try {
      const { propertyId } = req.params;

      await AuthService.deleteProperty(propertyId, req.user!.organizationId!);

      res.json({ message: 'Property deleted successfully' });
    } catch (error: any) {
      if (error.message === 'Property not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  // Search properties
  static async searchProperties(req: AuthRequest, res: Response) {
    try {
      const {
        city,
        state,
        sale_type,
        minPrice,
        maxPrice,
        bedrooms,
        status,
        organizationId
      } = req.query;

      const filters: any = {};

      if (organizationId) filters.organizationId = organizationId;
      else filters.organizationId = req.user!.organizationId!; // Default to current user's org

      if (city) filters.city = city as string;
      if (state) filters.state = state as string;
      if (sale_type) filters.sale_type = sale_type as SaleType;
      if (bedrooms) filters.bedrooms = parseInt(bedrooms as string);
      if (status) filters.status = status as PropertyStatus;
      if (minPrice) filters.minPrice = parseFloat(minPrice as string);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice as string);

      const properties = await AuthService.searchProperties(filters);

      const formattedProperties = properties.map(property => ({
        id: property.id,
        title: property.title,
        development_name: property.development_name,
        property_code: property.property_code,
        available_units: property.available_units,
        sale_type: property.sale_type,
        price: property.price,
        area: property.area,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        garage: property.garage,
        kitchen: property.kitchen,
        location: property.location,
        status: property.status,
        images: property.images,
        description: property.description,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt
      }));

      res.json({ properties: formattedProperties });
    } catch (error: any) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Payment plan management methods
  static async addPaymentPlan(req: AuthRequest, res: Response) {
    try {
      const { propertyId } = req.params;
      const paymentPlan = req.body;

      const property = await AuthService.addPaymentPlan(propertyId, req.user!.organizationId!, paymentPlan);

      res.json({
        message: 'Payment plan added successfully',
        property: {
          id: property.id,
          title: property.title,
          payment_plans: property.payment_plans
        }
      });
    } catch (error: any) {
      if (error.message === 'Property not found') {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  static async updatePaymentPlan(req: AuthRequest, res: Response) {
    try {
      const { propertyId, planIndex } = req.params;
      const updates = req.body;

      const property = await AuthService.updatePaymentPlan(propertyId, req.user!.organizationId!, parseInt(planIndex), updates);

      res.json({
        message: 'Payment plan updated successfully',
        property: {
          id: property.id,
          title: property.title,
          payment_plans: property.payment_plans
        }
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }

  static async deletePaymentPlan(req: AuthRequest, res: Response) {
    try {
      const { propertyId, planIndex } = req.params;

      const property = await AuthService.removePaymentPlan(propertyId, req.user!.organizationId!, parseInt(planIndex));

      res.json({
        message: 'Payment plan removed successfully',
        property: {
          id: property.id,
          title: property.title,
          payment_plans: property.payment_plans
        }
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        res.status(404).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
}
