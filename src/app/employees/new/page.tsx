import ProtectedRoute from "@/components/ProtectedRoute";
import EmployeeForm from "@/components/EmployeeForm";

function NewEmployeeContent() {
  return <EmployeeForm />;
}

export default function NewEmployeePage() {
  return (
    // only admins and HR can create employees
    <ProtectedRoute allowedRoles={["admin", "hr"]}>
      <NewEmployeeContent />
    </ProtectedRoute>
  );
}