import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        error: null
      };
    case 'AUTH_FAIL':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Set auth token header
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  };

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      if (state.token) {
        setAuthToken(state.token);
        try {
          const res = await axios.get('/api/auth/me');
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: res.data.data,
              token: state.token
            }
          });
        } catch (error) {
          dispatch({ type: 'AUTH_FAIL', payload: 'Token is invalid' });
          setAuthToken(null);
        }
      } else {
        dispatch({ type: 'AUTH_FAIL', payload: null });
      }
    };

    loadUser();
  }, [state.token]);

  // Login user
  const login = async (email, password) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { user, token } = res.data.data;
      
      setAuthToken(token);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      });
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'AUTH_FAIL', payload: message });
      return { success: false, error: message };
    }
  };

  // Register user
  const register = async (userData) => {
    dispatch({ type: 'AUTH_START' });
    try {
      const res = await axios.post('/api/auth/register', userData);
      const { user, token } = res.data.data;
      
      setAuthToken(token);
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: { user, token }
      });
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'AUTH_FAIL', payload: message });
      return { success: false, error: message };
    }
  };

  // Logout user
  const logout = () => {
    setAuthToken(null);
    dispatch({ type: 'LOGOUT' });
  };

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const res = await axios.put('/api/auth/profile', profileData);
      dispatch({ type: 'UPDATE_USER', payload: res.data.data });
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      return { success: false, error: message };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    user: state.user,
    token: state.token,
    isAuthenticated: state.isAuthenticated,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    updateProfile,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
