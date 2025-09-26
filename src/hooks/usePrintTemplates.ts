"use client";

import { useState, useEffect } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export interface PrintTemplate {
  id: number;
  name: string;
  description?: string;
  template_type: string;
  content: string;
  variables?: Record<string, any>;
  page_size?: string; // A7, A6, A5, A4, etc.
  page_width?: number; // mm
  page_height?: number; // mm
  is_active: boolean;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

/**
 * Hook để fetch print templates từ database
 * @param templateType - Loại template cần lấy (purchase_order, invoice, etc.)
 * @returns Object chứa templates, loading state và error
 */
export const usePrintTemplates = (templateType: string) => {
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from("glt_print_templates")
          .select("*")
          .eq("template_type", templateType)
          .eq("is_active", true)
          .order("is_default", { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        setTemplates(data || []);
      } catch (err) {
        console.error("Error fetching print templates:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    if (templateType) {
      fetchTemplates();
    }
  }, [templateType, supabase]);

  return { templates, loading, error };
};

/**
 * Hook để lấy template mặc định cho một loại template
 * @param templateType - Loại template cần lấy
 * @returns Template mặc định hoặc null
 */
export const useDefaultPrintTemplate = (templateType: string) => {
  const { templates, loading, error } = usePrintTemplates(templateType);

  const defaultTemplate =
    templates.find((t) => t.is_default) || templates[0] || null;

  return {
    template: defaultTemplate,
    loading,
    error,
  };
};
