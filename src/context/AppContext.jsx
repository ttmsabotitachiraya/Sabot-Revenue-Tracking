import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { getProjects, getTransactions } from '../services/api';

// -------------------------------------------------------
// Mock data for development (when GAS URL is not set)
// -------------------------------------------------------
const MOCK_PROJECTS = [
  { id: 'P001', name: 'โครงการตรวจสุขภาพประจำปี', department: 'อายุรกรรม', target_revenue: 500000, estimated_cost: 150000, start_date: '2024-01-01', end_date: '2024-12-31', status: 'Active' },
  { id: 'P002', name: 'โครงการผ่าตัดแบบ Daycare', department: 'ศัลยกรรม', target_revenue: 800000, estimated_cost: 300000, start_date: '2024-03-01', end_date: '2024-12-31', status: 'Active' },
  { id: 'P003', name: 'โครงการคลินิกเฉพาะทางหัวใจ', department: 'อายุรกรรม', target_revenue: 1200000, estimated_cost: 400000, start_date: '2024-01-01', end_date: '2024-06-30', status: 'Completed' },
  { id: 'P004', name: 'โครงการกายภาพบำบัดผู้สูงอายุ', department: 'กายภาพบำบัด', target_revenue: 300000, estimated_cost: 80000, start_date: '2024-02-01', end_date: '2024-12-31', status: 'Active' },
];

const MOCK_TRANSACTIONS = [
  { id: 'T001', project_id: 'P001', type: 'Income', amount: 45000, date: '2024-01-15', description: 'รายได้ตรวจสุขภาพ เดือนมกราคม' },
  { id: 'T002', project_id: 'P001', type: 'Cost', amount: 12000, date: '2024-01-20', description: 'ค่าวัสดุสิ้นเปลือง' },
  { id: 'T003', project_id: 'P002', type: 'Income', amount: 85000, date: '2024-03-10', description: 'รายได้ผ่าตัด Daycare เดือนมีนาคม' },
  { id: 'T004', project_id: 'P002', type: 'Cost', amount: 25000, date: '2024-03-15', description: 'ค่าอุปกรณ์ผ่าตัด' },
  { id: 'T005', project_id: 'P003', type: 'Income', amount: 120000, date: '2024-01-31', description: 'รายได้คลินิกหัวใจ เดือนมกราคม' },
  { id: 'T006', project_id: 'P003', type: 'Income', amount: 130000, date: '2024-02-28', description: 'รายได้คลินิกหัวใจ เดือนกุมภาพันธ์' },
  { id: 'T007', project_id: 'P003', type: 'Cost', amount: 40000, date: '2024-02-01', description: 'ค่าตอบแทนแพทย์ผู้เชี่ยวชาญ' },
  { id: 'T008', project_id: 'P001', type: 'Income', amount: 52000, date: '2024-02-15', description: 'รายได้ตรวจสุขภาพ เดือนกุมภาพันธ์' },
  { id: 'T009', project_id: 'P004', type: 'Income', amount: 28000, date: '2024-02-10', description: 'รายได้กายภาพบำบัด เดือนกุมภาพันธ์' },
  { id: 'T010', project_id: 'P004', type: 'Cost', amount: 8000, date: '2024-02-15', description: 'ค่าอุปกรณ์กายภาพ' },
  { id: 'T011', project_id: 'P002', type: 'Income', amount: 92000, date: '2024-04-10', description: 'รายได้ผ่าตัด Daycare เดือนเมษายน' },
  { id: 'T012', project_id: 'P003', type: 'Income', amount: 145000, date: '2024-03-31', description: 'รายได้คลินิกหัวใจ เดือนมีนาคม' },
];

// -------------------------------------------------------
// State Shape
// -------------------------------------------------------
const initialState = {
  projects: [],
  transactions: [],
  loading: false,
  error: null,
  usingMockData: false,
};

// -------------------------------------------------------
// Reducer
// -------------------------------------------------------
function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'SET_MOCK_DATA':
      return { ...state, projects: MOCK_PROJECTS, transactions: MOCK_TRANSACTIONS, usingMockData: true, loading: false };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload] };
    case 'UPDATE_PROJECT_STATUS':
      return {
        ...state,
        projects: state.projects.map(p =>
          p.id === action.payload.id ? { ...p, status: action.payload.status } : p
        ),
      };
    default:
      return state;
  }
}

// -------------------------------------------------------
// Context
// -------------------------------------------------------
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadData = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const gasUrl = import.meta.env.VITE_GAS_URL;
      const isConfigured = gasUrl && !gasUrl.includes('YOUR_SCRIPT_ID');

      if (!isConfigured) {
        // Use mock data when GAS is not configured
        dispatch({ type: 'SET_MOCK_DATA' });
        return;
      }

      const [projects, transactions] = await Promise.all([
        getProjects(),
        getTransactions(),
      ]);
      dispatch({ type: 'SET_PROJECTS', payload: Array.isArray(projects) ? projects : [] });
      dispatch({ type: 'SET_TRANSACTIONS', payload: Array.isArray(transactions) ? transactions : [] });
    } catch (err) {
      console.warn('Failed to load from GAS, using mock data:', err.message);
      dispatch({ type: 'SET_MOCK_DATA' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <AppContext.Provider value={{ state, dispatch, loadData }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { MOCK_PROJECTS, MOCK_TRANSACTIONS };
