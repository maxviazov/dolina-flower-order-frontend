import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FlowerCard } from '../components/FlowerCard';
import { FlowerFilters } from '../components/FlowerFilters';
import { useFlowersStore } from '../store/useFlowersStore';
import { useOrderStore } from '../store/useOrderStore';
import { Flower, OrderItem } from '../types';

export const FlowersPage: React.FC = () => {
  const navigate = useNavigate();
  const { fetchFlowers, loading, error, getFilteredFlowers } = useFlowersStore();
  const { addItem, orderItems } = useOrderStore();

  useEffect(() => {
    fetchFlowers();
  }, [fetchFlowers]);

  const handleAddToOrder = (flower: Flower) => {
    const orderItem: OrderItem = {
      variety: flower.variety,
      length: flower.length,
      box_count: flower.box_count,
      pack_rate: flower.pack_rate,
      total_stems: flower.total_stems,
      farm_name: flower.farm_name,
      truck_name: flower.truck_name,
      price: flower.price,
    };
    addItem(orderItem);
  };

  const filteredFlowers = getFilteredFlowers();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Загрузка цветов...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-600 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Каталог цветов</h1>
        <div className="flex items-center space-x-4">
          {orderItems.length > 0 && (
            <span className="bg-primary text-white px-3 py-1 rounded-full text-sm">
              В заказе: {orderItems.length}
            </span>
          )}
          <button
            onClick={() => navigate('/create-order')}
            className="bg-primary text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors"
          >
            Создать заказ
          </button>
        </div>
      </div>

      <FlowerFilters />

      {filteredFlowers.length === 0 ? (
        <div className="text-center text-gray-600 mt-8">
          Цветы не найдены
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFlowers.map((flower, index) => (
            <FlowerCard
              key={`${flower.variety}-${flower.farm_name}-${index}`}
              flower={flower}
              onAddToOrder={handleAddToOrder}
            />
          ))}
        </div>
      )}
    </div>
  );
};