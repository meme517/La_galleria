import React, { useState, useEffect } from 'react';
import { ClipboardDocumentListIcon, ClockIcon, CheckCircleIcon, TruckIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Order } from '../../types';
import { apiService } from '../../services/api';

const OrderManagement: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const data = await apiService.getOrders();
                setOrders(data);
            } catch (err) {
                setError('Failed to load orders');
                console.error('Error fetching orders:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const getStatusIcon = (status: Order['status']) => {
        switch (status) {
            case 'pending': return ClockIcon;
            case 'preparing': return ClipboardDocumentListIcon;
            case 'ready': return CheckCircleIcon;
            case 'delivered': return TruckIcon;
            default: return XCircleIcon;
        }
    };

    const getStatusColor = (status: Order['status']) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'preparing': return 'bg-blue-100 text-blue-800';
            case 'ready': return 'bg-green-100 text-green-800';
            case 'delivered': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const columns = [
        { id: 'pending', title: 'Pending', status: 'pending' as const },
        { id: 'preparing', title: 'Preparing', status: 'preparing' as const },
        { id: 'ready', title: 'Ready', status: 'ready' as const },
        { id: 'delivered', title: 'Delivered', status: 'delivered' as const },
    ];

    const getOrdersByStatus = (status: Order['status']) => {
        return orders.filter(order => order.status === status);
    };

    return (
        <div className="bg-white/80 rounded-2xl border border-gray-200/60 shadow-sm backdrop-blur">
            <div className="p-6 border-b border-gray-200/60">
                <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
                <p className="text-gray-600 mt-1">Process and track customer orders</p>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                    {columns.map((column) => {
                        const ordersInColumn = getOrdersByStatus(column.status);
                        const StatusIcon = getStatusIcon(column.status);

                        return (
                            <div key={column.id} className="bg-white/90 rounded-xl p-4 border border-gray-200/60 shadow-sm">
                                <div className="flex items-center mb-4">
                                    <StatusIcon className="h-5 w-5 text-gray-600 mr-2" />
                                    <h3 className="text-lg font-medium text-gray-900">{column.title}</h3>
                                    <span className="ml-auto bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                                        {ordersInColumn.length}
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {ordersInColumn.map((order) => (
                                        <div key={order.id} className="bg-white rounded-lg p-3 border border-gray-200 shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <h4 className="text-sm font-medium text-gray-900">{order.customer.name}</h4>
                                                    <p className="text-xs text-gray-500">Order #{order.id}</p>
                                                </div>
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            </div>

                                            <div className="mb-2">
                                                <p className="text-xs text-gray-600 mb-1">Items:</p>
                                                <ul className="text-xs text-gray-700">
                                                    {order.items.map((item, index) => (
                                                        <li key={index} className="truncate">• {item.menuItem.name} x{item.quantity}</li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="flex justify-between items-center">
                                                <span className="text-sm font-medium text-gray-900">${order.totalAmount.toFixed(2)}</span>
                                                <span className="text-xs text-gray-500 text-right">
                                                    {order.requestedTime ? (
                                                        <span className="block">Requested: {order.requestedTime}</span>
                                                    ) : null}
                                                    <span className="block">{new Date(order.createdAt).toLocaleTimeString()}</span>
                                                </span>
                                            </div>
                                        </div>
                                    ))}

                                    {ordersInColumn.length === 0 && (
                                        <div className="text-center py-8 text-gray-400">
                                            <StatusIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                            <p className="text-sm">No orders</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default OrderManagement;
