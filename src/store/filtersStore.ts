import { create } from 'zustand';

import type { ListingCategory, ListingCondition, ListingSize } from '@/types/models';

export interface SearchFilters {
  query: string;
  category: ListingCategory | null;
  size: ListingSize | null;
  condition: ListingCondition | null;
  city: string;
  maxPrice: number | null;
}

interface FiltersState extends SearchFilters {
  setQuery: (query: string) => void;
  setCategory: (category: ListingCategory | null) => void;
  setSize: (size: ListingSize | null) => void;
  setCondition: (condition: ListingCondition | null) => void;
  setCity: (city: string) => void;
  setMaxPrice: (maxPrice: number | null) => void;
  reset: () => void;
}

const initialFilters: SearchFilters = {
  query: '',
  category: null,
  size: null,
  condition: null,
  city: '',
  maxPrice: null,
};

export const useFiltersStore = create<FiltersState>((set) => ({
  ...initialFilters,
  setQuery: (query) => set({ query }),
  setCategory: (category) => set({ category }),
  setSize: (size) => set({ size }),
  setCondition: (condition) => set({ condition }),
  setCity: (city) => set({ city }),
  setMaxPrice: (maxPrice) => set({ maxPrice }),
  reset: () => set(initialFilters),
}));
