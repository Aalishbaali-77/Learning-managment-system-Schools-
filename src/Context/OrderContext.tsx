// OrderContext.tsx
import React, { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react';
import { Alert } from 'react-native';

// Define types
interface OrderItemBase {
  id: number;
  checked: boolean;
  quantity: number;
  price: number;
  name: string;
}

interface NotebookItem extends OrderItemBase {
  type: 'notebook';
  subject_name: string;
}

interface BookItem extends OrderItemBase {
  type: 'book';
  author: string;
  publisher: string;
}

interface UniformItem extends OrderItemBase {
  type: 'uniform';
  selectedSize?: {
    id: number;
    size: string;
    price: number;
  };
  description: string;
}

interface OrderDetails {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}

interface OrderState {
    notebooks: NotebookItem[];
    books: BookItem[];
    uniforms: UniformItem[];
    grandTotal: number;
    loading: boolean;
    error: string | null;
  }

  type OrderAction =
  | { type: 'SET_NOTEBOOKS'; payload: NotebookItem[] }
  | { type: 'SET_BOOKS'; payload: BookItem[] }
  | { type: 'SET_UNIFORMS'; payload: UniformItem[] }
  | { type: 'SET_ORDER'; payload: Partial<OrderState> }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'RESET_ORDER' };

interface OrderContextType {
  state: OrderState;
  dispatch: Dispatch<OrderAction>;
}

// Initial state
const initialState: OrderState = {
  notebooks: [],
  books: [],
  uniforms: [],
  orderDetails: {
    firstName: '',
    lastName: '',
    phone: '',
    email: ''
  },
  grandTotal: 0,
  loading: false,
  error: null
};

// Create context
const OrderContext = createContext<OrderContextType>({} as OrderContextType);

// Reducer function
const orderReducer = (state: OrderState, action: OrderAction): OrderState => {
  switch (action.type) {
    case 'SET_NOTEBOOKS':
      return { ...state, notebooks: action.payload };
      
    case 'SET_BOOKS':
      return { ...state, books: action.payload };

    case 'SET_UNIFORMS':
      return { ...state, uniforms: action.payload };

    case 'SET_ORDER':
      return {
        ...state,
        ...action.payload
      };

    case 'SET_LOADING':
      return { ...state, loading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'RESET_ORDER':
      return initialState;

    default:
      return state;
  }
};

// Context Provider
export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(orderReducer, initialState);

  return (
    <OrderContext.Provider value={{ state, dispatch }}>
      {children}
    </OrderContext.Provider>
  );
};

// Custom hook
export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};