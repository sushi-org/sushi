"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { api } from "@/lib/api";

export interface Branch {
  id: string;
  name: string;
}

interface BranchContextValue {
  companyName: string;
  branches: Branch[];
  selectedBranchId: string | null;
  setSelectedBranchId: (id: string | null) => void;
  loading: boolean;
}

const BranchContext = createContext<BranchContextValue>({
  companyName: "",
  branches: [],
  selectedBranchId: null,
  setSelectedBranchId: () => {},
  loading: true,
});

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const companyId = session?.companyId;

  const [companyName, setCompanyName] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!companyId) return;
    try {
      const [company, branchData] = await Promise.all([
        api<{ name: string }>(`/companies/${companyId}`),
        api<Branch[]>(`/companies/${companyId}/branches`),
      ]);
      setCompanyName(company.name);
      setBranches(branchData);
      if (branchData.length > 0 && !selectedBranchId) {
        setSelectedBranchId(branchData[0].id);
      }
    } catch {
      // not available yet
    } finally {
      setLoading(false);
    }
  }, [companyId, selectedBranchId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <BranchContext.Provider
      value={{ companyName, branches, selectedBranchId, setSelectedBranchId, loading }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  return useContext(BranchContext);
}
