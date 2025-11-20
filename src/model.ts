export enum AppUserType {
  Company = "Company",
  Location = "Location",
}

export enum TokenType {
  Bearer = "Bearer",
}

export interface InstallationDetails {
  access_token: string;
  token_type: TokenType.Bearer;
  expires_in: number;
  refresh_token: string;
  scope: string;
  userType: AppUserType;
  companyId?: string;
  locationId?: string;
}

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/* The Model class is responsible for saving and retrieving installation details, access tokens, and
refresh tokens. */
export class Model {
  public installationObjects: { [key: string]: InstallationDetails } = {};

/**
 * The function saves installation information based on either the location ID or the company ID.
 * @param {InstallationDetails} details - The `details` parameter is an object of type
 * `InstallationDetails`.
 */
  async saveInstallationInfo(details: InstallationDetails) {
    console.log(details);
    const resourceId = details.locationId || details.companyId;
    
    if (resourceId) {
      // Save to memory for backward compatibility
      this.installationObjects[resourceId] = details;
      
      // Persist to database
      try {
        await prisma.user.upsert({
          where: { resourceId },
          update: {
            accessToken: details.access_token,
            refreshToken: details.refresh_token,
            expiresIn: details.expires_in,
            scope: details.scope,
          },
          create: {
            resourceId,
            userType: details.userType,
            companyId: details.companyId,
            locationId: details.locationId,
            accessToken: details.access_token,
            refreshToken: details.refresh_token,
            tokenType: details.token_type,
            expiresIn: details.expires_in,
            scope: details.scope,
          },
        });
      } catch (error) {
        console.error('Failed to save user to database:', error);
      }
    }
  }

/**
 * The function `getAccessToken` returns the access token associated with a given resource ID i.e companyId or locationId from the
 * `installationObjects` object.
 * @param {string} resourceId - The `resourceId` parameter is a string that represents either locationId or companyId
 * It is used to retrieve the access token associated with that resource.
 * @returns The access token associated with the given resourceId.
 */
  async getAccessToken(resourceId: string) {
    // Try memory first
    if (this.installationObjects[resourceId]?.access_token) {
      return this.installationObjects[resourceId].access_token;
    }
    
    // Fall back to database
    try {
      const user = await prisma.user.findUnique({
        where: { resourceId },
      });
      return user?.accessToken;
    } catch (error) {
      console.error('Failed to get access token from database:', error);
      return undefined;
    }
  }


/**
 * The function sets an access token for a specific resource ID in an installation object.
 * @param {string} resourceId - The resourceId parameter is a string that represents the unique
 * identifier of a resource. It is used to identify a specific installation object in the
 * installationObjects array.
 * @param {string} token - The "token" parameter is a string that represents the access token that you
 * want to set for a specific resource.
 */
  async setAccessToken(resourceId: string, token: string) {
    if (this.installationObjects[resourceId]) {
        this.installationObjects[resourceId].access_token = token;
    }
    
    try {
      await prisma.user.update({
        where: { resourceId },
        data: { accessToken: token },
      });
    } catch (error) {
      console.error('Failed to update access token in database:', error);
    }
  }

/**
 * The function `getRefreshToken` returns the refresh_token associated with a given location or company from the
 * installationObjects object.
 * @param {string} resourceId - The resourceId parameter is a string that represents the unique
 * identifier of a resource.
 * @returns The companyId associated with the installation object for the given resourceId.
 */
  async getRefreshToken(resourceId: string) {
    // Try memory first
    if (this.installationObjects[resourceId]?.refresh_token) {
      return this.installationObjects[resourceId].refresh_token;
    }
    
    // Fall back to database
    try {
      const user = await prisma.user.findUnique({
        where: { resourceId },
      });
      return user?.refreshToken;
    } catch (error) {
      console.error('Failed to get refresh token from database:', error);
      return undefined;
    }
  }

/**
 * The function saves the refresh token for a specific resource i.e. location or company.
 * @param {string} resourceId - The resourceId parameter is a string that represents the unique
 * identifier of a resource. It is used to identify a specific installation object in the
 * installationObjects array.
 * @param {string} token - The "token" parameter is a string that represents the refresh token. A
 * refresh token is a credential used to obtain a new access token when the current access token
 * expires. It is typically used in authentication systems to maintain a user's session without
 * requiring them to re-enter their credentials.
 */
  async setRefreshToken(resourceId: string, token: string) {
    if (this.installationObjects[resourceId]) {
        this.installationObjects[resourceId].refresh_token = token;
    }
    
    try {
      await prisma.user.update({
        where: { resourceId },
        data: { refreshToken: token },
      });
    } catch (error) {
      console.error('Failed to update refresh token in database:', error);
    }
  }
}
