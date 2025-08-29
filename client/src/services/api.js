import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 门店相关
export const storeAPI = {
  getAll: () => api.get('/stores'),
  create: (data) => api.post('/stores', data),
  update: (id, data) => api.put(`/stores/${id}`, data),
  delete: (id) => api.delete(`/stores/${id}`),
};

// 巡店员相关
export const inspectorAPI = {
  getAll: () => api.get('/inspectors'),
  create: (data) => api.post('/inspectors', data),
};

// 巡店记录相关
export const inspectionAPI = {
  create: (data) => api.post('/inspections', data),
  getList: (params) => api.get('/inspections', { params }),
  getDetail: (id) => api.get(`/inspections/${id}`),
  export: (params) => {
    return axios({
      url: '/api/export/inspections',
      method: 'GET',
      params,
      responseType: 'blob',
    });
  },
};

// 统计相关
export const statisticsAPI = {
  getStats: (params) => api.get('/statistics', { params }),
};

export default api;
