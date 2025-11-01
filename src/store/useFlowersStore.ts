import { create } from 'zustand';
import { Flower } from '../types';
import { flowersApi } from '../services/api';

interface FlowersState {
  flowers: Flower[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  sortBy: 'price' | 'variety' | 'length';
  sortOrder: 'asc' | 'desc';
  filters: {
    variety: string;
    length: string;
    farm: string;
  };
  fetchFlowers: () => Promise<void>;
  setSearchTerm: (term: string) => void;
  setSortBy: (sortBy: 'price' | 'variety' | 'length') => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  setFilters: (filters: Partial<FlowersState['filters']>) => void;
  getFilteredFlowers: () => Flower[];
}

export const useFlowersStore = create<FlowersState>((set, get) => ({
  flowers: [],
  loading: false,
  error: null,
  searchTerm: '',
  sortBy: 'variety',
  sortOrder: 'asc',
  filters: {
    variety: '',
    length: '',
    farm: '',
  },

  fetchFlowers: async () => {
    set({ loading: true, error: null });
    try {
      const flowers = await flowersApi.getFlowers();
      set({ flowers, loading: false });
    } catch (error) {
      set({ error: 'Ошибка загрузки цветов', loading: false });
    }
  },

  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setSortBy: (sortBy) => set({ sortBy }),
  setSortOrder: (sortOrder) => set({ sortOrder }),
  setFilters: (newFilters) => set((state) => ({ 
    filters: { ...state.filters, ...newFilters } 
  })),

  getFilteredFlowers: () => {
    const { flowers, searchTerm, sortBy, sortOrder, filters } = get();
    
    let filtered = flowers.filter((flower) => {
      const matchesSearch = flower.variety.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesVariety = !filters.variety || flower.variety.includes(filters.variety);
      const matchesLength = !filters.length || flower.length.toString().includes(filters.length);
      const matchesFarm = !filters.farm || flower.farm_name.includes(filters.farm);
      
      return matchesSearch && matchesVariety && matchesLength && matchesFarm;
    });

    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'price':
          aValue = a.price || 0;
          bValue = b.price || 0;
          break;
        case 'length':
          aValue = a.length;
          bValue = b.length;
          break;
        default:
          aValue = a.variety;
          bValue = b.variety;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc' 
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return filtered;
  },
}));