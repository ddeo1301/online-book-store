import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/authSlice';
import bookReducer from './features/books/bookSlice';
import userReducer from './features/users/userSlice';
import borrowingReducer from './features/borrowings/borrowingSlice';
import categoryReducer from './features/categories/categorySlice';
import uiReducer from './features/ui/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    books: bookReducer,
    users: userReducer,
    borrowings: borrowingReducer,
    categories: categoryReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
