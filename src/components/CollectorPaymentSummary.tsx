import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { Loader2, Receipt, CreditCard, PoundSterling, Users, AlertCircle } from "lucide-react";
import { formatDate } from "@/lib/dateFormat";

interface PaymentSummaryProps {
  collectorName: string | null;
}

const CollectorPaymentSummary = ({ collectorName }: PaymentSummaryProps) => {
  const { data: paymentStats, isLoading } = useQuery({
    queryKey: ['collector-payments', collectorName],
    queryFn: async () => {
      if (!collectorName) return null;
      
      console.log('Fetching payment stats for collector:', collectorName);
      
      // Fetch members data
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select(`
          yearly_payment_status,
          emergency_collection_status,
          yearly_payment_amount,
          emergency_collection_amount,
          yearly_payment_due_date,
          payment_date,
          payment_type,
          status,
          created_at,
          id
        `)
        .eq('collector', collectorName);

      // Fetch family members data
      const { data: familyMembers, error: familyError } = await supabase
        .from('family_members')
        .select('*')
        .in('member_id', members?.map(m => m.id) || []);

      // Fetch pending payments for this collector
      const { data: pendingPayments, error: pendingError } = await supabase
        .from('payment_requests')
        .select('amount, collector_id, members_collectors!payment_requests_collector_id_fkey(name)')
        .eq('status', 'pending')
        .eq('members_collectors.name', collectorName);
      
      if (membersError || pendingError || familyError) {
        console.error('Error fetching payment stats:', membersError || pendingError || familyError);
        throw membersError || pendingError || familyError;
      }

      const currentDate = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const totalFamilyMembers = familyMembers?.length || 0;
      const totalMembers = (members?.length || 0) + totalFamilyMembers;

      const stats = {
        totalMembers,
        totalDirectMembers: members?.length || 0,
        totalFamilyMembers,
        pendingPayments: {
          count: pendingPayments?.length || 0,
          amount: pendingPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
        },
        yearlyPayments: {
          completed: members?.filter(m => m.yearly_payment_status === 'completed').length || 0,
          pending: members?.filter(m => m.yearly_payment_status === 'pending').length || 0,
          totalCollected: members?.reduce((sum, m) => 
            m.yearly_payment_status === 'completed' ? sum + (m.yearly_payment_amount || 40) : sum, 0
          ) || 0,
          nextDueDate: members?.reduce((earliest, m) => {
            if (!m.yearly_payment_due_date) return earliest;
            return !earliest || new Date(m.yearly_payment_due_date) < new Date(earliest)
              ? m.yearly_payment_due_date
              : earliest;
          }, null as string | null),
          overdue: members?.filter(m => 
            m.yearly_payment_due_date && 
            new Date(m.yearly_payment_due_date) < currentDate && 
            m.yearly_payment_status !== 'completed'
          ).length || 0,
        },
        emergencyCollections: {
          completed: members?.filter(m => m.emergency_collection_status === 'completed').length || 0,
          pending: members?.filter(m => m.emergency_collection_status === 'pending').length || 0,
          totalCollected: members?.reduce((sum, m) => 
            m.emergency_collection_status === 'completed' ? sum + (m.emergency_collection_amount || 0) : sum, 0
          ) || 0,
        },
        recentActivity: {
          lastPaymentDate: members?.reduce((latest, m) => {
            if (!m.payment_date) return latest;
            return !latest || new Date(m.payment_date) > new Date(latest)
              ? m.payment_date
              : latest;
          }, null as string | null),
          recentPayments: members?.filter(m => 
            m.payment_date && 
            new Date(m.payment_date) > thirtyDaysAgo
          ).length || 0,
        },
        membershipStats: {
          active: members?.filter(m => m.status === 'active').length || 0,
          inactive: members?.filter(m => m.status === 'inactive').length || 0,
          newMembers: members?.filter(m => 
            new Date(m.created_at) > thirtyDaysAgo
          ).length || 0,
        }
      };

      console.log('Payment stats:', stats);
      return stats;
    },
    enabled: !!collectorName,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-dashboard-accent1" />
      </div>
    );
  }

  if (!paymentStats) return null;

  const yearlyPaymentPercentage = Math.round(
    (paymentStats.yearlyPayments.completed / paymentStats.totalDirectMembers) * 100
  );

  const emergencyPaymentPercentage = Math.round(
    (paymentStats.emergencyCollections.completed / paymentStats.totalDirectMembers) * 100
  );

  const totalYearlyAmount = paymentStats.totalDirectMembers * 40;
  const collectedYearlyAmount = paymentStats.yearlyPayments.totalCollected;
  const remainingMembers = paymentStats.totalDirectMembers - paymentStats.yearlyPayments.completed;

  return (
    <div className="space-y-6">
      <Card className="glass-card p-6">
        <h3 className="text-xl font-medium text-white mb-6">Payment Collection Summary</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-dashboard-accent1" />
              <h4 className="text-dashboard-accent1 font-medium">Yearly Payments</h4>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">
                  £{collectedYearlyAmount} / £{totalYearlyAmount}
                </p>
                <p className="text-sm text-dashboard-muted">Amount collected</p>
                <p className="text-sm text-dashboard-warning font-medium mt-1">
                  {remainingMembers} {remainingMembers === 1 ? 'member' : 'members'} remaining
                </p>
                {paymentStats.yearlyPayments.nextDueDate && (
                  <p className="text-sm text-dashboard-accent2 mt-2">
                    Next due: {formatDate(paymentStats.yearlyPayments.nextDueDate)}
                  </p>
                )}
                <p className="text-sm text-dashboard-error mt-1">
                  {paymentStats.yearlyPayments.overdue} overdue payments
                </p>
              </div>
              <div className="w-16 h-16">
                <CircularProgressbar
                  value={yearlyPaymentPercentage}
                  text={`${yearlyPaymentPercentage}%`}
                  styles={buildStyles({
                    textSize: '1.5rem',
                    pathColor: '#9B87F5',
                    textColor: '#9B87F5',
                    trailColor: 'rgba(255,255,255,0.1)',
                  })}
                />
              </div>
            </div>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="w-5 h-5 text-dashboard-accent2" />
              <h4 className="text-dashboard-accent2 font-medium">Emergency Collections</h4>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-white">
                  £{paymentStats.emergencyCollections.totalCollected}
                </p>
                <p className="text-sm text-dashboard-muted">Total collected</p>
                <p className="text-sm text-dashboard-accent1 mt-1">
                  {paymentStats.emergencyCollections.completed}/{paymentStats.totalDirectMembers} members paid
                </p>
                {paymentStats.recentActivity.lastPaymentDate && (
                  <p className="text-sm text-dashboard-accent2 mt-2">
                    Last payment: {formatDate(paymentStats.recentActivity.lastPaymentDate)}
                  </p>
                )}
              </div>
              <div className="w-16 h-16">
                <CircularProgressbar
                  value={emergencyPaymentPercentage}
                  text={`${emergencyPaymentPercentage}%`}
                  styles={buildStyles({
                    textSize: '1.5rem',
                    pathColor: '#7E69AB',
                    textColor: '#7E69AB',
                    trailColor: 'rgba(255,255,255,0.1)',
                  })}
                />
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="glass-card p-6">
        <h3 className="text-xl font-medium text-white mb-6">Additional Statistics</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-dashboard-accent1" />
              <h4 className="text-dashboard-accent1 font-medium">Membership Status</h4>
            </div>
            <p className="text-xl font-bold text-white">
              {paymentStats.totalMembers} Total Members
            </p>
            <p className="text-sm text-dashboard-muted">
              {paymentStats.totalDirectMembers} Direct Members
            </p>
            <p className="text-sm text-dashboard-muted">
              {paymentStats.totalFamilyMembers} Family Members
            </p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <PoundSterling className="w-5 h-5 text-dashboard-accent2" />
              <h4 className="text-dashboard-accent2 font-medium">Pending Payments</h4>
            </div>
            <p className="text-xl font-bold text-white">
              £{paymentStats?.pendingPayments.amount || 0}
            </p>
            <p className="text-sm text-dashboard-muted">
              {paymentStats?.pendingPayments.count || 0} payments pending
            </p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-5 h-5 text-dashboard-accent1" />
              <h4 className="text-dashboard-accent1 font-medium">New Members</h4>
            </div>
            <p className="text-xl font-bold text-white">
              {paymentStats?.membershipStats.newMembers}
            </p>
            <p className="text-sm text-dashboard-muted">Last 30 days</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CollectorPaymentSummary;