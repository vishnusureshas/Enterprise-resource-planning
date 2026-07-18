const orgRepo = require('./org.repo');
const { NotFoundError } = require('../../shared/errors');
const logger = require('../../config/logger');

const defaultSettings = {
  email: {
    host: null,
    port: 587,
    secure: false,
    user: null,
    pass: null,
    fromName: null,
    fromEmail: null,
  },
  security: {
    passwordMinLength: 8,
    passwordRequireSpecial: true,
    passwordRequireNumber: true,
    passwordRequireUpper: true,
    sessionTimeoutMinutes: 480,
    mfaRequired: false,
    maxLoginAttempts: 5,
    ipWhitelist: [],
  },
  notifications: {
    emailNotifications: true,
    inAppNotifications: true,
    weeklyDigest: false,
    orderConfirmation: true,
    passwordChangeAlert: true,
    loginAlert: false,
  },
  localization: {
    defaultLanguage: 'en',
    dateFormat: 'YYYY-MM-DD',
    timezone: 'UTC',
    currency: 'USD',
    weekStartsOn: 1,
    numberFormat: {
      decimalSeparator: '.',
      thousandsSeparator: ',',
      decimalPlaces: 2,
    },
  },
};

class OrganizationService {
  async getById(orgId) {
    const org = await orgRepo.findById(orgId);
    if (!org) throw new NotFoundError('Organization not found');

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logoUrl: org.logo_url,
      website: org.website,
      phone: org.phone,
      address: org.address,
      timezone: org.timezone,
      dateFormat: org.date_format,
      currency: org.currency,
      createdAt: org.created_at,
      updatedAt: org.updated_at,
    };
  }

  async update(orgId, data) {
    const existing = await orgRepo.findById(orgId);
    if (!existing) throw new NotFoundError('Organization not found');

    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.slug !== undefined) updateData.slug = data.slug;
    if (data.logoUrl !== undefined) updateData.logo_url = data.logoUrl;
    if (data.website !== undefined) updateData.website = data.website;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.address !== undefined) updateData.address = data.address;

    if (Object.keys(updateData).length > 0) {
      await orgRepo.update(orgId, updateData);
    }

    logger.info('Organization updated', { orgId });

    return this.getById(orgId);
  }

  async getSettings(orgId) {
    const existing = await orgRepo.findById(orgId);
    if (!existing) throw new NotFoundError('Organization not found');

    const stored = await orgRepo.getSettings(orgId);
    return this.mergeDefaults(stored);
  }

  async updateSettings(orgId, settings) {
    const existing = await orgRepo.findById(orgId);
    if (!existing) throw new NotFoundError('Organization not found');

    const updated = await orgRepo.upsertSettings(orgId, settings);

    // Sync top-level org fields from localization settings
    if (settings.localization) {
      const syncData = {};
      if (settings.localization.timezone) syncData.timezone = settings.localization.timezone;
      if (settings.localization.dateFormat) syncData.date_format = settings.localization.dateFormat;
      if (settings.localization.currency) syncData.currency = settings.localization.currency;
      if (Object.keys(syncData).length > 0) {
        await orgRepo.update(orgId, syncData);
      }
    }

    logger.info('Organization settings updated', { orgId });

    return this.mergeDefaults(updated);
  }

  async getStats(orgId) {
    const existing = await orgRepo.findById(orgId);
    if (!existing) throw new NotFoundError('Organization not found');

    return orgRepo.getStats(orgId);
  }

  mergeDefaults(stored) {
    if (!stored) return { ...defaultSettings };

    return {
      email: { ...defaultSettings.email, ...(stored.email || {}) },
      security: { ...defaultSettings.security, ...(stored.security || {}) },
      notifications: { ...defaultSettings.notifications, ...(stored.notifications || {}) },
      localization: { ...defaultSettings.localization, ...(stored.localization || {}) },
    };
  }
}

module.exports = new OrganizationService();
