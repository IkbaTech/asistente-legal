import { useState, useEffect } from 'react';
import { paypalService } from '../services/paypalService';
import { useAuth } from './useAuth';
import { logger } from '../utils/logger';

interface Payment {
  id: string;
  paypal_order_id: string;
  amount: number;
  currency: string;
  status: string;
  plan_type: string;
  created_at: string;
  updated_at: string;
}

export const usePayments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchPayments = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    setError(null);

    try {
      const data = await paypalService.getUserPayments();
      setPayments(data);
      logger.info('Payments fetched successfully', 'usePayments', { count: data.length });
    } catch (error: any) {
      setError(error.message || 'Error al cargar los pagos');
      logger.error('Error fetching payments', 'usePayments', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [isAuthenticated]);

  const getPaymentsByStatus = (status: string) => {
    return payments.filter(payment => payment.status === status);
  };

  const getCompletedPayments = () => {
    return getPaymentsByStatus('COMPLETED');
  };

  const getPendingPayments = () => {
    return getPaymentsByStatus('CREATED').concat(getPaymentsByStatus('APPROVED'));
  };

  const getTotalSpent = () => {
    return getCompletedPayments().reduce((total, payment) => total + payment.amount, 0);
  };

  const getLastPayment = () => {
    const completedPayments = getCompletedPayments();
    return completedPayments.length > 0 ? completedPayments[0] : null;
  };

  return {
    payments,
    loading,
    error,
    fetchPayments,
    getPaymentsByStatus,
    getCompletedPayments,
    getPendingPayments,
    getTotalSpent,
    getLastPayment
  };
};