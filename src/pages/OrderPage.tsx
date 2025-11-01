import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrderStore } from '../store/useOrderStore';

const statusLabels = {
  pending: 'Ожидает обработки',
  processing: 'В обработке',
  farm_order: 'Заказ на ферме',
  completed: 'Завершен',
  cancelled: 'Отменен',
};

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  farm_order: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export const OrderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentOrder, loading, error, fetchOrder, clearOrder } = useOrderStore();

  useEffect(() => {
    if (id) {
      fetchOrder(id);
    }
    return () => clearOrder();
  }, [id, fetchOrder, clearOrder]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-lg">Загрузка заказа...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-primary hover:text-green-600"
        >
          ← Вернуться к каталогу
        </button>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-gray-600">
          Заказ не найден
        </div>
        <button
          onClick={() => navigate('/')}
          className="mt-4 text-primary hover:text-green-600"
        >
          ← Вернуться к каталогу
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Заказ #{currentOrder.id.slice(0, 8)}</h1>
        <button
          onClick={() => navigate('/')}
          className="text-primary hover:text-green-600"
        >
          ← Вернуться к каталогу
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Информация о заказе */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Информация о заказе</h2>
            
            <div className="space-y-3">
              <div>
                <span className="text-gray-600">Статус:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${statusColors[currentOrder.status]}`}>
                  {statusLabels[currentOrder.status]}
                </span>
              </div>
              
              <div>
                <span className="text-gray-600">Маркировка:</span>
                <span className="ml-2 font-medium">{currentOrder.mark_box}</span>
              </div>
              
              <div>
                <span className="text-gray-600">ID клиента:</span>
                <span className="ml-2 font-mono text-sm">{currentOrder.customer_id}</span>
              </div>
              
              <div>
                <span className="text-gray-600">Создан:</span>
                <span className="ml-2">{new Date(currentOrder.created_at).toLocaleString('ru-RU')}</span>
              </div>
              
              {currentOrder.processed_at && (
                <div>
                  <span className="text-gray-600">Обработан:</span>
                  <span className="ml-2">{new Date(currentOrder.processed_at).toLocaleString('ru-RU')}</span>
                </div>
              )}
              
              {currentOrder.farm_order_id && (
                <div>
                  <span className="text-gray-600">ID заказа фермы:</span>
                  <span className="ml-2 font-mono text-sm">{currentOrder.farm_order_id}</span>
                </div>
              )}
              
              <div className="pt-3 border-t">
                <span className="text-gray-600">Общая сумма:</span>
                <span className="ml-2 text-xl font-bold text-primary">${currentOrder.total_amount.toFixed(2)}</span>
              </div>
            </div>
            
            {currentOrder.notes && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="font-medium text-gray-700 mb-2">Примечания:</h3>
                <p className="text-gray-600 text-sm">{currentOrder.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Список товаров */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Товары в заказе</h2>
            
            <div className="space-y-4">
              {currentOrder.items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.variety}</h3>
                      <p className="text-gray-600">{item.farm_name}</p>
                      
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Длина:</span>
                          <div className="font-medium">{item.length} см</div>
                        </div>
                        <div>
                          <span className="text-gray-500">В коробке:</span>
                          <div className="font-medium">{item.box_count}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Упаковка:</span>
                          <div className="font-medium">{item.pack_rate}</div>
                        </div>
                        <div>
                          <span className="text-gray-500">Стеблей:</span>
                          <div className="font-medium">{item.total_stems}</div>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-sm text-gray-600">
                        Грузовик: {item.truck_name}
                      </div>
                      
                      {item.comments && (
                        <div className="mt-2 text-sm">
                          <span className="text-gray-500">Комментарий:</span>
                          <div className="text-gray-700">{item.comments}</div>
                        </div>
                      )}
                    </div>
                    
                    {item.price && (
                      <div className="text-right ml-4">
                        <div className="text-sm text-gray-500">Цена за шт.</div>
                        <div className="font-semibold">${item.price}</div>
                        <div className="text-sm text-gray-500">Итого:</div>
                        <div className="font-bold text-primary">${(item.price * item.total_stems).toFixed(2)}</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};