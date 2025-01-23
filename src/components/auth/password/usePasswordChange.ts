import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { PasswordFormValues, PasswordChangeResponse, logPasswordChangeAttempt, logPasswordChangeResponse } from "./types";

interface PasswordChangeData {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
  details?: {
    timestamp: string;
    [key: string]: any;
  };
}

const MAX_RETRIES = 3;

export const usePasswordChange = (memberNumber: string, onSuccess?: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const isPasswordChangeData = (data: any): data is PasswordChangeData => {
    return (
      data &&
      typeof data === 'object' &&
      'success' in data &&
      typeof data.success === 'boolean'
    );
  };

  const handlePasswordChange = async (values: PasswordFormValues, retryCount = 0): Promise<PasswordChangeData | null> => {
    if (retryCount >= MAX_RETRIES) {
      console.error("[PasswordChange] Maximum retry attempts reached");
      toast.error("Maximum retry attempts reached. Please try again later.");
      return null;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Changing password...");

    try {
      // Log the attempt
      console.log("[PasswordChange] Starting password change for member:", memberNumber);
      logPasswordChangeAttempt(memberNumber, values);

      const { data: rpcData, error } = await supabase.rpc('handle_password_reset', {
        member_number: memberNumber,
        new_password: values.newPassword,
        current_password: values.currentPassword,
        ip_address: null,
        user_agent: navigator.userAgent,
        client_info: {
          timestamp: new Date().toISOString(),
          browser: navigator.userAgent,
          platform: navigator.platform
        }
      });

      console.log("[PasswordChange] RPC Response:", { 
        success: rpcData?.success,
        error: error?.message,
        code: rpcData?.code,
        timestamp: new Date().toISOString()
      });

      if (error) {
        console.error("[PasswordChange] RPC Error:", error);
        toast.dismiss(toastId);
        
        if (error.code === 'PGRST301' && retryCount < MAX_RETRIES) {
          console.log("[PasswordChange] Retrying due to PGRST301 error");
          return handlePasswordChange(values, retryCount + 1);
        } else {
          toast.error(error.message || "Failed to change password");
        }
        return null;
      }

      if (!isPasswordChangeData(rpcData) || !rpcData.success) {
        console.error("[PasswordChange] Invalid or unsuccessful response:", rpcData);
        toast.dismiss(toastId);
        toast.error(isPasswordChangeData(rpcData) ? rpcData.message || "Failed to change password" : "Invalid response from server");
        return null;
      }

      console.log("[PasswordChange] Success:", rpcData);
      toast.dismiss(toastId);
      toast.success("Password changed successfully");
      
      if (onSuccess) {
        console.log("[PasswordChange] Calling onSuccess callback");
        onSuccess();
      }

      return rpcData;

    } catch (error) {
      console.error("[PasswordChange] Unexpected error:", error);
      toast.dismiss(toastId);
      toast.error("An unexpected error occurred");
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handlePasswordChange
  };
};