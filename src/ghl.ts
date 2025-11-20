import qs from "qs";
import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { createDecipheriv, createHash } from 'node:crypto';

import { Model, TokenType } from "./model";

/* The GHL class is responsible for handling authorization, making API requests, and managing access
tokens and refresh tokens for a specific resource. */
export class GHL {
  public model: Model;

  constructor() {
    this.model = new Model();
  }

/**
 * The `authorizationHandler` function handles the authorization process by generating an access token
 * and refresh token pair.
 * @param {string} code - The code parameter is a string that represents the authorization code
 * obtained from the authorization server. It is used to exchange for an access token and refresh token
 * pair.
 */
  async authorizationHandler(code: string) {
    if (!code) {
      console.warn(
        "Please provide code when making call to authorization Handler"
      );
    }
    await this.generateAccessTokenRefreshTokenPair(code);
  }

  decryptSSOData(key: string) {
    try {
      const blockSize = 16;
      const keySize = 32;
      const ivSize = 16;
      const saltSize = 8;
      
      const rawEncryptedData = Buffer.from(key, 'base64');
      const salt = rawEncryptedData.subarray(saltSize, blockSize);
      const cipherText = rawEncryptedData.subarray(blockSize);
      
      let result = Buffer.alloc(0, 0);
      while (result.length < (keySize + ivSize)) {
        const hasher = createHash('md5');
        result = Buffer.concat([
          result,
          hasher.update(Buffer.concat([
            result.subarray(-ivSize),
            Buffer.from(process.env.GHL_APP_SSO_KEY as string, 'utf-8'),
            salt
          ])).digest()
        ]);
      }
      
      const decipher = createDecipheriv(
        'aes-256-cbc',
        result.subarray(0, keySize),
        result.subarray(keySize, keySize + ivSize)
      );
      
      const decrypted = decipher.update(cipherText);
      const finalDecrypted = Buffer.concat([decrypted, decipher.final()]);
      return JSON.parse(finalDecrypted.toString());
    } catch (error) {
      console.error('Error decrypting SSO data:', error);
      throw error;
    }
  }

/**
 * The function creates an instance of Axios with a base URL and interceptors for handling
 * authorization and refreshing access tokens.
 * @param {string} resourceId - The `resourceId` parameter is a string that represents the locationId or companyId you want
 * to make api call for.
 * @returns an instance of the Axios library with some custom request and response interceptors.
 */
  requests(resourceId: string) {
    const baseUrl = process.env.GHL_API_DOMAIN;

    if (!this.model.getAccessToken(resourceId)) {
      throw new Error("Installation not found for the following resource");
    }

    const axiosInstance = axios.create({
      baseURL: baseUrl,
    });

    axiosInstance.interceptors.request.use(
      async (requestConfig: InternalAxiosRequestConfig) => {
        try {
          requestConfig.headers["Authorization"] = `${
            TokenType.Bearer
          } ${this.model.getAccessToken(resourceId)}`;
        } catch (e) {
          console.error(e);
        }
        return requestConfig;
      }
    );

    axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Handle 401 - Token expired
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await this.refreshAccessToken(resourceId);
            originalRequest.headers.Authorization = `Bearer ${await this.model.getAccessToken(
              resourceId
            )}`;
            return axiosInstance(originalRequest);
          } catch (refreshError) {
            return Promise.reject(new Error('Session expired. Please reconnect your account.'));
          }
        }

        // Handle 429 - Rate limiting
        if (error.response?.status === 429) {
          const retryAfter = parseInt(error.response.headers['retry-after'] || '60');
          if (!originalRequest._retryCount) {
            originalRequest._retryCount = 0;
          }
          
          if (originalRequest._retryCount < 3) {
            originalRequest._retryCount++;
            await this.handleRateLimit(retryAfter);
            return axiosInstance(originalRequest);
          }
          return Promise.reject(new Error('Rate limit exceeded. Please try again later.'));
        }

        // Handle other errors
        const errorMsg = error.response?.data?.message || error.response?.data?.error || error.message;
        return Promise.reject(new Error(errorMsg));
      }
    );

    return axiosInstance;
  }

/**
 * The function checks if an installation exists for a given resource ID i.e locationId or companyId.
 * @param {string} resourceId - The `resourceId` parameter is a string that represents the ID of a
 * resource.
 * @returns a boolean value.
 */
  checkInstallationExists(resourceId: string){
    return !!this.model.getAccessToken(resourceId)
  }

/**
 * The function `getLocationTokenFromCompanyToken` retrieves a location token from a company token and
 * saves the installation information.
 * @param {string} companyId - A string representing the ID of the company.
 * @param {string} locationId - The `locationId` parameter is a string that represents the unique
 * identifier of a location within a company.
 */
  async getLocationTokenFromCompanyToken(
    companyId: string,
    locationId: string
  ) {
    const res = await this.requests(companyId).post(
      "/oauth/locationToken",
      {
        companyId,
        locationId,
      },
      {
        headers: {
          Version: "2021-07-28",
        },
      }
    );
    this.model.saveInstallationInfo(res.data);
  }

  private async refreshAccessToken(resourceId: string) {
    try {
      const resp = await axios.post(
        `${process.env.GHL_API_DOMAIN}/oauth/token`,
        qs.stringify({
          client_id: process.env.GHL_APP_CLIENT_ID,
          client_secret: process.env.GHL_APP_CLIENT_SECRET,
          grant_type: "refresh_token",
          refresh_token: await this.model.getRefreshToken(resourceId),
        }),
        { headers: { "content-type": "application/x-www-form-urlencoded" } }
      );
      await this.model.setAccessToken(resourceId, resp.data.access_token);
      await this.model.setRefreshToken(resourceId, resp.data.refresh_token);
    } catch (error: any) {
      console.error('Token refresh failed:', error?.response?.data);
      throw new Error('Authentication expired. Please reconnect your GHL account.');
    }
  }

  private async handleRateLimit(retryAfter: number) {
    const waitTime = (retryAfter || 60) * 1000;
    console.log(`Rate limited. Waiting ${waitTime}ms before retry...`);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  private async generateAccessTokenRefreshTokenPair(code: string) {
    try {
      const resp = await axios.post(
        `${process.env.GHL_API_DOMAIN}/oauth/token`,
        qs.stringify({
          client_id: process.env.GHL_APP_CLIENT_ID,
          client_secret: process.env.GHL_APP_CLIENT_SECRET,
          grant_type: "authorization_code",
          code,
        }),
        { headers: { "content-type": "application/x-www-form-urlencoded" } }
      );
      await this.model.saveInstallationInfo(resp.data);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error_description || error?.response?.data?.error || 'Authorization failed';
      console.error('OAuth error:', errorMsg);
      throw new Error(`Failed to connect to GHL: ${errorMsg}`);
    }
  }
}
