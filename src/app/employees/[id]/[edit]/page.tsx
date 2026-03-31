"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getEmployee } from "@/lib/api";
import { Employee } from "@/types/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import EmployeeForm from "@/components/EmployeeForm";
import AvatarUpload from "@/components/AvatarUpload";

function EditEmployeeContent() {
  const params = useParams();
  const id = Number(params.id);

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getEmployee(id)
      .then(setEmployee)
      .catch(() => setError("Employee not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <div className="app-page"><p className="form-error">{error}</p></div>;
  if (!employee) return null;

  return (
    <div className="app-page app-page-tight app-stack">
      <div>
        <AvatarUpload
          employeeId={employee.id}
          currentAvatarUrl={employee.avatar_url}
          employeeName={`${employee.first_name} ${employee.last_name}`}
          onUploadSuccess={(newUrl) =>
            setEmployee((prev) => prev ? { ...prev, avatar_url: newUrl } : prev)
          }
        />
      </div>

      <EmployeeForm existing={employee} />
    </div>
  );
}

export default function EditEmployeePage() {
  return (
    <ProtectedRoute allowedRoles={["admin", "hr"]}>
      <EditEmployeeContent />
    </ProtectedRoute>
  );
}