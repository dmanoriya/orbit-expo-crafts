'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface EnquiryItem {
  id: string;
  name: string;
  catName?: string;
  q: number;
  image?: string;
  moq?: number;
}

interface EnquiryContextType {
  enquiry: EnquiryItem[];
  addEnquiry: (item: EnquiryItem) => void;
  removeEnquiry: (id: string) => void;
  updateQuantity: (id: string, q: number) => void;
  clearEnquiry: () => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
}

const EnquiryContext = createContext<EnquiryContextType | undefined>(undefined);

export const EnquiryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [enquiry, setEnquiry] = useState<EnquiryItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('orbit_enquiry');
      if (saved) setEnquiry(JSON.parse(saved));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('orbit_enquiry', JSON.stringify(enquiry));
    } catch (e) {
      console.error(e);
    }
  }, [enquiry]);

  const addEnquiry = (item: EnquiryItem) => {
    const minMoq = item.moq || 1;
    const initialQty = Math.max(minMoq, item.q);
    setEnquiry((prev) => {
      const existing = prev.find((x) => x.id === item.id);
      if (existing) {
        return prev.map((x) => (x.id === item.id ? { ...x, q: Math.max(minMoq, x.q + item.q) } : x));
      }
      return [...prev, { ...item, q: initialQty }];
    });
    setIsDrawerOpen(true);
  };

  const removeEnquiry = (id: string) => {
    setEnquiry((prev) => prev.filter((x) => x.id !== id));
  };

  const updateQuantity = (id: string, q: number) => {
    setEnquiry((prev) =>
      prev.map((x) => {
        if (x.id === id) {
          const minMoq = x.moq || 1;
          return { ...x, q: Math.max(minMoq, q) };
        }
        return x;
      })
    );
  };

  const clearEnquiry = () => setEnquiry([]);

  return (
    <EnquiryContext.Provider
      value={{
        enquiry,
        addEnquiry,
        removeEnquiry,
        updateQuantity,
        clearEnquiry,
        isDrawerOpen,
        openDrawer: () => setIsDrawerOpen(true),
        closeDrawer: () => setIsDrawerOpen(false),
      }}
    >
      {children}
    </EnquiryContext.Provider>
  );
};

export const useEnquiry = () => {
  const context = useContext(EnquiryContext);
  if (!context) {
    throw new Error('useEnquiry must be used within an EnquiryProvider');
  }
  return context;
};
