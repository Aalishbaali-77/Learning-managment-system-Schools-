import axios, {Axios} from 'axios';
import {getAccessToken} from '../utils/storage';
import { API_URL } from '@env';

const publicApi = axios.create({
  baseURL: API_URL,
});

const protectedApi = axios.create({
  baseURL: API_URL,
});

protectedApi.interceptors.request.use(
  async config => {
    const token = await getAccessToken();
    // console.log({token});
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

export default {
  public: publicApi,
  protected: protectedApi,
};
