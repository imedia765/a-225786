import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion } from "@/components/ui/accordion";
import FamilyMemberCard from './FamilyMemberCard';
import { Loader2 } from "lucide-react";

const FamilyMembersList = () => {
  const { data: familyMembers, isLoading } = useQuery({
    queryKey: ['family-members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching family members:', error);
        throw error;
      }

      return data;
    },
  });

  return (
    <div className="space-y-4">
      <header className="mb-8">
        <h2 className="text-2xl font-medium mb-2 text-white">Family Members</h2>
        <p className="text-dashboard-muted">View all registered family members</p>
      </header>

      <ScrollArea className="h-[calc(100vh-16rem)] w-full rounded-md">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-dashboard-accent1" />
          </div>
        ) : (
          <Accordion type="single" collapsible className="space-y-4 px-1">
            {familyMembers?.map((member) => (
              <FamilyMemberCard
                key={member.id}
                name={member.full_name}
                relationship={member.relationship}
                dob={member.date_of_birth}
                gender={member.gender}
                memberNumber={member.family_member_number}
              />
            ))}
          </Accordion>
        )}
      </ScrollArea>
    </div>
  );
};

export default FamilyMembersList;