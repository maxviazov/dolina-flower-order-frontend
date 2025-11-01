import React from 'react';
import { Flower } from '../types';

interface FlowerCardProps {
  flower: Flower;
  onAddToOrder: (flower: Flower) => void;
}

export const FlowerCard: React.FC<FlowerCardProps> = ({ flower, onAddToOrder }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{flower.variety}</h3>
        <p className="text-sm text-gray-600">{flower.farm_name}</p>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Длина:</span>
          <span>{flower.length} см</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">В коробке:</span>
          <span>{flower.box_count}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Упаковка:</span>
          <span>{flower.pack_rate}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Всего стеблей:</span>
          <span>{flower.total_stems}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Грузовик:</span>
          <span>{flower.truck_name}</span>
        </div>
        {flower.price && (
          <div className="flex justify-between font-semibold">
            <span className="text-gray-600">Цена:</span>
            <span className="text-primary">${flower.price}</span>
          </div>
        )}
      </div>
      
      <button
        onClick={() => onAddToOrder(flower)}
        className="w-full mt-4 bg-primary text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors"
      >
        Добавить в заказ
      </button>
    </div>
  );
};