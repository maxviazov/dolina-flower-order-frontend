import React from 'react';
import { useFlowersStore } from '../store/useFlowersStore';

export const FlowerFilters: React.FC = () => {
  const {
    searchTerm,
    sortBy,
    sortOrder,
    filters,
    setSearchTerm,
    setSortBy,
    setSortOrder,
    setFilters,
  } = useFlowersStore();

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Поиск по сорту
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Введите название сорта"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Сортировка
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'price' | 'variety' | 'length')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="variety">По названию</option>
            <option value="price">По цене</option>
            <option value="length">По длине</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Порядок
          </label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="asc">По возрастанию</option>
            <option value="desc">По убыванию</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ферма
          </label>
          <input
            type="text"
            value={filters.farm}
            onChange={(e) => setFilters({ farm: e.target.value })}
            placeholder="Название фермы"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>
    </div>
  );
};