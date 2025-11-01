import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useOrderStore } from '../store/useOrderStore';

interface OrderFormData {
  markBox: string;
  customerId: string;
  notes: string;
}

export const CreateOrderPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    orderItems,
    loading,
    error,
    removeItem,
    setOrderForm,
    createOrder,
    getTotalAmount,
  } = useOrderStore();

  const { register, handleSubmit, formState: { errors } } = useForm<OrderFormData>();

  const onSubmit = async (data: OrderFormData) => {
    setOrderForm(data);
    const orderId = await createOrder();
    if (orderId) {
      navigate(`/orders/${orderId}`);
    }
  };

  const totalAmount = getTotalAmount();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Создание заказа</h1>
        <button
          onClick={() => navigate('/')}
          className="text-primary hover:text-green-600"
        >
          ← Вернуться к каталогу
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Список товаров */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Товары в заказе</h2>
          
          {orderItems.length === 0 ? (
            <p className="text-gray-600">Заказ пуст. Добавьте цветы из каталога.</p>
          ) : (
            <div className="space-y-4">
              {orderItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.variety}</h3>
                      <p className="text-sm text-gray-600">{item.farm_name}</p>
                      <div className="mt-2 text-sm space-y-1">
                        <div>Длина: {item.length} см</div>
                        <div>Стеблей: {item.total_stems}</div>
                        {item.price && (
                          <div className="font-semibold">
                            Цена: ${item.price} × {item.total_stems} = ${(item.price * item.total_stems).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-800 ml-4"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-4">
                <div className="text-xl font-bold">
                  Общая сумма: ${totalAmount.toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Форма заказа */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Информация о заказе</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Маркировка коробки *
              </label>
              <input
                {...register('markBox', { required: 'Обязательное поле' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Например: VVA"
              />
              {errors.markBox && (
                <p className="text-red-600 text-sm mt-1">{errors.markBox.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ID клиента *
              </label>
              <input
                {...register('customerId', { required: 'Обязательное поле' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="UUID клиента"
              />
              {errors.customerId && (
                <p className="text-red-600 text-sm mt-1">{errors.customerId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Примечания
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Дополнительные комментарии к заказу"
              />
            </div>

            <button
              type="submit"
              disabled={loading || orderItems.length === 0}
              className="w-full bg-primary text-white py-3 px-4 rounded-md hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Создание заказа...' : 'Создать заказ'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};