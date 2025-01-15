import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import MetricCard from './MetricCard';
import { Loader2 } from 'lucide-react';

const DashboardView = () => {
  const { data: memberStats, isLoading: membersLoading } = useQuery({
    queryKey: ['memberStats'],
    queryFn: async () => {
      const { data: members, error: membersError } = await supabase
        .from('members')
        .select('*');
      
      if (membersError) throw membersError;
      
      return {
        total: members.length,
        active: members.filter(m => m.status === 'active').length,
        verified: members.filter(m => m.verified).length
      };
    }
  });

  const { data: familyStats, isLoading: familyLoading } = useQuery({
    queryKey: ['familyStats'],
    queryFn: async () => {
      const { data: familyMembers, error: familyError } = await supabase
        .from('family_members')
        .select('relationship');
      
      if (familyError) throw familyError;
      
      return {
        total: familyMembers.length,
        spouses: familyMembers.filter(fm => fm.relationship === 'spouse').length,
        dependants: familyMembers.filter(fm => fm.relationship === 'dependant').length
      };
    }
  });

  if (membersLoading || familyLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-8 w-8 animate-spin text-dashboard-accent1" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-medium mb-2 text-white">Dashboard</h1>
        <p className="text-dashboard-muted">Overview of system statistics</p>
      </header>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList className="grid grid-cols-2 gap-4 bg-dashboard-card p-1">
          <TabsTrigger 
            value="members"
            className="data-[state=active]:bg-dashboard-accent1 data-[state=active]:text-white"
          >
            Members
          </TabsTrigger>
          <TabsTrigger 
            value="family"
            className="data-[state=active]:bg-dashboard-accent1 data-[state=active]:text-white"
          >
            Family Members
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Members"
              value={memberStats?.total || 0}
              color="#22c55e"
              details="Total number of registered members"
            />
            <MetricCard
              title="Active Members"
              value={(memberStats?.active / (memberStats?.total || 1) * 100) || 0}
              color="#3b82f6"
              details="Percentage of active members"
              threshold={80}
            />
            <MetricCard
              title="Verified Members"
              value={(memberStats?.verified / (memberStats?.total || 1) * 100) || 0}
              color="#f59e0b"
              details="Percentage of verified members"
              threshold={90}
            />
          </div>
        </TabsContent>

        <TabsContent value="family" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Family Members"
              value={familyStats?.total || 0}
              color="#22c55e"
              details="Total number of registered family members"
            />
            <MetricCard
              title="Spouses"
              value={(familyStats?.spouses / (familyStats?.total || 1) * 100) || 0}
              color="#3b82f6"
              details="Percentage of spouse relationships"
            />
            <MetricCard
              title="Dependants"
              value={(familyStats?.dependants / (familyStats?.total || 1) * 100) || 0}
              color="#f59e0b"
              details="Percentage of dependant relationships"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardView;