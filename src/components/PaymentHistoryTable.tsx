import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle } from "lucide-react";

interface Payment {
  id: string;
  date: string;
  type: string;
  amount: number;
  status: string;
}

const PaymentHistoryTable = () => {
  const { data: payments = [], isLoading, error } = useQuery({
    queryKey: ['payment-history'],
    queryFn: async () => {
      console.log('Fetching payment history...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.error('No user session found');
        throw new Error('No user logged in');
      }

      // First get the member number from the user metadata
      const { data: { user } } = await supabase.auth.getUser();
      const memberNumber = user?.user_metadata?.member_number;
      
      console.log('Member number from metadata:', memberNumber);
      
      if (!memberNumber) {
        console.error('No member number found in user metadata');
        throw new Error('Member number not found');
      }

      // Fetch payment requests for this member
      const { data, error } = await supabase
        .from('payment_requests')
        .select('*')
        .eq('member_number', memberNumber)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payment requests:', error);
        throw error;
      }

      console.log('Fetched payment requests:', data);

      // Transform the data to match our Payment interface
      return data.map(payment => ({
        id: payment.id,
        date: payment.created_at,
        type: payment.payment_type,
        amount: payment.amount,
        status: payment.status
      }));
    },
  });

  if (isLoading) {
    return (
      <div className="glass-card p-4">
        <h3 className="text-xl font-semibold mb-4 text-white">Payment History</h3>
        <div className="text-white">Loading payment history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card p-4">
        <h3 className="text-xl font-semibold mb-4 text-white">Payment History</h3>
        <div className="text-red-500">Error loading payment history: {error.message}</div>
      </div>
    );
  }

  if (!payments.length) {
    return (
      <div className="glass-card p-4">
        <h3 className="text-xl font-semibold mb-4 text-white">Payment History</h3>
        <div className="flex items-center gap-2 text-white">
          <AlertCircle className="h-4 w-4" />
          <span>No payment history found. New payments will appear here once processed.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4">
      <h3 className="text-xl font-semibold mb-4 text-white">Payment History</h3>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell>{format(new Date(payment.date), 'PPP')}</TableCell>
                <TableCell>{payment.type}</TableCell>
                <TableCell className="text-dashboard-accent3">
                  <span className="text-dashboard-accent3">£</span>{payment.amount}
                </TableCell>
                <TableCell>{payment.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default PaymentHistoryTable;